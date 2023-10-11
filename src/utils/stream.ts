import dayjs from "dayjs"
import { createContext, useEffect } from "react"
import create from "zustand"
import { encodeQuery } from "./query"

import superjson from "superjson"

superjson.registerCustom<dayjs.Dayjs, string>(
  {
    isApplicable: (v): v is dayjs.Dayjs => v instanceof dayjs,
    serialize: (value) => value.toISOString(),
    deserialize: (iso) => dayjs(iso),
  },
  "dayjs"
)

export type StreamType = { from: number; to: number } | { shift: number }
export type PlaybackType = { playing: number } | { paused: dayjs.Dayjs }

export function generateUrl(name: string, args: StreamType): string | null {
  if ("from" in args && "to" in args) {
    return encodeQuery(`/api/data/${name}/slice.m3u8`, {
      from: Math.floor(args.from / 1000),
      to: Math.floor(args.to / 1000),
    })
  }

  return encodeQuery(`/api/data/${name}/stream.m3u8`, {
    shift: Math.floor(args.shift / 1000),
  })
}

type PlaybackState = {
  mode: "shift" | "range"
  now: dayjs.Dayjs
  playback: PlaybackType
  stream: StreamType

  refreshNow: () => number
  updatePlayback: (playback: "paused" | "playing") => void
  updateStream: (stream: StreamType) => void
  updateRangeSeek: (delta: number) => void
  setMode: (mode: "shift" | "range") => void
}

export const useStreamStore = create<PlaybackState>()((set) => {
  return {
    now: dayjs(),
    mode: "shift",
    playback: { playing: 0 },
    stream: { shift: 0 },

    setMode: (mode) => set({ mode }),

    refreshNow: () => {
      const now = dayjs()
      const nextTimer = Math.max(1000 - now.get("millisecond"), 0)

      set({ now })
      return nextTimer
    },
    updatePlayback(playback) {
      set((state) => {
        const now = dayjs()
        if ("playing" in state.playback && playback === "paused") {
          return {
            now,
            playback: {
              paused: now.add(state.playback.playing, "millisecond"),
            },
          }
        }

        if ("paused" in state.playback && playback === "playing") {
          if ("shift" in state.stream) {
            const newShift = state.playback.paused.diff(now, "millisecond")
            const oldShift = "shift" in state.stream ? -state.stream.shift : 0

            const pauseTime = Math.abs(newShift - oldShift)
            if (oldShift === 0 || pauseTime > 6 * 1000) {
              return {
                now,
                stream: { shift: -newShift },
                playback: { playing: newShift },
              }
            }
          }

          return {
            now,
            playback: {
              playing: state.playback.paused.diff(now, "millisecond"),
            },
          }
        }

        return {}
      })
    },
    updateStream(stream) {
      set((state) => {
        const now = dayjs()

        if (generateUrl("_", state.stream) === generateUrl("_", stream)) {
          return {}
        }

        if ("shift" in stream) {
          return {
            mode: "shift",
            now,
            stream,
            playback: { playing: -stream.shift },
          }
        }

        if ("from" in stream && "to" in stream) {
          return {
            mode: "range",
            now,
            stream,
            playback: {
              playing: dayjs(stream.from).diff(now, "millisecond"),
            },
          }
        }

        return {}
      })
    },
    updateRangeSeek(delta) {
      set((state) => {
        if ("from" in state.stream && "to" in state.stream) {
          const dateFrom = dayjs(state.stream.from)
          const dateTo = dayjs(state.stream.to)

          if ("playing" in state.playback) {
            const shiftFrom = dateFrom.diff(state.now, "millisecond")
            const shiftTo = dateTo.diff(state.now, "millisecond")

            return {
              playback: {
                playing: Math.min(
                  shiftTo,
                  Math.max(shiftFrom, state.playback.playing + delta)
                ),
              },
            }
          }

          if ("paused" in state.playback) {
            return {
              playback: {
                paused: dayjs.min(
                  dateTo,
                  dayjs.max(
                    dateFrom,
                    state.playback.paused.add(delta, "millisecond")
                  )
                ),
              },
            }
          }
        }
        return {}
      })
    },
  }
})

export const useStreamPeriodicRefreshNow = () => {
  const refreshNow = useStreamStore((state) => state.refreshNow)
  useEffect(() => {
    let timer: number

    const tick = () => {
      const nextTimer = refreshNow()
      window.clearTimeout(timer)
      timer = window.setTimeout(tick, nextTimer)
    }
    tick()

    return () => void window.clearTimeout(timer)
  }, [refreshNow])
}

export const StreamContext = createContext<{
  streams: { key: string; name: string; color: string }[]
}>({ streams: [] })

export const getDateBounds = (
  now: dayjs.Dayjs,
  bounds: { shift: [number, number] } | { pov: [dayjs.Dayjs, dayjs.Dayjs] }
) => {
  if ("shift" in bounds) {
    const [min, max] = bounds.shift
    return {
      min: now.add(min, "millisecond"),
      max: now.add(max, "millisecond"),
    }
  }

  if ("pov" in bounds) {
    const [min, max] = bounds.pov
    return { min, max }
  }

  return null
}

export const fitDateInBounds = (
  pov: dayjs.Dayjs,
  bounds: { min: dayjs.Dayjs; max: dayjs.Dayjs } | null
) => {
  if (!bounds) return pov
  return dayjs.max([bounds.min, dayjs.min(bounds.max, pov)])
}
