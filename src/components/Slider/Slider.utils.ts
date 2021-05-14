import moment from "moment"
import { config } from "shared/config"

export function drawCanvas(
  canvas: HTMLCanvasElement | null,
  valueOffset: number,
  userOffset: number,
  color: string
) {
  if (!canvas || !canvas.parentElement) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const parentRect = canvas.parentElement.getBoundingClientRect()
  canvas.width = parentRect.width
  canvas.height = parentRect.height

  // draws the line, receving arguments as px, not relative to time
  const drawLine = (xFrom: number, xTo: number, viewOffset = 0) => {
    const { width, height } = canvas.getBoundingClientRect()

    ctx.lineWidth = 10
    ctx.strokeStyle = color

    ctx.beginPath()
    ctx.moveTo(Math.min(width, Math.max(0, xFrom + viewOffset)), height / 2)
    ctx.lineTo(Math.min(width, Math.max(0, xTo + viewOffset)), height / 2)
    ctx.closePath()
    ctx.stroke()
  }

  // hide progress bar when necessary
  const drawDayBoundedLine = (shift: number) => {
    const { width } = canvas.getBoundingClientRect()

    const now = moment()
    const shiftedNow = now.clone().add(shift, "seconds")
    const startDayX = Math.min(
      config.maxAge,
      now.diff(shiftedNow.clone().startOf("day"), "second")
    )
    const endDayX = Math.max(
      0,
      now.diff(shiftedNow.clone().endOf("day"), "second")
    )

    // invert direction, as we want to line to act as a timeline
    drawLine(-(endDayX + shift), -(startDayX + shift), width / 2)
  }

  drawDayBoundedLine(valueOffset + userOffset)
}
