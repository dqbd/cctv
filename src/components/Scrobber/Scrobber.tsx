import { useContext, useState } from "react"
import { ScrobberSlider } from "components/Scrobber/ScrobberSlider"
import { vibrateDecorator } from "utils/input"
import { ConfigContext } from "shared/config"
import { ScrobberShift } from "components/Scrobber/ScrobberShift"
import { SContainer, SWrapper } from "./Scrobber.styled"
import { ScrobberRange } from "./ScrobberRange"

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
          <ScrobberShift
            value={props.value}
            intentValue={scrollShift}
            onChange={onShiftChange}
          />

          <ScrobberRange />
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
