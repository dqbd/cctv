import { useContext, useState } from "react"
import { ScrobberSlider } from "components/Scrobber/ScrobberSlider"
import { vibrateDecorator } from "utils/input"
import { ConfigContext } from "shared/config"
import { ScrobberTimelineShift } from "components/Scrobber/ScrobberTimelineShift"
import { SContainer, SWrapper } from "./Scrobber.styled"
import { ScrobberTimelineRange } from "./ScrobberTimelineRange"

export function Scrobber(props: {
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
      <SWrapper>
        <SContainer>
          <ScrobberTimelineShift
            value={props.value}
            intentValue={scrollShift}
            onChange={onShiftChange}
          />

          <ScrobberTimelineRange />
        </SContainer>
      </SWrapper>
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
