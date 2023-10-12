import { Fragment, useContext, useEffect, useRef, useState } from "react"

import { HLSPlayer } from "components/HLSPlayer"
import { Controls } from "components/Controls/Controls"

import { css, Global } from "@emotion/react"
import { useRouter } from "next/dist/client/router"
import {
  StreamContext,
  useStreamStore,
  useStreamPeriodicRefreshNow,
  generateUrl,
} from "utils/stream"
import { NextSeo } from "next-seo"
import Head from "next/head"
import { GetServerSideProps } from "next"
import { loadServerConfig } from "shared/config"
import { theme } from "utils/theme"
import { useVisibleTimer } from "components/Controls/Controls.utils"

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
  const [muted, setMuted] = useState(true)

  useEffect(() => setMounted(true), [])

  const { visible, show } = useVisibleTimer(5 * 1000)

  return (
    <Fragment>
      <Head>
        <meta name="theme-color" content="#090909" />
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
        className="flex items-center justify-center absolute inset-0"
        css={css`
          min-height: 100vh;
          min-height: 100dvh;
        `}
      >
        {url && (
          <HLSPlayer
            videoRef={videoRef}
            source={url}
            visible={visible}
            show={show}
            muted={muted}
          />
        )}
        {meta && mounted && (
          <Controls
            stream={meta}
            visible={visible}
            muted={muted}
            onMuteClick={() => setMuted((muted) => !muted)}
            show={show}
            onRangeSeek={(delta) => {
              if (videoRef.current != null) {
                videoRef.current.currentTime += delta / 1000
              }
            }}
          />
        )}
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
