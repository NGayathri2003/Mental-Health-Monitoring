def run_cpa(risk_level: str):
    if risk_level == "Critical":
        priority = "Priority 1 - Immediate Psychological Intervention"
        monitoring = "Continuous Monitoring"
        recommendation = "Immediate clinical assessment recommended. Notify psychologist and initiate crisis intervention if required."
    elif risk_level == "High":
        priority = "Priority 2 - Urgent Follow-up"
        monitoring = "Daily Monitoring"
        recommendation = "Schedule psychologist consultation within 24 hours."
    elif risk_level == "Moderate":
        priority = "Priority 3 - Regular Monitoring"
        monitoring = "Weekly Monitoring"
        recommendation = "Continue journaling and schedule routine counselling sessions."
    else:
        priority = "Priority 4 - Routine Monitoring"
        monitoring = "Monthly Monitoring"
        recommendation = "Maintain healthy emotional habits and continue periodic assessments."

    cpa_result = {
        "clinical_priority": priority,
        "monitoring_frequency": monitoring,
        "recommendation": recommendation
    }
    return cpa_result
