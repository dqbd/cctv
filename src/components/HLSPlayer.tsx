import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { css } from "@emotion/react"
import { theme } from "utils/theme"

export function HLSPlayer(props: { source: string }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const videoRef = ref.current
    let hls: Hls | undefined

    let onPauseListener: () => void
    const onPlayListener = () => setPaused(false)

    videoRef?.addEventListener("playing", onPlayListener)

    if (props.source && videoRef) {
      if (Hls.isSupported()) {
        hls = new Hls({ debug: false, startPosition: 0 })
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
            hls?.recoverMediaError()
          }

          videoRef.addEventListener("pause", onPauseListener)
        })
      } else {
        videoRef.src = props.source
        videoRef?.play()

        onPauseListener = () => {
          setPaused(true)
        }

        videoRef.addEventListener("pause", onPauseListener)
      }
    }

    return () => {
      videoRef?.removeEventListener("pause", onPauseListener)
      videoRef?.removeEventListener("playing", onPlayListener)
      hls?.destroy?.()
    }
  }, [props.source])

  return (
    <>
      <video ref={ref} autoPlay playsInline muted />
      {paused && (
        <div
          css={css`
            position: absolute;
            z-index: 1;

            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          `}
        >
          <button
            type="button"
            css={css`
              background: ${theme.colors.blue500};
              width: 100px;
              height: 100px;
              pointer-events: all;
              color: ${theme.colors.white};
              border-radius: 100%;
              border: none;
            `}
            onClick={() => {
              try {
                ref.current?.play()
              } catch {}
            }}
          >
            <svg
              width="64"
              height="64"
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
