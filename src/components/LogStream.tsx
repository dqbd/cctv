import { css } from "@emotion/react"
import { useStreamStore } from "utils/stream"
import { useQuery } from "@tanstack/react-query"
import { encodeQuery } from "utils/query"
import { z } from "zod"
import { useServerTimeDiff } from "components/Scrobber/ScrobberShift.utils"
import dayjs from "dayjs"
import { theme } from "utils/theme"
import { Fragment, useState } from "react"

const schema = z.object({
  cart: z.object({
    items: z.array(
      z.object({ name: z.string(), price: z.number(), qty: z.number() }),
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
    { refetchInterval: 1000 },
  )

  const serverDiff = useServerTimeDiff()
  const now = useStreamStore((state) => state.now)
  const playback = useStreamStore((state) => state.playback)

  const displayDate = (
    "playing" in playback
      ? now.add(playback.playing, "millisecond")
      : playback.paused
  ).add?.(serverDiff, "millisecond")

  const currentItem = log.data?.find(
    ({ timestamp }) => dayjs(timestamp).valueOf() <= displayDate.valueOf(),
  )

  const sum =
    currentItem?.data.cart.items.reduce(
      (memo, item) => item.price * item.qty + memo,
      0,
    ) ?? 0

  const [translucent, setTranslucent] = useState(false)

  return (
    <div
      css={css`
        width: 100%;

        @media (max-width: 864px) {
          aspect-ratio: none;
          width: auto;
        }
      `}
    >
      {currentItem && (
        <div
          onClick={() => setTranslucent((prev) => !prev)}
          className="text-white rounded-[0.5em] transition-all pointer-events-auto inline-grid grid-cols-[repeat(2,auto)] empty:hidden gap-[6px] gap-x-[32px] text-[24px] p-[0.5em]"
          css={css`
            background: ${theme.colors.blue500};

            @media (max-width: 864px) {
              font-size: 14px !important;
            }

            ${translucent && { opacity: 0.4 }}
          `}
        >
          {currentItem.data.cart.items.map((item, idx) => {
            const name = item.name || "Zboží"
            return (
              <Fragment key={idx}>
                <span>
                  {item.qty} x {name}
                </span>
                <span css={{ textAlign: "right" }}>
                  {item.price * item.qty} Kč
                </span>
              </Fragment>
            )
          })}
          {sum !== 0 && (
            <Fragment>
              <span
                css={{
                  gridColumnStart: 1,
                  gridColumnEnd: "span 2",
                  height: "1px",
                  background: "white",
                  opacity: 0.2,
                }}
              />
              <span>Celkem</span>
              <span css={{ textAlign: "right" }}>{sum} Kč</span>
            </Fragment>
          )}
          {currentItem.data.paid !== 0 && (
            <>
              <Fragment>
                <span>Zaplaceno</span>
                <span css={{ textAlign: "right" }}>
                  {currentItem.data.paid} Kč
                </span>
              </Fragment>
              <Fragment>
                <span>Vráceno</span>
                <span css={{ textAlign: "right" }}>
                  {currentItem.data.paid - sum} Kč
                </span>
              </Fragment>
            </>
          )}
        </div>
      )}
    </div>
  )
}
