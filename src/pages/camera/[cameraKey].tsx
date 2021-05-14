import { Fragment, useContext, useState } from "react"

import { HLSPlayer } from "components/HLSPlayer"
import { Scrobber } from "components/Scrobber/Scrobber"

import { css } from "@emotion/react"
import { useRouter } from "next/dist/client/router"
import { StreamContext } from "utils/stream"
import { NextSeo } from "next-seo"

function generateUrl(args: {
  name?: string
  from: number
  to: number
  shift: number
}): string | null {
  if (!args.name) return null

  let baseUrl = `/api/data/${args.name}`
  let type = "/stream.m3u8"

  const params = []
  if (args.from > 0) {
    type = "/slice.m3u8"
    params.push(`from=${args.from}`)

    if (args.to > 0 && args.from < args.to) {
      params.push(`to=${args.to}`)
    }
  } else if (args.shift > 0) {
    params.push(`shift=${Math.ceil(args.shift / 1000)}`)
  }

  baseUrl += type
  if (params.length > 0) {
    baseUrl += "?" + params.join("&")
  }

  return baseUrl
}

export default function Page() {
  const [state, setState] = useState({
    from: 0,
    to: 0,
    shift: 0,
    showTools: false,
  })

  const { query } = useRouter()
  const name = query.cameraKey as string | undefined
  const data = useContext(StreamContext)
  const stream = data.streams.find(({ key }) => key === name)

  const url = generateUrl({
    name,
    from: state.from,
    to: state.to,
    shift: state.shift,
  })

  return (
    <Fragment>
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

          background: #090909;

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
          <Scrobber
            onChange={(shift) => setState((state) => ({ ...state, shift }))}
            value={state.shift}
            stream={stream}
          />
        )}
      </div>
    </Fragment>
  )
}
