import { Fragment, useContext, useState } from "react"

import { HLSPlayer } from "components/HLSPlayer"
import { Controls } from "components/Controls/Controls"

import { css, Global } from "@emotion/react"
import { useRouter } from "next/dist/client/router"
import { ManifestArgs, StreamContext } from "utils/stream"
import { NextSeo } from "next-seo"
import { encodeQuery } from "utils/query"
import Head from "next/head"
import { GetServerSideProps } from "next"
import { loadServerConfig } from "shared/config"
import { theme } from "utils/theme"

function generateUrl(name: string, args: ManifestArgs): string | null {
  if ("from" in args && "to" in args) {
    return encodeQuery(`/api/data/${name}/slice.m3u8`, {
      from: Math.floor(args.from / 1000),
      to: Math.floor(args.to / 1000),
    })
  }

  if ("from" in args && "length" in args) {
    return encodeQuery(`/api/data/${name}/slice.m3u8`, {
      from: Math.floor(args.from / 1000),
      length: args.length,
    })
  }

  return encodeQuery(`/api/data/${name}/stream.m3u8`, {
    shift: Math.floor(args.shift / 1000),
  })
}

export default function Page() {
  const [args, setArgs] = useState<ManifestArgs>({ shift: 0 })

  const { query } = useRouter()
  const name = query.cameraKey as string | undefined
  const data = useContext(StreamContext)
  const stream = data.streams.find(({ key }) => key === name)

  const url = name ? generateUrl(name, args) : null

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
      <NextSeo title={stream?.name} />
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
        {url && <HLSPlayer source={url} />}
        {stream && <Controls onChange={setArgs} value={args} stream={stream} />}
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
