import moment from "moment"

const SECONDS_PER_DAY = 24 * 60 * 60
const LINE_HEIGHT = 10

export function drawCanvas(
  canvas: HTMLCanvasElement | null,
  valueOffset: number,
  userOffset: number,
  color: string,
  options: { maxAge: number }
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
  const drawLine = (xFrom: number, xTo: number, viewOffset = 0) => {
    const { width, height } = canvas.getBoundingClientRect()

    ctx.lineWidth = LINE_HEIGHT
    ctx.strokeStyle = color

    const moveFromX = Math.min(width, Math.max(0, xFrom + viewOffset))
    const moveToX = Math.min(width, Math.max(0, xTo + viewOffset))

    ctx.beginPath()
    ctx.moveTo(moveFromX, height / 2)
    ctx.lineTo(moveToX, height / 2)
    ctx.closePath()
    ctx.stroke()
  }

  // hide progress bar when necessary
  const drawDayBoundedLine = (shift: number) => {
    const { width, height } = canvas.getBoundingClientRect()

    const now = moment()
    const shiftedNow = now.clone().add(shift, "seconds")
    const shiftedStart = shiftedNow.clone().startOf("day")
    const shiftedEnd = shiftedNow.clone().endOf("day")

    const startDayX = Math.min(options.maxAge, now.diff(shiftedStart, "second"))
    const endDayX = Math.max(0, now.diff(shiftedEnd, "second"))

    // invert direction, as we want to line to act as a timeline
    drawLine(-(endDayX + shift), -(startDayX + shift), width / 2)

    // draw text markers
    ctx.fillStyle = "white"
    ctx.textBaseline = "middle"
    ctx.textAlign = "center"

    const pointOfRef = shiftedNow.diff(shiftedStart, "second")
    for (let x = 0; x < SECONDS_PER_DAY; x += 5 * 60) {
      const minutes = Math.floor((x / 60) % 60)
      const hours = Math.floor(x / (60 * 60))

      const text = [hours, minutes]
        .map((i) => i.toString().padStart(2, "0"))
        .join(":")

      const textX = width / 2 - (pointOfRef - x)

      ctx.fillText(text, textX, height / 2 + LINE_HEIGHT * 1.75)
    }

    // draw minute line markers
    ctx.lineWidth = 2
    for (let x = 0; x < SECONDS_PER_DAY; x += 1 * 60) {
      const textX = width / 2 - (pointOfRef - x)

      ctx.strokeStyle =
        Math.floor((x / 60) % 60) === 0 ? "white" : "rgba(0,0,0,0.3)"

      ctx.beginPath()
      ctx.moveTo(textX, (height - LINE_HEIGHT) / 2)
      ctx.lineTo(textX, (height + LINE_HEIGHT) / 2)
      ctx.closePath()
      ctx.stroke()
    }
  }

  drawDayBoundedLine(valueOffset + userOffset)
}
