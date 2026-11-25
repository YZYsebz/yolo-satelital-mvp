"""Servicio de inferencia independiente del transporte HTTP.

Cambiar YOLO_WEIGHTS por models/best.pt cuando exista un modelo aéreo propio.
"""
import os
from collections import Counter
from io import BytesIO

from PIL import Image
from ultralytics import YOLO

WEIGHTS = os.getenv("YOLO_WEIGHTS", "yolo11n.pt")
_model = None


def get_model():
    global _model
    if _model is None:
        _model = YOLO(WEIGHTS)
    return _model


def detect(image: Image.Image, confidence: float = 0.25):
    model = get_model()
    result = model.predict(source=image, conf=confidence, imgsz=640, verbose=False)[0]
    detections = []
    for box in result.boxes:
        class_id = int(box.cls[0].item())
        detections.append({
            "class_id": class_id,
            "label": result.names[class_id],
            "confidence": round(float(box.conf[0].item()), 4),
            "box": [round(float(x), 1) for x in box.xyxy[0].tolist()],
        })
    annotated_bgr = result.plot()
    annotated_rgb = Image.fromarray(annotated_bgr[..., ::-1])
    output = BytesIO()
    annotated_rgb.save(output, format="JPEG", quality=85)
    counts = dict(Counter(d["label"] for d in detections))
    return detections, counts, output.getvalue()
