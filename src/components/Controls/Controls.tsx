import Link from "next/link"
import { SBack, SColor, SInfo, SMain, SName, STop } from "./Controls.styled"
import { useVisibleTimer } from "./Controls.utils"
import { Scrobber } from "../Scrobber/Scrobber"
import { ManifestArgs } from "utils/stream"

function ControlsHeader(props: {
  stream: {
    key: string
    name: string
    color: string
  }
}) {
  return (
    <STop>
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
      <SInfo>
        <SColor css={{ backgroundColor: props.stream?.color }} />
        <SName>{props.stream?.name}</SName>
      </SInfo>
    </STop>
  )
}

export function Controls(props: {
  onChange: (args: ManifestArgs) => void
  value: ManifestArgs
  stream: {
    key: string
    name: string
    color: string
  }
}) {
  const { visible, show } = useVisibleTimer(5 * 99999 * 1000)

  return (
    <SMain
      css={{ opacity: visible ? 1 : 0 }}
      onTouchStart={() => show.current()}
      onMouseMove={() => show.current()}
    >
      <ControlsHeader stream={props.stream} />
      <Scrobber
        value={props.value}
        onMove={() => show.current()}
        color={props.stream.color}
        onChange={(shift) => {
          props.onChange(shift)
          show.current()
        }}
      />
    </SMain>
  )
}
