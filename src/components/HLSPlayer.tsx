import { useEffect, useRef } from "react"
import Hls from "hls.js"

export function HLSPlayer(props: { source: string }) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const videoRef = ref.current
    let timer: number
    let hls: Hls | undefined

    if (props.source && videoRef) {
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.loadSource(props.source)
        hls.attachMedia(videoRef)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          timer = window.setTimeout(() => void videoRef?.play(), 300)
        })
      } else {
        videoRef.src = props.source
        timer = window.setTimeout(() => void videoRef?.play(), 300)
      }
    }

    return () => {
      clearTimeout(timer)
      videoRef?.pause?.()
      hls?.destroy?.()
    }
  }, [props.source])

  return <video ref={ref} autoPlay muted playsInline />
}
