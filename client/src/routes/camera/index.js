import { h, Component } from 'preact';
import style from './style';
import Livestream from '../../components/Livestream';
import Dvr from '../../components/Dvr';
import Scrobber from '../../components/scrobber';

export default class Camera extends Component {
  state = {
    from: undefined,
    to: undefined,
    shift: undefined,
    showTools: false,
  }
  
  generateUrl = ({ name, from, to, shift }) => {
    if (!shift && !from && !to) return null
    
    let baseUrl = `http://192.168.1.217:8081/data/${name}/`
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

  componentWillUpdate(newProps) {
    if (this.props.name !== newProps.name) {
      this.setState({ from: undefined, to: undefined, shift: undefined })
    }
  }

  handlePause = () => {
    console.log('handling pause')
  }

  handleShiftChange = (shift) => {
    console.log(shift)
    this.setState({ shift })
  }

  render() {
    const { name, streams } = this.props
    const { from, to, shift } = this.state
    const url = this.generateUrl({ name, from, to, shift })
    const stream = streams.find(({ key }) => key === name)

    return (
      <div class={style.camera}>
        { <Dvr source={url} /> }
        {/* { url && <Dvr source={url} /> } */}
        {/* { !url && stream && <Livestream port={stream.port} /> } */}
        <Scrobber onShift={this.handleShiftChange} onStop={this.handlePause} name={name} />
      </div>
    )
  }
}
