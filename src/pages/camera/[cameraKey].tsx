import { Fragment, useContext, useState } from "react"

import { HLSPlayer } from "components/HLSPlayer"
import { Scrobber } from "components/Scrobber/Scrobber"

import { css, Global } from "@emotion/react"
import { useRouter } from "next/dist/client/router"
import { StreamContext } from "utils/stream"
import { NextSeo } from "next-seo"
import { encodeQuery } from "utils/query"
import Head from "next/head"

function generateUrl(
  name: string,
  args: {
    from?: number
    to?: number
    shift: number
  }
): string | null {
  if ((args.from ?? 0) > 0) {
    return encodeQuery(`/api/data/${name}/slice.m3u8`, {
      from: args.from,
      to: args.to,
    })
  }

  return encodeQuery(`/api/data/${name}/stream.m3u8`, {
    shift: Math.floor(args.shift / 1000),
  })
}

export default function Page() {
  const [shift, setShift] = useState(0)

  const { query } = useRouter()
  const name = query.cameraKey as string | undefined
  const data = useContext(StreamContext)
  const stream = data.streams.find(({ key }) => key === name)

  const url = name ? generateUrl(name, { shift }) : null

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
            background: #090909;
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
        {stream && (
          <Scrobber onChange={setShift} value={shift} stream={stream} />
        )}
      </div>
    </Fragment>
  )
}
