# app/inference.py
import torch
import torch.nn.functional as F

def predict(model, image):
    model.eval()
    with torch.no_grad():
        output = model(image)
        prob = F.softmax(output, dim=1)
        pred = torch.argmax(prob, dim=1).item()
        conf = prob.max().item()
    return pred, conf
