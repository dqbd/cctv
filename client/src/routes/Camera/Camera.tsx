/** @jsxImportSource @emotion/react */
import { Component } from "react"

import { HLSPlayer } from "components/HLSPlayer"
import { Scrobber } from "components/Scrobber/Scrobber"

import { API_URL } from "utils/constants"
import { css } from "@emotion/react"

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

export default class Camera extends Component<Props, State> {
  state: State = {
    from: 0,
    to: 0,
    shift: 0,
    showTools: false,
  }

  generateUrl = ({
    name,
    from,
    to,
    shift,
  }: {
    name: string
    from: number
    to: number
    shift: number
  }): string | null => {
    let baseUrl = `${API_URL}/data/${name}/`
    let type = "stream.m3u8"

    let params = []
    if (from > 0) {
      type = "slice.m3u8"
      params.push(`from=${from}`)

      if (to > 0 && from < to) {
        params.push(`to=${to}`)
      }
    } else if (shift > 0) {
      params.push(`shift=${Math.ceil(shift / 1000)}`)
    }

    baseUrl += type
    if (params.length > 0) {
      baseUrl += "?" + params.join("&")
    }

    return baseUrl
  }

  componentWillUpdate(newProps: Props) {
    if (this.props.name !== newProps.name) {
      this.setState({ from: 0, to: 0, shift: 0 })
    }
  }

  render() {
    const { name, streams } = this.props
    const { from, to, shift } = this.state
    const url = this.generateUrl({ name, from, to, shift })

    const stream = streams.find(({ key }) => key === name)

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
            onChange={(shift) => this.setState({ shift })}
            value={shift}
            stream={stream}
          />
        )}
      </div>
    )
  }
}
