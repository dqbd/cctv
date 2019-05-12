import React, { Component } from 'react'

import styles from './Camera.module.css'
import Live from '../../components/Live/Live'
import Dvr from '../../components/Dvr/Dvr'
import Scrobber from '../../components/Scrobber/Scrobber'

import { API_URL } from '../../utils/constants'

type Props = {
  name: string,
  streams: {
    port: number,
    name: string,
    key: string,
  }[],
}


type State = {
  from: number,
  to: number,
  shift: number,
  showTools: boolean,
}

export default class Camera extends Component<Props, State> {
  state: State = {
    from: 0,
    to: 0,
    shift: 0,
    showTools: false,
  }
  
  generateUrl = ({ name, from, to, shift }: { name: string, from: number, to: number, shift: number }): string | null => {
    if (!shift && !from && !to) return null
    
    let baseUrl = `${API_URL}/data/${name}/`
    let type = 'stream.m3u8'

    let params = []
    if (from > 0) {
      type = 'slice.m3u8'
      params.push(`from=${from}`)

      if (to > 0 && from < to) {
        params.push(`to=${to}`)
      }
    } else if (shift > 0) {
      params.push(`shift=${shift}`)
    }

    baseUrl += type
    if (params.length > 0) {
      baseUrl += '?' + params.join('&')
    }

    return baseUrl
  }

  componentWillUpdate(newProps: Props) {
    if (this.props.name !== newProps.name) {
      this.setState({ from: 0, to: 0, shift: 0 })
    }
  }

  handlePause = () => {
    console.log('handling pause')
  }

  handleShiftChange = (shift: number) => {
    console.log(shift)
    this.setState({ shift })
  }

  render() {
    const { name } = this.props
    const { from, to, shift } = this.state
    const url = this.generateUrl({ name, from, to, shift })

    return (
      <div className={styles.camera}>
        { url && url.indexOf('http') === 0 && <Dvr source={url} /> }
        { url && url.indexOf('ws') === 0 && <Live source={url} /> }
        <Scrobber onShift={this.handleShiftChange} onStop={this.handlePause} name={name} />
      </div>
    )
  }
}
