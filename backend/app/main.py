import base64
from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from app.services.detector import WEIGHTS, detect

MAX_FILE_BYTES = 10 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 24_000_000

app = FastAPI(title="Detector satelital YOLO — MVP", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "weights": WEIGHTS}


@app.post("/api/detect")
async def detect_image(file: UploadFile = File(...), confidence: float = 0.25):
    if not 0.05 <= confidence <= 0.95:
        raise HTTPException(status_code=422, detail="La confianza debe estar entre 0.05 y 0.95")
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Solo se aceptan JPG, PNG o WEBP")
    data = await file.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="La imagen supera 10 MB")
    try:
        image = Image.open(BytesIO(data))
        image.load()
        image = image.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="La imagen no es válida o es demasiado grande")
    try:
        detections, counts, annotated = detect(image, confidence)
    except Exception as exc:
        # Mensaje genérico: no exponer información del servidor al cliente.
        raise HTTPException(status_code=500, detail="No se pudo ejecutar el modelo YOLO") from exc
    return {
        "model": WEIGHTS,
        "total": len(detections),
        "counts": counts,
        "detections": detections,
        "annotated_image": "data:image/jpeg;base64," + base64.b64encode(annotated).decode("ascii"),
    }
