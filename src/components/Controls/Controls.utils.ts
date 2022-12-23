import { useRef, useState, useEffect } from "react"

const events = [
  "mousemove",
  "mousedown",
  "resize",
  "keydown",
  "touchstart",
  "wheel",
]

export const useVisibleTimer = (delay = 1000) => {
  const [visible, setVisible] = useState(true)
  const show = useRef<() => void>(() => setVisible(true))
  const hide = useRef<() => void>(() => setVisible(false))

  useEffect(() => {
    let timer: number

    hide.current = () => {
      window.clearTimeout(timer)
      setVisible(false)
    }

    show.current = () => {
      window.clearTimeout(timer)
      setVisible(true)
      timer = window.setTimeout(hide.current, delay)
    }

    document.addEventListener("visibilitychange", show.current)
    for (const eventName of events) {
      window.addEventListener(eventName, show.current)
    }

    show.current()

    return () => {
      document.removeEventListener("visibilitychange", show.current)
      for (const eventName of events) {
        window.removeEventListener(eventName, show.current)
      }

      window.clearTimeout(timer)
    }
  }, [delay])

  return { visible, show, hide }
}
