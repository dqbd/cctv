import { useContext, useMemo, useState } from "react"
import { ScrobberSlider } from "components/Scrobber/ScrobberSlider"
import { ConfigContext } from "shared/config"
import { ScrobberShift } from "components/Scrobber/ScrobberShift"
import { SContainer, SWrapper } from "./Scrobber.styled"
import { ScrobberRange } from "./ScrobberRange"
import { useStreamStore } from "utils/stream"
import dayjs from "dayjs"

export function Scrobber(props: {
  color: string
  onRangeSeek: (delta: number) => void
  onActivate: () => void
}) {
  const config = useContext(ConfigContext)
  const mode = useStreamStore((state) => state.mode)
  const setMode = useStreamStore((state) => state.setMode)

  const stream = useStreamStore((state) => state.stream)
  const playback = useStreamStore((state) => state.playback)

  const bounds = useMemo(() => {
    if ("from" in stream && "to" in stream) {
      return {
        pov: [dayjs(stream.from), dayjs(stream.to)] as [
          dayjs.Dayjs,
          dayjs.Dayjs
        ],
      }
    } else {
      return { shift: [-config.maxAge * 1000, 0] as [number, number] }
    }
  }, [stream, config.maxAge])

  const [intentShift, setIntentShift] = useState<number | null>(null)
  const updateStream = useStreamStore((state) => state.updateStream)
  const updateRangeSeek = useStreamStore((state) => state.updateRangeSeek)

  const onShiftChange = (shift: number) => {
    updateStream({
      shift: Math.max(0, Math.min(config.maxAge * 1000, shift)),
    })
  }

  return (
    <>
      <SWrapper>
        <SContainer>
          <ScrobberShift
            intentShift={intentShift}
            bounds={bounds}
            onShiftSet={onShiftChange}
          />
        </SContainer>
      </SWrapper>

      <ScrobberSlider
        onScroll={(value) => {
          props.onActivate()
          setIntentShift(value)
        }}
        onScrollEnd={(delta) => {
          setIntentShift(null)
          if ("shift" in stream) {
            onShiftChange(stream.shift - delta)
          }

          if ("from" in stream && "to" in stream) {
            updateRangeSeek(delta)
            props.onRangeSeek(delta)
          }
        }}
        bounds={bounds}
        value={playback}
        color={props.color}
      />
    </>
  )
}
