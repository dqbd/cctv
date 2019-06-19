import React, { useRef, useLayoutEffect } from 'react'

type Props = {
  delayLog: (delay: number) => any,
}

export default ({ delayLog }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useLayoutEffect(() => {
    const mediaSource = new MediaSource()
    const frameBuffer: ArrayBuffer[] = []
    
    let closing = false
    let socket: WebSocket | null = null
    let socketTimer: number | undefined = undefined
    let sourceBuffer: SourceBuffer | null = null
    let objectUrl: string | null = null

    let pendingDelay: number | null = null

    const attemptToPlay = () => {
      try {
        if (videoRef.current) videoRef.current.play()
      } catch (err) {
        console.error(err)
      }
    }

    const createSocket = (url: string) => {
      let sendAck = false
      socket = new WebSocket(url)
      
      socket.binaryType = 'arraybuffer'
      socket.onmessage = ({ data }) => {
        try {
          if (!sourceBuffer) return
          if (sourceBuffer.updating || frameBuffer.length > 0) {
            if (frameBuffer.length == 0) pendingDelay = performance.now()
            frameBuffer.push(data)
          } else {
            sourceBuffer.appendBuffer(data)
          }

          if (sendAck === false && socket != null) {
            sendAck = true
            socket.send("ack")
          }
        } catch (err) {
          console.error(err)
        }
      }
      socket.onerror = () => socket && socket.close()
      socket.onclose = () => {
        if (closing) return
        window.clearTimeout(socketTimer)
        window.setTimeout(() => createSocket(url), 1000)
      }
    }

    mediaSource.sourceBuffers.addEventListener('addsourcebuffer', (ev) => {
      const targetBuffer = mediaSource.sourceBuffers[0]
      targetBuffer.mode = "sequence"
      
      targetBuffer.onupdateend = () => console.log('onupdateend', targetBuffer.buffered.length)
      targetBuffer.onupdate = () => {
        if (!sourceBuffer) return
        if (frameBuffer.length > 0 && !sourceBuffer.updating) {
          const item = frameBuffer.shift()

          if (frameBuffer.length == 0 && pendingDelay !== null) {
            delayLog(performance.now() - pendingDelay)
            pendingDelay = null
          }
          if (item) sourceBuffer.appendBuffer(item)
        }

        attemptToPlay()
      }

      sourceBuffer = targetBuffer
      createSocket('ws://localhost:8080')
    })

    mediaSource.addEventListener('sourceopen', () => {
      attemptToPlay()
      mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42001f"')
    })

    mediaSource.addEventListener('sourceended', (ev) => {
      console.log(ev)
    })

    if (videoRef.current != null) {
      objectUrl = window.URL.createObjectURL(mediaSource)
      videoRef.current.src = objectUrl
    }

    return () => {
      closing = true
      if (socket) socket.close()
      window.clearTimeout(socketTimer)
      if (objectUrl) window.URL.revokeObjectURL(objectUrl)
    }
  }, [])

  return (
    <video ref={videoRef} />
  )
}