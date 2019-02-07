import { h, Component } from 'preact'
import Hls from 'hls.js'
import style from './style'

export default class DVR extends Component {
  hls = undefined
  timer = undefined
  ref = undefined

  componentDidMount() {
    console.log(this)
    this.handlePlayback()
  }

  componentDidUpdate(oldProps) {
    if (oldProps.source !== this.props.source) {
      this.handlePlayback()
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer)
    if (this.ref) {
      this.ref.pause()
    }
    if (this.hls) {
      this.hls.destroy()
    }
  }

  videoRef = (ref) => {
    console.log(this)
    this.ref = ref
    this.handlePlayback()
  }

  autoplay = () => {
    if (this.ref) this.ref.play()
  }

  handlePlayback = () => {
    const { source } = this.props
    console.log('dvr', source)

    if (source && this.ref) {
      clearTimeout(this.timer)
      
      if (Hls.isSupported()) {
        if (this.hls) {
          this.ref.pause()
          this.hls.destroy()
        }

        this.hls = new Hls()
        this.hls.loadSource(source)
        this.hls.attachMedia(this.ref)
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this.timer = setTimeout(this.autoplay, 300)
        })
      } else {
        this.ref.src = source
        setTimeout(this.autoplay, 300)
      }
    }
  }

  render() {
    return <video class={style.video} autoplay muted playsinline ref={this.videoRef} />
  }
}