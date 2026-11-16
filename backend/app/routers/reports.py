"""
Reports Router
==============
Endpoints for psychologists to view and download clinical reports.
PDF generation uses ReportLab for a professional clinical layout.
"""

import os
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.core.database import get_collection
from app.core.dependencies import get_current_psychologist, get_current_user, verify_patient_access, get_any_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


def parse_doc(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


# ─── Psychologist: list & fetch ────────────────────────────────────────────────

@router.get("")
async def get_all_reports(psych: dict = Depends(get_current_psychologist)):
    users = get_collection("users")
    reports = get_collection("reports")

    assigned = await users.find({"psychologist_id": psych["id"]}, {"_id": 1}).to_list(1000)
    patient_ids = [str(u["_id"]) for u in assigned]
    if not patient_ids:
        return []

    cursor = reports.find({"user_id": {"$in": patient_ids}}).sort("created_at", -1)
    return [parse_doc(doc) for doc in await cursor.to_list(1000)]


@router.get("/my")
async def get_my_reports(user: dict = Depends(get_current_user)):
    """Returns all clinical reports for the currently logged-in patient."""
    reports = get_collection("reports")
    cursor = reports.find({"user_id": user["id"]}).sort("created_at", -1)
    return [parse_doc(doc) for doc in await cursor.to_list(200)]


@router.get("/my/{id}")
async def get_my_report(id: str, user: dict = Depends(get_current_user)):
    """Patient views a single stored report — no regeneration."""
    reports = get_collection("reports")
    report = await reports.find_one({"_id": ObjectId(id), "user_id": user["id"]})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return parse_doc(report)


@router.get("/{id}")
async def get_report(id: str, psych: dict = Depends(get_current_psychologist)):
    reports = get_collection("reports")
    report = await reports.find_one({"_id": ObjectId(id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    await verify_patient_access(psych["id"], report.get("user_id", ""))
    return parse_doc(report)


# ─── PDF Download ─────────────────────────────────────────────────────────────

@router.get("/download/{id}")
async def download_report(id: str, actor: dict = Depends(get_any_current_user)):
    """
    Generate and stream a professional clinical PDF report.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable
    )

    reports = get_collection("reports")
    report = await reports.find_one({"_id": ObjectId(id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Validate access based on role
    role = actor.get("role")
    if role == "user":
        if report.get("user_id") != actor["id"]:
            raise HTTPException(status_code=403, detail="You do not have access to this report")
    elif role == "psychologist":
        await verify_patient_access(actor["id"], report.get("user_id", ""))
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    os.makedirs("downloads", exist_ok=True)
    pdf_path = f"downloads/report_{id}.pdf"

    # ── Helpers ──────────────────────────────────────────────────────────────
    TEAL   = colors.HexColor("#00BCD4")
    PURPLE = colors.HexColor("#7C3AED")
    RED    = colors.HexColor("#EF4444")
    ORANGE = colors.HexColor("#F97316")
    YELLOW = colors.HexColor("#CA8A04")
    GREEN  = colors.HexColor("#16A34A")
    GREY   = colors.HexColor("#374151")
    LIGHT  = colors.HexColor("#F3F4F6")

    RISK_COLOR = {
        "Critical": RED,
        "High":     ORANGE,
        "Moderate": YELLOW,
        "Low":      GREEN,
    }

    def risk_color(level: str) -> colors.Color:
        return RISK_COLOR.get(level, GREY)

    def fmt_date(val) -> str:
        if not val:
            return "N/A"
        try:
            if isinstance(val, datetime):
                return val.strftime("%B %d, %Y  %H:%M UTC")
            return str(val)
        except Exception:
            return str(val)

    # ── Document setup ────────────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title", parent=styles["Normal"],
        fontSize=22, fontName="Helvetica-Bold", textColor=TEAL, spaceAfter=2
    )
    sub_style = ParagraphStyle(
        "sub", parent=styles["Normal"],
        fontSize=9, textColor=GREY, spaceAfter=10
    )
    section_style = ParagraphStyle(
        "section", parent=styles["Normal"],
        fontSize=12, fontName="Helvetica-Bold", textColor=PURPLE,
        spaceBefore=14, spaceAfter=6
    )
    body_style = ParagraphStyle(
        "body", parent=styles["Normal"],
        fontSize=10, leading=14, textColor=GREY
    )
    small_style = ParagraphStyle(
        "small", parent=styles["Normal"],
        fontSize=8, textColor=colors.HexColor("#6B7280")
    )

    def kv_table(rows, col_widths=None):
        """Build a two-column key-value table."""
        col_widths = col_widths or [70 * mm, 100 * mm]
        data = [[Paragraph(f"<b>{k}</b>", body_style),
                 Paragraph(str(v), body_style)] for k, v in rows]
        t = Table(data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, -1), LIGHT),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT]),
            ("GRID",        (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
            ("TOPPADDING",  (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        return t

    # ── Build story ───────────────────────────────────────────────────────────
    acgf  = report.get("acgf",  {}) or {}
    mhti  = report.get("mhti",  {}) or {}
    cpa   = report.get("cpa",   {}) or {}
    t_emo = report.get("text_emotion",   {}) or {}
    s_emo = report.get("speech_emotion", {}) or {}
    risk  = mhti.get("risk_level", "N/A")

    story = []

    # Header
    story.append(Paragraph("MindCare — Clinical Mental Health Assessment", title_style))
    story.append(Paragraph(
        f"Report ID: {id}   •   Generated: {fmt_date(datetime.utcnow())}   •   CONFIDENTIAL",
        small_style
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceAfter=10))

    # ── Section 1: Patient & Session ─────────────────────────────────────────
    story.append(Paragraph("1.  Patient & Session Information", section_style))
    story.append(kv_table([
        ("Patient ID",      report.get("user_id",      "N/A")),
        ("Journal Type",    report.get("journal_type", "N/A").capitalize()),
        ("Session Date",    fmt_date(report.get("created_at"))),
        ("Journal ID",      report.get("journal_id",   "N/A")),
    ]))
    story.append(Spacer(1, 8))

    # ── Section 2: Transcript / Content ──────────────────────────────────────
    transcript = report.get("transcript", "")
    if transcript:
        story.append(Paragraph("2.  Journal Content / Transcript", section_style))
        story.append(Paragraph(transcript, body_style))
        story.append(Spacer(1, 8))

    # ── Section 3: AI Emotion Analysis ───────────────────────────────────────
    story.append(Paragraph("3.  AI Emotion Analysis", section_style))

    emo_rows = [("Text Emotion (DistilBERT)",
                 f"{t_emo.get('emotion', 'N/A')}  "
                 f"(confidence: {t_emo.get('confidence', 0):.2%})")]
    if s_emo and s_emo.get("emotion"):
        emo_rows.append(
            ("Speech Emotion (Wav2Vec2)",
             f"{s_emo.get('emotion', 'N/A')}  "
             f"(confidence: {s_emo.get('confidence', 0):.2%})")
        )
    story.append(kv_table(emo_rows))
    story.append(Spacer(1, 8))

    # ── Section 4: ACGF Fusion ────────────────────────────────────────────────
    if acgf.get("final_emotion"):
        story.append(Paragraph(
            "4.  Adaptive Confidence-Guided Fusion (ACGF)", section_style))
        story.append(kv_table([
            ("Dominant Modality",  acgf.get("dominant_modality", "Text")),
            ("Final Fused Emotion", acgf.get("final_emotion",    "N/A")),
            ("Fusion Confidence",   f"{acgf.get('fusion_confidence', 0):.2%}"),
        ]))
        story.append(Spacer(1, 8))

    # ── Section 5: MHTI ───────────────────────────────────────────────────────
    story.append(Paragraph("5.  Mental Health Trajectory Index (MHTI)", section_style))
    story.append(kv_table([
        ("MHTI Score",    f"{mhti.get('mhti_score', 'N/A')} / 100"),
        ("Severity Score", mhti.get("severity_score", "N/A")),
        ("Risk Level",    risk),
    ]))
    story.append(Spacer(1, 8))

    # ── Section 6: CPA ───────────────────────────────────────────────────────
    story.append(Paragraph("6.  Clinical Priority Assessment (CPA)", section_style))
    story.append(kv_table([
        ("Clinical Priority",     cpa.get("clinical_priority",  "N/A")),
        ("Monitoring Frequency",  cpa.get("monitoring_frequency","N/A")),
        ("Clinical Recommendation", cpa.get("recommendation",   "N/A")),
    ]))
    story.append(Spacer(1, 14))

    # ── Risk Banner ───────────────────────────────────────────────────────────
    banner_color = risk_color(risk)
    banner_data  = [[Paragraph(
        f"<b>OVERALL RISK CLASSIFICATION:  {risk.upper()}</b>",
        ParagraphStyle("banner", parent=styles["Normal"],
                       fontSize=13, textColor=colors.white, fontName="Helvetica-Bold")
    )]]
    banner = Table(banner_data, colWidths=[170 * mm])
    banner.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), banner_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(banner)
    story.append(Spacer(1, 14))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#D1D5DB")))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "This report was generated automatically by the MindCare AI Clinical Assessment System. "
        "It is intended for use by licensed mental health professionals only and should not "
        "replace clinical judgement. All data is handled in accordance with applicable privacy "
        "regulations.",
        small_style
    ))

    doc.build(story)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"MindCare_Report_{id[:8]}.pdf",
    )
