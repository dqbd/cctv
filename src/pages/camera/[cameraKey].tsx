import { Fragment, useContext, useEffect, useRef, useState } from "react"

import { HLSPlayer } from "components/HLSPlayer"
import { Controls } from "components/Controls/Controls"

import { css, Global } from "@emotion/react"
import { useRouter } from "next/dist/client/router"
import {
  StreamType,
  StreamContext,
  useStreamStore,
  useStreamPeriodicRefreshNow,
  generateUrl,
  fitDateInBounds,
  getDateBounds,
} from "utils/stream"
import { NextSeo } from "next-seo"
import Head from "next/head"
import { GetServerSideProps } from "next"
import { loadServerConfig } from "shared/config"
import { theme } from "utils/theme"
import { useVisibleTimer } from "components/Controls/Controls.utils"
import { useQuery } from "@tanstack/react-query"
import { encodeQuery } from "utils/query"
import { z } from "zod"
import { useServerTimeDiff } from "components/Scrobber/ScrobberShift.utils"
import dayjs from "dayjs"

const schema = z.object({
  cart: z.object({
    items: z.array(
      z.object({ name: z.string(), price: z.number(), qty: z.number() })
    ),
  }),
})

function LogStream(props: {
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
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 1.5em;
            font-weight: bold;
            margin: 16px;
            font-family: monospace;

            -webkit-text-stroke: 1px black;
          `}
        >
          {currentItem?.data.cart.items.map((item, idx) => {
            const name = item.name || "Zboží"
            return (
              <div key={idx}>
                {item.qty} x {name} ... {item.price * item.qty} Kč
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  useStreamPeriodicRefreshNow()

  const videoRef = useRef<HTMLVideoElement | null>(null)

  const { query } = useRouter()
  const name = query.cameraKey as string | undefined
  const data = useContext(StreamContext)
  const meta = data.streams.find(({ key }) => key === name)

  const stream = useStreamStore((state) => state.stream)
  const url = name ? generateUrl(name, stream) : null

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { visible, show } = useVisibleTimer(5 * 1000)

  return (
    <Fragment>
      <Head>
        <meta name="theme-color" content="#090909" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=5.0, viewport-fit=cover"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </Head>
      <Global
        styles={css`
          html {
            background: ${theme.colors.gray100};
          }
        `}
      />
      <NextSeo title={meta?.name} />
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: center;

          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;

          & > video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: center;
          }
        `}
      >
        {url && (
          <HLSPlayer
            videoRef={videoRef}
            source={url}
            visible={visible}
            show={show}
          />
        )}
        {meta && mounted && (
          <Controls
            stream={meta}
            visible={visible}
            show={show}
            onRangeSeek={(delta) => {
              if (videoRef.current != null) {
                videoRef.current.currentTime += delta / 1000
              }
            }}
          />
        )}

        {meta && <LogStream stream={meta} />}
      </div>
    </Fragment>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { config } = await loadServerConfig()

  return {
    props: { config },
  }
}
