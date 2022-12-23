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

  // draws the line, receving arguments as px, not relative to time
  const drawLine = (xFrom: number, xTo: number) => {
    const { width, height } = canvas.getBoundingClientRect()

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

  // hide progress bar when necessary [-inf, 0] in seconds
  const drawDayBoundedLine = (shift: number) => {
    const { width, height } = canvas.getBoundingClientRect()
    const viewOffset = width / 2

    const now = dayjs()
    const shiftedNow = now.add(shift, "seconds")

    const startOfDay = shiftedNow.startOf("day")
    const endOfDay = shiftedNow.endOf("day")

    // We use now instead of shiftedNow, why?
    const startDayX = Math.min(options.maxAge, now.diff(startOfDay, "second"))
    const endDayX = Math.max(0, now.diff(endOfDay, "second"))

    drawLine(viewOffset - startDayX - shift, viewOffset - endDayX - shift)

    /*
      startDayX = now.diff(startOfDay, "second")
      startDayX = now - startOfDay
      startDayX = now - (now + shift).startOf("day")

      output = startDayX + shift
      output = now - (now + shift).startOf("day") + shift
      output = now - (now + shift).startOf("day") + shift


      now > now + shift/2 > now + shift

      shift: 120s
      now: 00:00:00 1/1/2022
      now + shift: 23:58:00 31/12/2021

      (now + shift).startOf("day"): 00:00:00 31/12/2021

      now - (now + shift).startOf("day") = 00:00:00 1/1/2022 - 00:00:00 31/12/2021 = full day?

    */

    // draw text markers
    ctx.fillStyle = "white"
    ctx.textBaseline = "middle"
    ctx.textAlign = "center"

    const zeroAtX = viewOffset - shiftedNow.diff(startOfDay, "second")

    /*
    input = 120 -> 00:02:00 of same day

    shift = 0 (seconds from [-inf, 0])
    viewOffset = width / 2

    shiftedNow = moment().add(shift, "seconds")
    startOfDay = shiftedNow.startOf("day")

    zeroAtX = viewOffset - shiftedNow.diff(startOfDay, "second")
    zeroAtX = viewOffset - 
      moment().add(shift, "seconds")
        .diff(
          moment().add(shift, "seconds")
            .startOf("day"), 
          "second"
        )

    (shiftedNow - shiftedNow.startOf("day")) in seconds

    output = zeroAtX + input
    */

    for (let x = 0; x < SECONDS_PER_DAY; x += 5 * 60) {
      const minutes = Math.floor((x / 60) % 60)
      const hours = Math.floor(x / (60 * 60))

      const text = [hours, minutes]
        .map((i) => i.toString().padStart(2, "0"))
        .join(":")

      const textX = zeroAtX + x

      ctx.fillText(text, textX, height / 2 + LINE_HEIGHT * 1.75)
    }

    // draw minute line markers
    ctx.lineWidth = 2
    for (let x = 0; x < SECONDS_PER_DAY; x += 1 * 60) {
      const textX = zeroAtX + x

      ctx.strokeStyle =
        Math.floor((x / 60) % 60) === 0 ? "white" : "rgba(0,0,0,0.3)"

      ctx.beginPath()
      ctx.moveTo(textX, (height - LINE_HEIGHT) / 2)
      ctx.lineTo(textX, (height + LINE_HEIGHT) / 2)
      ctx.closePath()
      ctx.stroke()
    }

    // ctx.strokeStyle = "red"

    // ctx.beginPath()
    // ctx.moveTo(zeroAtX, height / 2 - 10)
    // ctx.lineTo(zeroAtX + 60, height / 2 - 10)
    // ctx.closePath()
    // ctx.stroke()
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
