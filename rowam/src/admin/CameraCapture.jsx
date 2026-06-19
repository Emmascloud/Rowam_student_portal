import { useEffect, useRef, useState } from 'react'

// A reusable camera capture widget. Opens the device camera (front or rear),
// lets the admin frame the shot, and returns a JPEG Blob on capture.
export default function CameraCapture({ label, existingUrl, onCapture, facingMode = 'environment' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [active, setActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(existingUrl || null)
  const [error, setError] = useState('')

  useEffect(() => {
    setPreviewUrl(existingUrl || null)
  }, [existingUrl])

  useEffect(() => {
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      setActive(true)
    } catch (err) {
      setError('Could not access the camera. Please check permissions and try again.')
    }
  }

  // The <video> element only mounts once `active` is true, so attach the
  // stream here (after render) rather than immediately inside startCamera.
  useEffect(() => {
    if (active && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [active])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setActive(false)
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const size = Math.min(video.videoWidth, video.videoHeight)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const offsetX = (video.videoWidth - size) / 2
    const offsetY = (video.videoHeight - size) / 2
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size)

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      stopCamera()
      onCapture(blob)
    }, 'image/jpeg', 0.92)
  }

  function retake() {
    setPreviewUrl(null)
    startCamera()
  }

  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="overflow-hidden rounded-lg border border-navy-200 bg-navy-950">
        {!active && previewUrl && (
          <img src={previewUrl} alt={label} className="aspect-square w-full object-cover" />
        )}
        {!active && !previewUrl && (
          <div className="flex aspect-square w-full items-center justify-center text-sm text-navy-400">
            No image captured yet
          </div>
        )}
        {active && (
          <video ref={videoRef} autoPlay playsInline muted className="aspect-square w-full object-cover" />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        {!active && !previewUrl && (
          <button type="button" onClick={startCamera} className="btn-outline !py-2 text-xs">
            Open camera
          </button>
        )}
        {active && (
          <button type="button" onClick={capture} className="btn-gold !py-2 text-xs">
            Capture
          </button>
        )}
        {!active && previewUrl && (
          <button type="button" onClick={retake} className="btn-outline !py-2 text-xs">
            Retake
          </button>
        )}
        {active && (
          <button type="button" onClick={stopCamera} className="btn-outline !py-2 text-xs">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
