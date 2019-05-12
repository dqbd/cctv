import React, { useState, useLayoutEffect, useRef } from 'react'

type Props = {
  videoVisible: boolean,
  videoTrack: MediaStreamTrack | null,
}

const PeerView = ({
  videoVisible,
  videoTrack,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [videoCanPlay, setVideoCanPlay] = useState(false) 
  const [videoElemPaused, setVideoElemPaused] = useState(false)

  useLayoutEffect(() => {
    if (videoRef.current != null && videoTrack != null) {
      const stream = new MediaStream()
      stream.addTrack(videoTrack)
      videoRef.current.srcObject = stream

      videoRef.current.oncanplay = () => setVideoCanPlay(true)
      videoRef.current.onplay = () => setVideoElemPaused(false)
			videoRef.current.onpause = () => setVideoElemPaused(true)

			videoRef.current.play().catch((error) => console.error(error))
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.oncanplay = null
        videoRef.current.onplay = null
        videoRef.current.onpause = null
      }
    }

  }, [videoTrack])

  return (
    <video ref={videoRef} autoPlay muted controls={false} />
  )
}

export default PeerView