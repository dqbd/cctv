import { useContext, useState } from "react"
import { ScrobberSlider } from "components/Scrobber/ScrobberSlider"
import { formatTime, vibrateDecorator } from "./Scrobber.utils"
import { ConfigContext } from "shared/config"
import { ScrobberTimelineTimePicker } from "components/Scrobber/ScrobberTimelineTimePicker"
import { ScrobberTimelineDatePicker } from "components/Scrobber/ScrobberTimelineDatePicker"
import {
  SCenter,
  SLive,
  STimeline,
  STimeOffset,
} from "./ScrobberTimeline.styled"

export function ScrobberTimeline(props: {
  color: string
  value: number
  onChange: (shift: number) => void
  onMove: () => void
}) {
  const config = useContext(ConfigContext)
  const [scrollShift, setScrollShift] = useState<number | null>(null)
  const onShiftCommit = vibrateDecorator((shift: number) => {
    setScrollShift(null)
    props.onChange(Math.max(0, Math.min(config.maxAge * 1000, shift)))
  })

  const contentShift = scrollShift != null ? scrollShift : props.value

  return (
    <>
      <STimeline>
        <SCenter>
          <div css={{ display: "flex" }}>
            <STimeOffset onClick={() => onShiftCommit(0)}>
              {!contentShift ? <SLive>Živě</SLive> : formatTime(-contentShift)}
            </STimeOffset>

            <ScrobberTimelineTimePicker
              value={contentShift}
              onChange={onShiftCommit}
              css={{ marginLeft: "-1.25em", padding: "0rem 3em" }}
            />
          </div>
          <ScrobberTimelineDatePicker
            value={contentShift}
            onChange={onShiftCommit}
          />
        </SCenter>
      </STimeline>
      <ScrobberSlider
        onScroll={(value) => {
          setScrollShift(value)
          props.onMove()
        }}
        onScrollEnd={onShiftCommit}
        value={props.value}
        color={props.color}
      />
    </>
  )
}
