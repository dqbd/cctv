import { useContext, useState } from "react"
import { ScrobberSlider } from "components/Scrobber/ScrobberSlider"
import { vibrateDecorator } from "./Scrobber.utils"
import { ConfigContext } from "shared/config"
import { ScrobberTimelineShift } from "components/Scrobber/ScrobberTimelineShift"
import { SCenter, STimeline } from "./ScrobberTimeline.styled"
import { ScrobberTimelineRange } from "./ScrobberTimelineRange"

export function ScrobberTimeline(props: {
  color: string
  value: number
  onChange: (shift: number) => void
  onMove: () => void
}) {
  const config = useContext(ConfigContext)

  const [scrollShift, setScrollShift] = useState<number | null>(null)
  const onShiftChange = vibrateDecorator((shift: number) => {
    setScrollShift(null)
    props.onChange(Math.max(0, Math.min(config.maxAge * 1000, shift)))
  })

  return (
    <>
      <STimeline>
        <SCenter>
          <ScrobberTimelineShift
            value={props.value}
            intentValue={scrollShift}
            onChange={onShiftChange}
          />

          <ScrobberTimelineRange />
        </SCenter>
      </STimeline>
      <ScrobberSlider
        onScroll={(value) => {
          setScrollShift(value)
          props.onMove()
        }}
        onScrollEnd={onShiftChange}
        value={props.value}
        color={props.color}
      />
    </>
  )
}
