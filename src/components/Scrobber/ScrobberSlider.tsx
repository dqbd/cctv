import { useRef, useLayoutEffect, useContext, useEffect } from "react"
import { useGesture, DragState } from "@use-gesture/react"
import { drawCanvas, usePropsRef } from "./ScrobberSlider.utils"
import { ConfigContext } from "shared/config"
import { SContainer, SCanvas } from "./ScrobberSlider.styled"
import dayjs from "dayjs"
import { PlaybackType, useStreamStore } from "utils/stream"

export function ScrobberSlider(props: {
  value: PlaybackType
  color: string
  bounds: { shift: [number, number] } | { pov: [dayjs.Dayjs, dayjs.Dayjs] }
  onScroll?: (shift: number) => void // shift is accepted as a positive number
  onScrollEnd?: (shift: number) => void // shift is accepted as a positive number
}) {
  const config = useContext(ConfigContext)

  // negative: to the left
  // positive: to the right
  const delta = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const boundsRef = useRef<
    { shift: [number, number] } | { pov: [dayjs.Dayjs, dayjs.Dayjs] }
  >(props.bounds)

  useEffect(() => void (boundsRef.current = props.bounds), [props.bounds])

  const propsRef = usePropsRef({
    onScroll: props.onScroll,
    onScrollEnd: props.onScrollEnd,
  })

  const bind = useGesture({
    onDrag(data: DragState) {
      data.event.stopPropagation()
      data.event.preventDefault()

      const movement = -data.movement[0] * 1000
      delta.current = movement
      propsRef.current.onScroll?.(delta.current)
    },
    onDragEnd() {
      const shift = delta.current
      delta.current = 0
      propsRef.current.onScrollEnd?.(shift)
    },
    onWheel(data) {
      delta.current = data.movement[1] * 1000
      propsRef.current.onScroll?.(delta.current)
    },
    onWheelEnd() {
      const shift = delta.current
      delta.current = 0
      propsRef.current.onScrollEnd?.(shift)
    },
  })

  // the idea: we don't need to specify the day, it should be resolved by itself.
  // just make sure we don't draw outside the canvas
  useLayoutEffect(() => {
    let animationId = 0
    const canvas = canvasRef.current
    function loop() {
      const now = useStreamStore.getState().now
      drawCanvas(canvas, now, props.value, delta.current, props.color, {
        maxAge: config.maxAge,
        bounds: boundsRef.current,
      })

      animationId = window.requestAnimationFrame(loop)
    }
    loop()

    return () => window.cancelAnimationFrame(animationId)
  }, [config.maxAge, props.color, props.value])

  return (
    <SContainer>
      <SCanvas
        ref={canvasRef}
        height={100}
        {...bind()}
        onTouchMove={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      />
    </SContainer>
  )
}

export default ScrobberSlider
