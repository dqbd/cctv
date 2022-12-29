import { useContext, useMemo, useState } from "react"
import { ScrobberSlider } from "components/Scrobber/ScrobberSlider"
import { ConfigContext } from "shared/config"
import { ScrobberShift } from "components/Scrobber/ScrobberShift"
import { SContainer, SWrapper } from "./Scrobber.styled"
import { ScrobberRange } from "./ScrobberRange"
import { useStreamStore } from "utils/stream"

export function Scrobber(props: { color: string }) {
  const config = useContext(ConfigContext)
  const [mode, setMode] = useState<"shift" | "range">("shift")

  const stream = useStreamStore((state) => state.stream)
  const playback = useStreamStore((state) => state.playback)

  const bounds = useMemo(
    () => ({ shift: [-config.maxAge * 1000, 0] as [number, number] }),
    [config.maxAge]
  )

  const [intentShift, setIntentShift] = useState<number | null>(null)
  const updateStream = useStreamStore((state) => state.updateStream)

  const onShiftChange = (shift: number) => {
    setIntentShift(null)
    updateStream({
      shift: Math.max(0, Math.min(config.maxAge * 1000, shift)),
    })
  }

  const onRangeChange = (range: { from: number; to: number } | null) => {
    if (range != null) {
      updateStream(range)
    }
  }

  return (
    <>
      <SWrapper>
        <SContainer>
          {mode === "shift" && (
            <ScrobberShift
              intentShift={intentShift}
              bounds={bounds}
              onShiftSet={onShiftChange}
              onModeChange={() => setMode("range")}
            />
          )}

          {mode === "range" && (
            <ScrobberRange
              value={"from" in stream && "to" in stream ? stream : null}
              onChange={onRangeChange}
              onModeChange={() => {
                updateStream({ shift: 0 })
                setMode("shift")
              }}
            />
          )}
        </SContainer>
      </SWrapper>

      <ScrobberSlider
        onScroll={(value) => {
          setIntentShift(value)
        }}
        onScrollEnd={(delta) => {
          if ("shift" in stream) {
            onShiftChange(stream.shift - delta)
          }
        }}
        bounds={bounds}
        value={playback}
        color={props.color}
      />
    </>
  )
}
