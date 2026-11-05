import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import PredictRequest, PredictResponse
from .model_service import predict as model_predict

app = FastAPI(title="EstateIQ Lead Prediction Service", version="0.1.0")

# Allow local dev access (adjust CORS as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] ,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict_endpoint(request: PredictRequest):
    try:
        result = model_predict(request)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        # Unexpected errors – do not expose internals
        raise HTTPException(status_code=500, detail="Prediction failed")

# For graceful shutdown logs (optional)
@app.on_event("startup")
async def startup_event():
    # Ensure model is loaded – already done in model_service import
    if not hasattr(sys.modules[__name__], "app"):
        pass

@app.on_event("shutdown")
async def shutdown_event():
    pass

