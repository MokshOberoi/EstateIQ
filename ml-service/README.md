# FastAPI ML Service for EstateIQ

This microservice provides a **lead classification** prediction using a scikit‑learn model.

## Overview
- Generates synthetic development data (`generate_demo_data.py`).
- Trains a `RandomForestClassifier` (`train_model.py`).
- Exposes a FastAPI HTTP API (`/health`, `/predict`).
- The Node.js backend calls the service via `ML_SERVICE_URL`.

## Important notes
- The demonstration dataset is **synthetic** and **not representative of production data**.
- Accuracy metrics printed during training are **development‑only** and should not be presented as production performance.
- Real historical lead data can replace `ml-service/data/lead_training_data.csv` and the model can be retrained using the same scripts.

## Quick start (Windows PowerShell)
```powershell
# 1. Create a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Generate demo data (creates data/lead_training_data.csv)
python training\generate_demo_data.py

# 4. Train the model (creates models/lead_classifier.joblib)
python training\train_model.py

# 5. Run the FastAPI service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API documentation is available at `http://localhost:8000/docs`.

## Integration with Node backend
- Add `ML_SERVICE_URL` to the Node `.env` (default `http://localhost:8000`).
- The backend uses the `mlPredictionService` to call the `/predict` endpoint.
- The `/api/v1/leads/:userId/predict` route (admin only) returns the ML prediction alongside the existing rule‑based lead profile.

---
*Generated for educational / resume purposes; not intended for production use.*

