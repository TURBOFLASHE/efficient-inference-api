from fastapi import FastAPI
from app.model_loader import load_model
from app.inference import predict

app = FastAPI()

@app.on_event("startup")
def startup_event():
    app.state.model = load_model()
    print("Model loaded once at startup")

@app.get("/")
def root():
    return {"message": "API is working"}

@app.post("/predict")
def predict_digit(data: list):
    import torch
    image = torch.tensor(data).float().reshape(1,1,28,28)
    model = app.state.model
    pred, conf = predict(model, image)
    return {"prediction": pred, "confidence": conf}
