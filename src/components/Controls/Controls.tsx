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
}) {
  return (
    <SMain
      onTouchStart={() => props.show.current()}
      onMouseMove={() => props.show.current()}
    >
      <ControlsHeader stream={props.stream} visible={props.visible} />
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
