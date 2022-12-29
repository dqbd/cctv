import dayjs from "dayjs"
import { useCallback, useEffect, useRef } from "react"
import { fitDateInBounds, PlaybackType } from "utils/stream"

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const LINE_HEIGHT = 10

export function drawCanvas(
  canvas: HTMLCanvasElement | null,
  now: dayjs.Dayjs,
  valueOffset: PlaybackType,
  userOffset: number,
  color: string,
  options: {
    maxAge: number
    bounds: { shift: [number, number] } | { pov: [dayjs.Dayjs, dayjs.Dayjs] }
  }
) {
  if (!canvas || !canvas.parentElement) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const parentRect = canvas.parentElement.getBoundingClientRect()
  canvas.width = parentRect.width * 2
  canvas.height = parentRect.height * 2

  canvas.style.width = `${parentRect.width}px`
  canvas.style.height = `${parentRect.height}px`

  ctx.scale(2, 2)

  const { width, height } = canvas.getBoundingClientRect()

  // draws the line, receving arguments as px, not relative to time
  const drawLine = (xFrom: number, xTo: number) => {
    ctx.lineWidth = LINE_HEIGHT
    ctx.strokeStyle = color

    const moveFromX = Math.min(width, Math.max(0, xFrom))
    const moveToX = Math.min(width, Math.max(0, xTo))

    ctx.beginPath()
    ctx.moveTo(moveFromX, height / 2)
    ctx.lineTo(moveToX, height / 2)
    ctx.closePath()
    ctx.stroke()
  }

  // converts a specific date to a relative px position
  const toCoordX = (pov: dayjs.Dayjs, date: dayjs.Dayjs) => {
    return width / 2 - pov.diff(date, "second")
  }

  const drawDayBoundedLine = (playback: PlaybackType, user: number) => {
    const pov = fitDateInBounds(
      ("playing" in playback
        ? now.add(playback.playing, "millisecond")
        : playback.paused
      ).add(user, "millisecond"),
      now,
      options.bounds
    )

    const povStartOfDay = pov.startOf("day")
    const povEndOfDay = pov.endOf("day")

    const recordStart = now.subtract(options.maxAge, "second")
    const recordEnd = now

    drawLine(
      toCoordX(pov, dayjs.max(recordStart, povStartOfDay)),
      toCoordX(pov, dayjs.min(recordEnd, povEndOfDay))
    )

    // draw markers
    ctx.fillStyle = "white"
    ctx.textBaseline = "middle"
    ctx.textAlign = "center"
    ctx.lineWidth = 2
    for (let x = 0; x <= MILLISECONDS_PER_DAY; x += 1 * 60 * 1000) {
      const textX = toCoordX(pov, povStartOfDay.add(x, "millisecond"))

      // every 5 minutes draw a text
      if (x % (5 * 60 * 1000) === 0) {
        const minutes = Math.floor((x / (60 * 1000)) % 60)
        const hours = Math.floor(x / (60 * 60 * 1000)) % 24

        const text = [hours, minutes]
          .map((i) => i.toString().padStart(2, "0"))
          .join(":")

        ctx.fillText(text, textX, height / 2 + LINE_HEIGHT * 1.75)
      }

      // every 60 minutes draw a white line
      ctx.strokeStyle = x % (60 * 60 * 1000) === 0 ? "white" : "rgba(0,0,0,0.3)"

      ctx.beginPath()
      ctx.moveTo(textX, (height - LINE_HEIGHT) / 2)
      ctx.lineTo(textX, (height + LINE_HEIGHT) / 2)
      ctx.closePath()
      ctx.stroke()
    }
  }

  drawDayBoundedLine(valueOffset, userOffset)
}

export function usePropsRef<Props extends Record<string, unknown>>(
  props: Props
) {
  const ref = useRef<Props>(props)

  useEffect(() => {
    ref.current = props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.values(props))

  return ref
}
