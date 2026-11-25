# GeoVision YOLO — MVP académico

Aplicación web responsive (React + TypeScript + Vite) con backend FastAPI y Ultralytics YOLO.

## Requisitos
- Windows, VS Code
- Python 3.10+ (recomendable 3.11/3.12)
- Node.js compatible con Vite (versión LTS reciente)
- Conexión a Internet la primera vez para descargar las dependencias y los pesos YOLO

## 1. Backend (PowerShell, terminal 1)
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Si no tienes Python 3.11 o el lanzador `py`, usa `python -m venv .venv`.
Comprueba http://127.0.0.1:8000/api/health y http://127.0.0.1:8000/docs.

## 2. Frontend (PowerShell, terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
Abre http://localhost:5173 en tu navegador.

## 3. Prueba
Sube JPG/PNG/WEBP (<10 MB), ajusta confianza y haz clic en 'Analizar con YOLO'.
En la primera inferencia se descargan los pesos `yolo11n.pt` automáticamente. La inferencia en CPU puede tardar.
El modelo genérico COCO NO está entrenado específicamente para detección cenital satelital; prueba primero con una imagen donde haya vehículos grandes/visibles y evita presentar detecciones como evaluaciones científicas.

## 4. Escalabilidad
- `backend/app/services/detector.py` encapsula la IA; cuando entrenes un modelo aéreo, coloca el fichero `best.pt` en `backend/models/` y establece `YOLO_WEIGHTS=models/best.pt` desde el directorio backend.
- Agregar `backend/app/api/routes/`, repositorios y capa de SQL Server en fases siguientes.
- Dataset aéreo recomendado: xView o DOTA (según licencia y disponibilidad).
- Añadir inferencia por tiles/SAHI para objetos pequeños, y evaluación con mAP/recall en datos anotados.
- No subir imágenes privadas ni exponer el API a Internet sin controles adicionales.

## 5. Probar desde un celular en la misma Wi-Fi
- En PowerShell, ejecuta `ipconfig` y localiza la IP IPv4 de la laptop.
- Frontend Vite ya escucha en 0.0.0.0. En el teléfono visita `http://IP_DE_LAPTOP:5173`.
- El frontend usa el proxy de Vite para enviar `/api` al backend que sigue en localhost de la laptop; NO cambies la URL del frontend a localhost del celular.
- Asegúrate de que el firewall y la red permitan llegar al puerto 5173; úsalo solamente en una red de confianza.

## 6. Limitaciones del MVP
- Se carga el modelo en el primer análisis.
- Los resultados viajan como imagen JPEG en base64 por JSON: sencillo para una demostración, optimizable en producción.
- No hay persistencia, autenticación, procesamiento por lotes ni entrenamiento en interfaz.
- React responsive es una **web móvil**, no una app nativa React Native.
- Revisa la licencia de Ultralytics antes de distribuir/comercializar el producto.
