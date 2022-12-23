import { useRef, useLayoutEffect, useContext } from "react"
import { useGesture, DragState } from "@use-gesture/react"
import {
  drawCanvas,
  usePropsRef,
  useUserOffsetRef,
} from "./ScrobberSlider.utils"
import { ConfigContext } from "shared/config"
import { SContainer, SCanvas } from "./ScrobberSlider.styled"

export function ScrobberSlider(props: {
  value: number
  color: string
  onScroll?: (shift: number) => void
  onScrollEnd?: (shift: number) => void
}) {
  const config = useContext(ConfigContext)
  const value = -Math.floor(props.value / 1000)
  const userOffset = useUserOffsetRef({ value, maxAge: config.maxAge })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const propsRef = usePropsRef({
    onScroll: props.onScroll,
    onScrollEnd: props.onScrollEnd,
  })

  const bind = useGesture({
    onDrag(data: DragState) {
      data.event.stopPropagation()
      data.event.preventDefault()

      const { user, value } = userOffset.update(-data.movement[0])
      propsRef.current.onScroll?.(-(value + user) * 1000)
    },
    onDragEnd() {
      const { user, value } = userOffset.reset()
      propsRef.current.onScrollEnd?.(-(value + user) * 1000)
    },
  })

  // the idea: we don't need to specify the day, it should be resolved by itself.
  // just make sure we don't draw outside the canvas
  useLayoutEffect(() => {
    let animationId = 0
    const canvas = canvasRef.current
    function loop() {
      drawCanvas(canvas, value, userOffset.ref.current, props.color, {
        maxAge: config.maxAge,
        sticky: {
          start: Math.floor(
            new Date("2022-12-10T06:50:00.000Z").valueOf() / 1000
          ),
          end: Math.floor(
            new Date("2022-12-10T07:30:00.000Z").valueOf() / 1000
          ),
        },
      })

      animationId = window.requestAnimationFrame(loop)
    }
    loop()

    return () => window.cancelAnimationFrame(animationId)
  }, [config.maxAge, props.color, value, userOffset.ref])

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
