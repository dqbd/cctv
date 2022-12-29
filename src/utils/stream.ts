import dayjs from "dayjs"
import { createContext, useEffect } from "react"
import create from "zustand"
import { encodeQuery } from "./query"

import superjson from "superjson"

import { persist } from "zustand/middleware"

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
    return encodeQuery(
      `http://192.168.2.152:3000/api/data/${name}/slice.m3u8`,
      {
        from: Math.floor(args.from / 1000),
        to: Math.floor(args.to / 1000),
      }
    )
  }

  return encodeQuery(`http://192.168.2.152:3000/api/data/${name}/stream.m3u8`, {
    shift: Math.floor(args.shift / 1000),
  })
}

type PlaybackState = {
  now: dayjs.Dayjs
  playback: PlaybackType
  stream: StreamType

  refreshNow: () => number
  updatePlayback: (playback: "paused" | "playing") => void
  updateStream: (stream: StreamType) => void
}

export const useStreamStore = create<PlaybackState>()(
  persist(
    (set) => {
      return {
        now: dayjs(),
        playback: { playing: 0 },
        stream: { shift: 0 },

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
                const oldShift =
                  "shift" in state.stream ? -state.stream.shift : 0

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
                now,
                stream,
                playback: { playing: -stream.shift },
              }
            }

            if ("from" in stream && "to" in stream) {
              return {
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
      }
    },
    {
      name: "state",
      partialize: (state) => ({
        stream: state.stream,
        playback: state.playback,
      }),
      getStorage: () => ({
        getItem: (key) => {
          const searchParams = new URLSearchParams(
            window.location.hash.slice(1)
          )

          const storedValue = searchParams.get(key)
          if (storedValue == null) return null
          return superjson.parse(window.atob(storedValue))
        },
        setItem: (key, newValue) => {
          const searchParams = new URLSearchParams(
            window.location.hash.slice(1)
          )
          searchParams.set(key, window.btoa(superjson.stringify(newValue)))
          window.location.hash = searchParams.toString()
        },
        removeItem: (key) => {
          const searchParams = new URLSearchParams(
            window.location.hash.slice(1)
          )
          searchParams.delete(key)
          window.location.hash = searchParams.toString()
        },
      }),
    }
  )
)

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

export const fitDateInBounds = (
  pov: dayjs.Dayjs,
  now: dayjs.Dayjs,
  bounds: { shift: [number, number] } | { pov: [dayjs.Dayjs, dayjs.Dayjs] }
) => {
  if ("shift" in bounds) {
    const [min, max] = bounds.shift
    return dayjs.max([
      now.add(min, "millisecond"),
      dayjs.min([now.add(max, "millisecond"), pov]),
    ])
  }

  if ("pov" in bounds) {
    const [min, max] = bounds.pov
    return dayjs.max([min, dayjs.min([max, pov])])
  }

  return pov
}
