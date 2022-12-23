import dayjs from "dayjs"
import { useCallback, useEffect, useRef } from "react"

const SECONDS_PER_DAY = 24 * 60 * 60
const LINE_HEIGHT = 10

export function drawCanvas(
  canvas: HTMLCanvasElement | null,
  valueOffset: number,
  userOffset: number,
  color: string,
  options: { maxAge: number; sticky: { start?: number; end?: number } }
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

  const drawDayBoundedLine = (shift: number) => {
    const now = dayjs()
    const pov = now.add(shift, "seconds")

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
    for (let x = 0; x <= SECONDS_PER_DAY; x += 1 * 60) {
      const textX = toCoordX(pov, povStartOfDay.add(x, "second"))

      // every 5 minutes draw a text
      if (x % (5 * 60) === 0) {
        const minutes = Math.floor((x / 60) % 60)
        const hours = Math.floor(x / (60 * 60)) % 24

        const text = [hours, minutes]
          .map((i) => i.toString().padStart(2, "0"))
          .join(":")

        ctx.fillText(text, textX, height / 2 + LINE_HEIGHT * 1.75)
      }

      // every 60 minutes draw a white line
      ctx.strokeStyle = x % (60 * 60) === 0 ? "white" : "rgba(0,0,0,0.3)"

      ctx.beginPath()
      ctx.moveTo(textX, (height - LINE_HEIGHT) / 2)
      ctx.lineTo(textX, (height + LINE_HEIGHT) / 2)
      ctx.closePath()
      ctx.stroke()
    }
  }

  drawDayBoundedLine(valueOffset + userOffset)
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

export function useUserOffsetRef(props: { value: number; maxAge: number }) {
  const ref = useRef<number>(0)

  const reset = useCallback(() => {
    const user = ref.current
    ref.current = 0
    return { value: props.value, user }
  }, [props.value])

  const update = useCallback(
    (newUser: number) => ({
      value: props.value,
      user: (ref.current = Math.min(
        -props.value,
        Math.max(-props.maxAge - props.value, newUser)
      )),
    }),
    [props.maxAge, props.value]
  )

  return { ref, reset, update }
}
