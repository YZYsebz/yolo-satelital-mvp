import { useEffect, useState } from 'react'

type Detection = { class_id: number; label: string; confidence: number; box: number[] }
type DetectionResult = { model: string; total: number; counts: Record<string,number>; detections: Detection[]; annotated_image: string }

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0.25)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFile(next: File | null) {
    setError('')
    setResult(null)
    if (next && !['image/jpeg','image/png','image/webp'].includes(next.type)) {
      setError('Selecciona una imagen JPG, PNG o WEBP.')
      setFile(null)
      return
    }
    if (next && next.size > 10 * 1024 * 1024) {
      setError('El archivo debe pesar menos de 10 MB.')
      setFile(null)
      return
    }
    setFile(next)
  }

  async function analyze() {
    if (!file) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/detect?confidence=${confidence}`, { method:'POST', body:form })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.detail || 'No se pudo analizar la imagen.')
      setResult(payload as DetectionResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally { setBusy(false) }
  }

  return <div className="app">
    <header className="topbar"><div className="brand"><span className="brand-icon">◎</span><span>GeoVision <b>YOLO</b></span></div><span className="top-pill">Prototipo académico · v0.1</span></header>
    <main className="layout">
      <div className="intro"><div className="eyebrow">INTELIGENCIA ARTIFICIAL · VISIÓN POR COMPUTADORA</div><h1>Detección de objetos <span>en imágenes aéreas</span></h1><p>Selecciona una imagen, ejecútala con YOLO y consulta las detecciones. El prototipo utiliza un modelo general; la especialización satelital llegará en una próxima etapa.</p></div>
      <section className="main-grid">
        <div className="panel controls"><div className="section-heading"><span className="step">01</span><h2>Configurar análisis</h2></div>
          <label className="upload" htmlFor="imageInput"><span className="upload-symbol">⬆</span><strong>{file ? file.name : 'Seleccionar imagen aérea'}</strong><small>JPG, PNG o WEBP · máximo 10 MB</small></label>
          <input id="imageInput" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>handleFile(e.target.files?.[0] ?? null)} />
          <label className="slider-head" htmlFor="confidence"><span>Umbral de confianza</span><b>{Math.round(confidence*100)}%</b></label><input className="range" id="confidence" type="range" min="0.05" max="0.95" step="0.05" value={confidence} onChange={e=>setConfidence(Number(e.target.value))}/>
          <p className="help">Confianza mínima exigida para mostrar una detección. No representa precisión validada.</p>
          <button className="primary" onClick={analyze} disabled={!file || busy}>{busy ? 'Analizando imagen…' : 'Analizar con YOLO →'}</button>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="info"><b>Modelo de demostración</b><span>{result?.model ?? 'yolo11n.pt (COCO)'}</span><small>Puede no reconocer correctamente objetos satelitales pequeños.</small></div>
        </div>
        <div className="panel visual"><div className="section-heading"><span className="step">02</span><h2>Vista de análisis</h2><span className="status">{busy ? 'Procesando' : result ? 'Análisis completado' : 'Sin analizar'}</span></div>
          <div className="image-frame">{result ? <img src={result.annotated_image} alt="Imagen con detecciones YOLO" /> : preview ? <img src={preview} alt="Imagen seleccionada sin analizar" /> : <div className="empty"><span className="empty-icon">⌗</span><strong>Tu imagen aparecerá aquí</strong><small>Agrega una imagen para comenzar</small></div>}</div>
          {result && <a className="download" href={result.annotated_image} download="detecciones-yolo.jpg">↓ Guardar imagen analizada</a>}
        </div>
      </section>
      <section className="panel results"><div className="section-heading"><span className="step">03</span><h2>Resultados</h2></div>
        {!result ? <p className="muted">Las clases, cantidades y niveles de confianza aparecerán después de analizar una imagen.</p> : <><div className="summary"><div className="metric"><span>Objetos detectados</span><strong>{result.total}</strong></div><div className="metric"><span>Clases diferentes</span><strong>{Object.keys(result.counts).length}</strong></div><div className="metric"><span>Modelo utilizado</span><strong className="model-name">{result.model}</strong></div></div>
          <h3>Conteo por categoría</h3><div className="chips">{Object.entries(result.counts).length ? Object.entries(result.counts).map(([name, n])=><span className="chip" key={name}>{name}: <b>{n}</b></span>):<span className="muted">No se identificaron objetos con este umbral.</span>}</div>
          <h3>Detecciones individuales</h3><div className="table-scroll"><table><thead><tr><th>#</th><th>Clase</th><th>Confianza</th><th>Coordenadas (px)</th></tr></thead><tbody>{result.detections.map((item,i)=><tr key={i}><td>{i+1}</td><td>{item.label}</td><td>{(item.confidence*100).toFixed(1)}%</td><td>{item.box.join(', ')}</td></tr>)}</tbody></table></div></>}
      </section><footer>Proyecto académico · React + FastAPI + Ultralytics YOLO · Los resultados son predicciones automáticas, no datos verificados.</footer>
    </main>
  </div>
}
