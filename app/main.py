from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io
import torch
import numpy as np
from app.model_loader import load_model
from app.inference import predict
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
import base64
from PIL import Image
import io
import numpy as np
import torch

app = FastAPI()

@app.on_event("startup")
def startup_event():
    app.state.model = load_model()

@app.post("/predict_image")
async def predict_image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("L")
    image = image.resize((28, 28))

    image_array = np.array(image) / 255.0
    image_tensor = torch.tensor(image_array).float().unsqueeze(0).unsqueeze(0)

    model = app.state.model
    pred, conf = predict(model, image_tensor)

    return {"prediction": pred, "confidence": conf}

@app.post("/predict_canvas")
def predict_canvas(data: str = Body(...)):
    image_data = data.split(",")[1]
    image_bytes = base64.b64decode(image_data)

    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    image = image.resize((28, 28))

    image_array = np.array(image)

    #  inversion (très important pour MNIST)
    image_array = 255 - image_array

    # normalisation
    image_array = image_array / 255.0

    image_tensor = torch.tensor(image_array).float().unsqueeze(0).unsqueeze(0)

    model = app.state.model
    pred, conf = predict(model, image_tensor)

    return {"prediction": pred, "confidence": conf}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)