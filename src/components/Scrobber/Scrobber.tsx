import { useContext, useMemo, useState } from "react"
import { ScrobberSlider } from "components/Scrobber/ScrobberSlider"
import { ConfigContext } from "shared/config"
import { ScrobberShift } from "components/Scrobber/ScrobberShift"
import { useStreamStore } from "utils/stream"
import dayjs from "dayjs"
import { css } from "@emotion/react"
import { theme } from "utils/theme"
import styled from "@emotion/styled"

const SContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.lightBlue900};
  background: ${theme.colors.blue500};
  box-shadow: ${theme.shadows.md};

  padding: 0.8em;
  border-radius: 2.25em;
  margin-bottom: 1.25em;

  position: relative;

  &::after {
    content: "";
    border: 1.25em solid transparent;
    border-left-width: 0.8em;
    border-right-width: 0.8em;
    border-top-color: ${theme.colors.blue500};
    border-bottom-width: 0;
    position: absolute;
    top: 100%;
  }

  gap: 1em;

  @media (max-width: 864px) {
    padding: 0.4em;
    gap: 0.5em;
  }
`

export function Scrobber(props: {
  color: string
  onRangeSeek: (delta: number) => void
  onActivate: () => void
  className?: string
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
          dayjs.Dayjs,
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
    <div
      className={props.className}
      css={css`
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${theme.gradients.bottom};

        padding-bottom: max(2em, env(safe-area-inset-bottom));
      `}
    >
      <div className="relative flex flex-col">
        <div className="flex items-center justify-center mb-[calc(-5em/2+5px)]">
          <SContainer>
            <ScrobberShift
              intentShift={intentShift}
              bounds={bounds}
              onShiftSet={onShiftChange}
            />
          </SContainer>
        </div>

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
      </div>
    </div>
  )
}
