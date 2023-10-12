import { MutableRefObject, useEffect, useState } from "react"
import Hls from "hls.js"
import { css } from "@emotion/react"
import { theme } from "utils/theme"
import { useStreamStore } from "utils/stream"

export function HLSPlayer(props: {
  source: string
  videoRef: MutableRefObject<HTMLVideoElement | null>
  visible: boolean
  muted: boolean
  show: MutableRefObject<() => void>
}) {
  const [paused, setPaused] = useState(false)
  const updatePlayback = useStreamStore((state) => state.updatePlayback)

  useEffect(() => {
    const videoRef = props.videoRef.current
    let hls: Hls | undefined

    let onPauseListener: () => void
    const onPlayListener = () => {
      setPaused(false)
      updatePlayback("playing")
    }

    videoRef?.addEventListener("playing", onPlayListener)

    if (props.source && videoRef) {
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.attachMedia(videoRef)

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls?.loadSource(props.source)

          hls?.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR: {
                  hls?.startLoad()
                  break
                }
                case Hls.ErrorTypes.MEDIA_ERROR: {
                  hls?.recoverMediaError()
                  break
                }
                default: {
                  hls?.destroy()
                }
              }
            }
          })

          hls?.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef?.play()
          })

          onPauseListener = () => {
            setPaused(true)
            updatePlayback("paused")
          }

          videoRef.addEventListener("pause", onPauseListener)
        })
      } else {
        videoRef.src = props.source
        videoRef?.play()

        onPauseListener = () => {
          setPaused(true)
          updatePlayback("paused")
        }

        videoRef.addEventListener("pause", onPauseListener)
      }
    }

    return () => {
      videoRef?.removeEventListener("pause", onPauseListener)
      videoRef?.removeEventListener("playing", onPlayListener)
      hls?.destroy?.()
    }
  }, [props.source, updatePlayback, props.videoRef])

  return (
    <>
      <video
        className="w-full h-full object-contain object-center"
        autoPlay
        playsInline
        muted={props.muted}
        ref={props.videoRef}
        onClick={() => {
          if (paused) {
            props.videoRef.current?.play()
          } else {
            props.videoRef.current?.pause()
          }
        }}
      />
      {paused && (
        <div
          className="absolute z-[1] flex items-center justify-center pointer-events-none transition-opacity"
          css={props.visible ? { opacity: 1 } : { opacity: 0 }}
        >
          <button
            type="button"
            className="flex items-center justify-center w-24 h-24 rounded-full border-none"
            css={css`
              background: ${theme.colors.blue500} !important;
              color: ${theme.colors.lightBlue900};
              box-shadow: ${theme.shadows.sm};
            `}
          >
            <svg
              width="4em"
              height="4em"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
