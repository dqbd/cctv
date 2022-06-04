import { useRef, useLayoutEffect, useState, useEffect } from "react"
import { config } from "shared/config"
import moment from "moment"

export const formatTime = (time: number) => {
  const absTime = Math.abs(time)

  const seconds = Math.floor(absTime / 1000) % 60
  const minutes = Math.floor(absTime / 1000 / 60) % 60
  const hours = Math.floor(absTime / 1000 / 60 / 60) % 24
  const days = Math.floor(absTime / 1000 / 60 / 60 / 24)

  const result = []
  if (seconds > 0 || minutes > 0 || hours > 0) {
    result.unshift(`${seconds.toFixed(0).padStart(2, "0")}s`)
  }

  if (minutes > 0 || hours > 0) {
    result.unshift(`${minutes.toFixed(0).padStart(2, "0")}m`)
  }
  if (hours > 0) {
    result.unshift(`${hours.toFixed(0).padStart(2, "0")}h`)
  }

  if (days > 0) {
    result.unshift(`${days}d`)
  }

  return `${Math.sign(time) < 0 ? "-" : ""}${result.join(" ")}`
}

export const useTimer = () => {
  const [current, setCurrent] = useState(Date.now())
  useLayoutEffect(() => {
    let timer: number

    const tick = () => {
      const now = Date.now()
      const nextTimer = Math.max(1000 - new Date(now).getMilliseconds(), 0)
      setCurrent(now)

      window.clearTimeout(timer)
      timer = window.setTimeout(tick, nextTimer)
    }
    tick()

    return () => void window.clearTimeout(timer)
  }, [])

  return current
}

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

    show.current()

    return () => void window.clearTimeout(timer)
  }, [delay])

  return { visible, show, hide }
}

export function getDateBounds(now: number) {
  let minRangeRounded = now - config.maxAge * 1000
  minRangeRounded -= minRangeRounded % (60 * 1000)

  let maxRangeRounded = now
  maxRangeRounded += 60 * 1000 - (maxRangeRounded % (60 * 1000))

  const min = moment(new Date(minRangeRounded))
  const max = moment(new Date(maxRangeRounded))

  return { min, max }
}

export function vibrateDecorator<T extends Array<unknown>, U>(
  callback: (...args: T) => U
) {
  return (...args: T): U => {
    try {
      navigator.vibrate(200)
    } catch (err) {}
    return callback?.(...args)
  }
}
