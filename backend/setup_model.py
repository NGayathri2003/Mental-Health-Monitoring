"""
Model Setup Script
===================
Extracts the DistilBERT model zip into the directory expected by the backend.

Usage (from the `backend/` directory):
    python setup_model.py

The script:
1. Looks for `../model/final_distilbert_model.zip`
2. Extracts it to  `app/ai_models/distilbert/`
3. If the zip contains a single top-level folder (e.g. `final_distilbert_model/`),
   the contents are moved up so files land directly in `distilbert/`.

After running this script, start the backend with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
import shutil
import zipfile


BACKEND_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR     = os.path.abspath(os.path.join(BACKEND_DIR, "..", "model"))
EXTRACT_PATH  = os.path.join(BACKEND_DIR, "app", "ai_models", "distilbert")

# Try final first, fall back to best
ZIP_CANDIDATES = [
    os.path.join(MODEL_DIR, "final_distilbert_model.zip"),
    os.path.join(MODEL_DIR, "best_distilbert_model.zip"),
]


def setup() -> None:
    # Find the zip
    zip_path = None
    for candidate in ZIP_CANDIDATES:
        if os.path.exists(candidate):
            zip_path = candidate
            break

    if zip_path is None:
        print(f"[!]    No model zip found in '{MODEL_DIR}'.")
        print(f"       Expected one of:")
        for c in ZIP_CANDIDATES:
            print(f"         {c}")
        return

    print(f"[zip]  Using zip: {zip_path}")

    # Skip if already extracted and contains config.json (HuggingFace marker)
    if os.path.exists(os.path.join(EXTRACT_PATH, "config.json")):
        print(f"[ok]   Model already extracted at '{EXTRACT_PATH}'. Nothing to do.")
        return

    os.makedirs(EXTRACT_PATH, exist_ok=True)

    print(f"[dir]  Extracting to: {EXTRACT_PATH}")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(EXTRACT_PATH)
    print("   Extraction done.")

    # If the zip dumped files into a single sub-folder, flatten it
    entries = os.listdir(EXTRACT_PATH)
    if len(entries) == 1 and os.path.isdir(os.path.join(EXTRACT_PATH, entries[0])):
        sub = os.path.join(EXTRACT_PATH, entries[0])
        print(f"   Detected single sub-folder '{entries[0]}' -- flattening ...")
        for item in os.listdir(sub):
            shutil.move(os.path.join(sub, item), EXTRACT_PATH)
        os.rmdir(sub)

    # Verify
    if os.path.exists(os.path.join(EXTRACT_PATH, "config.json")):
        print(f"[ok]   Model ready at '{EXTRACT_PATH}'")
    else:
        print(
            f"[warn] Extraction finished but 'config.json' not found in '{EXTRACT_PATH}'.\n"
            f"       The zip may have an unexpected structure. Check the contents manually."
        )


if __name__ == "__main__":
    setup()
