import { css } from "@emotion/react"
import {
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  MutableRefObject,
} from "react"
import { useGesture } from "@use-gesture/react"
import { config } from "shared/config"
import { drawCanvas } from "./Slider.utils"

function usePropsRef<Props>(props: Props) {
  const ref = useRef<Props>(props)

  useEffect(() => {
    ref.current = props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.values(props))

  return ref
}

function useUserOffsetRef(props: { value: number }): {
  ref: MutableRefObject<number>
  reset: () => { value: number; user: number }
  update: (value: number) => { value: number; user: number }
} {
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
        Math.max(-config.maxAge - props.value, newUser)
      )),
    }),
    [props.value]
  )

  return { ref, reset, update }
}

export function Slider(props: {
  value: number
  color: string
  onScroll?: (shift: number) => void
  onScrollEnd?: (shift: number) => void
}) {
  const value = -Math.floor(props.value / 1000)
  const userOffset = useUserOffsetRef({ value })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const propsRef = usePropsRef({
    onScroll: props.onScroll,
    onScrollEnd: props.onScrollEnd,
  })

  const bind = useGesture({
    onDrag(data) {
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
    function loop() {
      drawCanvas(canvasRef.current, value, userOffset.ref.current, props.color)
      animationId = window.requestAnimationFrame(loop)
    }
    loop()

    return () => window.cancelAnimationFrame(animationId)
  }, [props.color, value, userOffset.ref])

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
          touch-action: none;
        `}
        ref={canvasRef}
        height={100}
        {...bind()}
        onTouchMove={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
      />
    </div>
  )
}

export default Slider
