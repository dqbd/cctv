import { css } from "@emotion/react"
import { useRef, useLayoutEffect, useEffect } from "react"
import { useGesture, GestureHandlersPartial } from "react-use-gesture"
import { config } from "shared/config"
import { drawCanvas } from "./Slider.utils"

export function Slider(props: {
  value: number
  color: string
  onScroll?: (shift: number) => void
  onScrollEnd?: (shift: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollCallbackRef = useRef<
    Omit<GestureHandlersPartial, "onWheelEnd" | "onDragEnd"> & {
      onDragEnd: () => void
      onWheelEnd: () => void
    }
  >({
    onDrag: () => void 0,
    onDragEnd: () => void 0,
    onWheel: () => void 0,
    onWheelEnd: () => void 0,
  })
  const propsCallbackRef = useRef<{
    onScroll?: (shift: number) => void
    onScrollEnd?: (shift: number) => void
  }>({})

  const bind = useGesture({
    onWheel: (event) => scrollCallbackRef.current.onWheel?.(event),
    onDrag: (event) => scrollCallbackRef.current.onDrag?.(event),
    onWheelEnd: () => scrollCallbackRef.current.onWheelEnd?.(),
    onDragEnd: () => scrollCallbackRef.current.onDragEnd?.(),
  })

  useEffect(() => {
    propsCallbackRef.current.onScroll = props.onScroll
    propsCallbackRef.current.onScrollEnd = props.onScrollEnd
  }, [props.onScroll, props.onScrollEnd])

  // the idea: we don't need to specify the day, it should be resolved by itself.
  // just make sure we don't draw outside the canvas
  useLayoutEffect(() => {
    let animationId = 0

    // offset of the slider caused by value
    const valueOffset = -Math.floor(props.value / 1000)
    const color = props.color

    // offset set temporarily during scrolling
    let userOffset = 0

    function loop() {
      drawCanvas(canvasRef.current, valueOffset, userOffset, color)
      animationId = window.requestAnimationFrame(loop)
    }

    function onScroll(delta: number) {
      userOffset = delta

      // limit userOffset to be in range of <-MAX_LENGTH_IN_SECONDS, 0>, as userOffset is negative in nature
      // (valueOffset + userOffset) <= 0 && (valueOffset + userOffset) >= -MAX_LENGTH_IN_SECONDS
      userOffset = Math.min(
        -valueOffset,
        Math.max(-config.maxAge - valueOffset, userOffset)
      )

      // onScroll assumes offset in ms
      propsCallbackRef.current.onScroll?.(-(valueOffset + userOffset) * 1000)
    }

    function onScrollEnd() {
      propsCallbackRef.current.onScrollEnd?.(-(valueOffset + userOffset) * 1000)
    }

    scrollCallbackRef.current = {
      onDrag: (event) => onScroll(-event.delta[0]),
      onWheel: (event) => onScroll(event.delta[0] || -event.delta[1]),
      onDragEnd: onScrollEnd,
      onWheelEnd: onScrollEnd,
    }

    loop()

    return () => window.cancelAnimationFrame(animationId)
  }, [props.value, props.color])

  return (
    <div
      css={css`
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        cursor: all-scroll;

        height: 5em;
      `}
    >
      <canvas
        css={css`
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
        `}
        ref={canvasRef}
        height={100}
        {...bind()}
      />
    </div>
  )
}

export default Slider
