import { h, Component } from 'preact'
import style from './style'
import { HOST } from '../../constants'

export default class Livestream extends Component {
  ms = null
  video = null
  objectUrl = null

  frameBuffer = []
  
  componentDidUpdate(oldProps) {
    if (oldProps.port !== this.props.port) {
      this.destroyDecoder()
      this.createDecoder()
    }
  }

  socketConnect = () => {
    this.socket = new WebSocket(`ws://${HOST}:${this.props.port}`)
    this.socket.binaryType = 'arraybuffer'

    this.socket.onopen = () => console.log('open connection')
    this.socket.onmessage = ({ data }) => {
      this.frameBuffer.push(new Uint8Array(data))
      this.doAppend()

      if (this.video && this.video.paused) {
        this.video.play()
      }
    }
    
    this.socket.onerror = (err) => {
      console.log('error in socket', err.message)
      this.socket.close()
    }
    this.socket.onclose = () => {
      console.log('closing socket')
      clearTimeout(this.socketTimeout)
      this.socketTimeout = setTimeout(this.socketConnect, 1000)
    }
  }
  
  onUpdateEnd = () => {
    this.doAppend()
  }

  doAppend = () => {
    if (this.frameBuffer && this.frameBuffer.length > 0) {
      const frame = this.frameBuffer.shift()
      if (this.sourceBuffer) {
        if (!this.sourceBuffer.updating) {
          this.sourceBuffer.ended = false
          this.sourceBuffer.appendBuffer(frame)
        }
      }
    }
  }



  onSourceOpen = () => {
    console.log('source open')
    this.sourceBuffer = this.ms.addSourceBuffer('video/mp4;codecs=avc1.42001f')
    this.sourceBuffer.addEventListener('updateend', this.onUpdateEnd)
    this.socketConnect()
  }

  onRef = (dom) => {
    this.video = dom
    if (!this.video) return

    if (this.objectUrl) {
      this.video.src = this.objectUrl
    } else {
      this.createDecoder()
    }
  }

  createDecoder = () => {
    if (!this.props.port) return
  
    this.ms = new MediaSource()
    this.ms.addEventListener('sourceopen', this.onSourceOpen, false)
    this.objectUrl = window.URL.createObjectURL(this.ms)

    if (this.video) {
      this.video.src = this.objectUrl
    }
  }

  destroyDecoder = () => {
    clearTimeout(this.socketTimeout)

    if (this.socket) {
      this.socket.onclose = () => console.log('closing socket without reconnect')
      this.socket.close()
    }

    if (this.video) {
      this.video.removeAttribute('src')
      this.video.load()
    }

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
    }

    if (this.ms) {
      try {
        this.ms.endOfStream();
      } catch(err) {
      }

      this.ms.removeEventListener('sourceopen', this.onSourceOpen)
    }

    this.ms = null
    this.objectUrl = null
  }

	componentWillUnmount() {
    this.destroyDecoder()
  }

	render() {
		return (
			<div className={style.live}>
        <video ref={this.onRef}></video>
      </div>
		)
	}
}
