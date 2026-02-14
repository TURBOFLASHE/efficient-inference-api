# app/model_loader.py

import torch
import os
from app.model_architecture import SimpleCNN

def load_model():
    device = torch.device("cpu")
    model = SimpleCNN()

    model_path = "model/model.pt"

    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval()
        print("Model loaded successfully")
    else:
        print(f"Model file not found at {model_path}. Skipping model load.")

    return model
