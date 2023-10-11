import Link from "next/link"
import { SBack, SColor, SInfo, SMain, SName, STop } from "./Controls.styled"
import { Scrobber } from "../Scrobber/Scrobber"
import { useStreamStore } from "utils/stream"
import { css } from "@emotion/react"
import { theme } from "utils/theme"
import { ScrobberRange } from "components/Scrobber/ScrobberRange"
import { MutableRefObject } from "react"
import { LogStream } from "components/LogStream"

function ControlsHeader(props: {
  stream: {
    key: string
    name: string
    color: string
  }
  visible: boolean
  muted: boolean
  onMuteClick: () => void
}) {
  const mode = useStreamStore((state) => state.mode)
  const setMode = useStreamStore((state) => state.setMode)
  const updateStream = useStreamStore((state) => state.updateStream)
  const stream = useStreamStore((state) => state.stream)

  return (
    <STop>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: 1em;
        `}
      >
        {props.visible && (
          <div
            css={css`
              display: flex;
              align-items: center;
              pointer-events: all;
            `}
          >
            <Link href="/">
              <SBack>
                <svg
                  viewBox="0 0 29 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M25 9.17424V11.8258H9.09091L16.3826 19.1174L14.5 21L4 10.5L14.5 0L16.3826 1.88258L9.09091 9.17424H25Z"
                    fill="currentColor"
                  />
                </svg>
              </SBack>
            </Link>
            <SInfo
              css={
                mode === "range" &&
                css`
                  @media (max-width: 864px) {
                    display: none;
                  }
                `
              }
            >
              <SColor css={{ backgroundColor: props.stream?.color }} />
              <SName>{props.stream?.name}</SName>
            </SInfo>
          </div>
        )}

        <LogStream stream={props.stream} />
      </div>

      {props.visible && (
        <div
          css={css`
            display: flex;
            align-items: flex-start;
            pointer-events: all;

            gap: 16px;
            color: ${theme.colors.lightBlue900};
          `}
        >
          {mode === "range" && (
            <ScrobberRange
              value={"from" in stream && "to" in stream ? stream : null}
              onChange={(range) => {
                if (range != null) {
                  updateStream(range)
                }
              }}
              css={css`
                background: ${theme.colors.blue500};
                padding: 0.5em;
                border-radius: 20px;
              `}
            />
          )}

          <a
            css={css`
              color: ${theme.colors.lightBlue900};
              background: ${theme.colors.blue500};
              width: 4em;
              height: 4em;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 100%;
              box-shadow: ${theme.shadows.sm};

              & svg {
                width: 2em;
                height: 2em;
              }
            `}
            onClick={() => {
              setMode(mode === "shift" ? "range" : "shift")
              if (mode === "range") {
                updateStream({ shift: 0 })
              }
            }}
          >
            {mode === "shift" && (
              <>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 22C4.45 22 3.979 21.8043 3.587 21.413C3.19567 21.021 3 20.55 3 20V6C3 5.45 3.19567 4.97933 3.587 4.588C3.979 4.196 4.45 4 5 4H6V2H8V4H16V2H18V4H19C19.55 4 20.021 4.196 20.413 4.588C20.8043 4.97933 21 5.45 21 6V20C21 20.55 20.8043 21.021 20.413 21.413C20.021 21.8043 19.55 22 19 22H5ZM5 20H19V10H5V20Z"
                    fill="currentColor"
                  />
                  <path
                    d="M14.5714 14.25H9.42857V12L6 15L9.42857 18V15.75H14.5714V18L18 15L14.5714 12V14.25Z"
                    fill="currentColor"
                  />
                </svg>
              </>
            )}
            {mode === "range" && (
              <>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z"
                    fill="currentColor"
                  />
                </svg>
              </>
            )}
          </a>

          <a
            css={css`
              color: ${theme.colors.lightBlue900};
              background: ${theme.colors.blue500};
              width: 4em;
              height: 4em;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 100%;
              box-shadow: ${theme.shadows.sm};

              & svg {
                width: 2em;
                height: 2em;
              }
            `}
            onClick={props.onMuteClick}
          >
            {props.muted ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.34005 2.92999L2.93005 4.33999L7.29005 8.69999L7.00005 8.99999H3.00005V15H7.00005L12.0001 20V13.41L16.1801 17.59C15.5301 18.08 14.8001 18.47 14.0001 18.7V20.76C15.3204 20.4577 16.5548 19.8593 17.6101 19.01L19.6601 21.06L21.0701 19.65L4.34005 2.92999ZM10.0001 15.17L7.83005 13H5.00005V11H7.83005L8.71005 10.12L10.0001 11.41V15.17ZM19.0001 12C19.0001 12.82 18.8501 13.61 18.5901 14.34L20.1201 15.87C20.6801 14.7 21.0001 13.39 21.0001 12C21.0001 7.71999 18.0101 4.13999 14.0001 3.22999V5.28999C16.8901 6.14999 19.0001 8.82999 19.0001 12ZM12.0001 3.99999L10.1201 5.87999L12.0001 7.75999V3.99999ZM16.5001 12C16.4998 11.1621 16.2657 10.3409 15.824 9.62893C15.3823 8.91693 14.7506 8.34238 14.0001 7.96999V9.75999L16.4801 12.24C16.4901 12.16 16.5001 12.08 16.5001 12Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 9.00001V15H7L12 20V4.00001L7 9.00001H3ZM10 8.83001V15.17L7.83 13H5V11H7.83L10 8.83001ZM16.5 12C16.4998 11.1621 16.2657 10.341 15.824 9.62895C15.3823 8.91695 14.7506 8.3424 14 7.97001V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23001V5.29001C16.89 6.15001 19 8.83001 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72001 18.01 4.14001 14 3.23001Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </a>
        </div>
      )}
    </STop>
  )
}

export function Controls(props: {
  stream: {
    key: string
    name: string
    color: string
  }
  visible: boolean
  show: MutableRefObject<() => void>
  onRangeSeek: (delta: number) => void
  muted: boolean
  onMuteClick: () => void
}) {
  return (
    <SMain
      onTouchStart={() => props.show.current()}
      onMouseMove={() => props.show.current()}
    >
      <ControlsHeader
        stream={props.stream}
        visible={props.visible}
        muted={props.muted}
        onMuteClick={props.onMuteClick}
      />
      <Scrobber
        css={{
          opacity: props.visible ? 1 : 0,
          pointerEvents: props.visible ? "all" : "none",
        }}
        color={props.stream.color}
        onRangeSeek={props.onRangeSeek}
        onActivate={() => props.show.current()}
      />
    </SMain>
  )
}
