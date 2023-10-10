import { css } from "@emotion/react"
import { useStreamStore } from "utils/stream"
import { useQuery } from "@tanstack/react-query"
import { encodeQuery } from "utils/query"
import { z } from "zod"
import { useServerTimeDiff } from "components/Scrobber/ScrobberShift.utils"
import dayjs from "dayjs"
import { theme } from "utils/theme"

const schema = z.object({
  cart: z.object({
    items: z.array(
      z.object({ name: z.string(), price: z.number(), qty: z.number() })
    ),
  }),
  paid: z.number(),
  status: z.enum(["STAGE_TYPING", "COMMIT_END"]),
})

export function LogStream(props: {
  stream: {
    key: string
  }
}) {
  const stream = useStreamStore((state) => state.stream)
  const log = useQuery(
    [props.stream.key, stream] as const,
    async ({ queryKey: [camera, args] }) => {
      let url: string

      if ("from" in args && "to" in args) {
        url = encodeQuery(`/api/data/${camera}/log/stream`, {
          from: Math.floor(args.from / 1000),
          to: Math.floor(args.to / 1000),
        })
      } else {
        url = encodeQuery(`/api/data/${camera}/log/stream`, {
          shift: Math.floor(args.shift / 1000),
        })
      }

      const json: Array<{
        json: string
        timestamp: number
      }> = await fetch(url).then((res) => res.json())

      return json
        .map(({ json, timestamp }) => ({
          timestamp,
          data: schema.parse(JSON.parse(json)),
        }))
        .reverse()
    },
    { refetchInterval: 1000 }
  )

  const serverDiff = useServerTimeDiff()
  const now = useStreamStore((state) => state.now)
  const playback = useStreamStore((state) => state.playback)

  const displayDate = (
    "playing" in playback
      ? now.add(playback.playing, "millisecond")
      : playback.paused
  ).add(serverDiff, "millisecond")

  const currentItem = log.data?.find(
    ({ timestamp }) => dayjs(timestamp).valueOf() <= displayDate.valueOf()
  )

  const sum = currentItem?.data.cart.items.reduce(
    (memo, item) => item.price * item.qty + memo,
    0
  )

  return (
    <div
      css={css`
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        position: fixed;
        z-index: 9999;
        color: white;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      `}
    >
      <div
        css={css`
          aspect-ratio: 16 / 9;
          width: 100%;
        `}
      >
        {currentItem && (
          <div
            css={css`
              display: inline-flex;
              flex-direction: column;
              gap: 6px;
              font-size: 1.5em;
              margin: 16px;
              padding: 0.4em;
              border-radius: 0.5em;
              background: ${theme.colors.blue500};

              &:empty {
                display: none;
              }
            `}
          >
            {currentItem.data.cart.items.map((item, idx) => {
              const name = item.name || "Zboží"
              return (
                <div key={idx}>
                  {item.qty} x {name} ... {item.price * item.qty} Kč
                </div>
              )
            })}
            {sum !== 0 && <div>Celkem: ... {sum} Kč</div>}
            {currentItem.data.paid !== 0 && (
              <div>Vrátit: ... {currentItem.data.paid} Kč</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
