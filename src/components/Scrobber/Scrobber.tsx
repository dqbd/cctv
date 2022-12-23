import { useContext, useState } from "react"
import { ScrobberSlider } from "components/Scrobber/ScrobberSlider"
import { vibrateDecorator } from "utils/input"
import { ConfigContext } from "shared/config"
import { ScrobberShift } from "components/Scrobber/ScrobberShift"
import { SContainer, SWrapper } from "./Scrobber.styled"
import { ScrobberRange } from "./ScrobberRange"
import { ManifestArgs } from "utils/stream"

export function Scrobber(props: {
  color: string
  value: ManifestArgs
  onChange: (value: ManifestArgs) => void
  onMove: () => void
}) {
  const config = useContext(ConfigContext)

  const [mode, setMode] = useState<"shift" | "range">("shift")
  const [intentShift, setIntentShift] = useState<number | null>(null)

  const onShiftChange = vibrateDecorator((shift: number) => {
    setIntentShift(null)

    props.onChange({
      shift: Math.max(0, Math.min(config.maxAge * 1000, shift)),
    })
  })

  const onRangeChange = vibrateDecorator(
    (range: { from: number; to: number } | null) => {
      if (range != null) {
        props.onChange(range)
      }
    }
  )

  return (
    <>
      <SWrapper>
        <SContainer mode={mode}>
          {mode === "shift" && (
            <ScrobberShift
              value={"shift" in props.value ? props.value.shift : 0}
              intentValue={intentShift}
              onChange={onShiftChange}
              onModeChange={() => setMode("range")}
            />
          )}

          {mode === "range" && (
            <ScrobberRange
              value={
                "from" in props.value && "to" in props.value
                  ? props.value
                  : null
              }
              onChange={onRangeChange}
              onModeChange={() => setMode("shift")}
            />
          )}
        </SContainer>
      </SWrapper>

      {mode === "shift" && (
        <ScrobberSlider
          onScroll={(value) => {
            setIntentShift(value)
            props.onMove()
          }}
          onScrollEnd={onShiftChange}
          value={"shift" in props.value ? props.value.shift : 0}
          color={props.color}
        />
      )}
    </>
  )
}
