import { useContext, useState } from "react"

import { HLSPlayer } from "components/HLSPlayer"
import { Scrobber } from "components/Scrobber/Scrobber"

import { API_URL } from "utils/constants"
import { css } from "@emotion/react"
import { useRouter } from "next/dist/client/router"
import { DataProvider } from "utils/dataProvider"

type Props = {
  name: string
  streams: {
    key: string
    name: string
    color: string
  }[]
}

type State = {
  from: number
  to: number
  shift: number
  showTools: boolean
}

function generateUrl(args: {
  name?: string
  from: number
  to: number
  shift: number
}): string | null {
  if (!args.name) return null

  let baseUrl = `${API_URL}/data/${args.name}/`
  let type = "stream.m3u8"

  let params = []
  if (args.from > 0) {
    type = "slice.m3u8"
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

export default function Page(props: Props) {
  const [state, setState] = useState<State>({
    from: 0,
    to: 0,
    shift: 0,
    showTools: false,
  })

  const { query } = useRouter()
  const name = query.cameraKey as string | undefined
  const data = useContext(DataProvider)
  const stream = data.streams.find(({ key }) => key === name)

  const url = generateUrl({
    name,
    from: state.from,
    to: state.to,
    shift: state.shift,
  })

  console.log(url)

  return (
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
  )
}
