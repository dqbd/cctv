import { h, Component } from 'preact'
import style from './style'

export default class Livestream extends Component {

  canvas = {
    dom: null,
    width: 0,
    height: 0,
    port: 0,
  }

  ms = null
  video = null
  packetBuffer = []
  firstFrame = false
  
  componentDidUpdate(oldProps) {
    if (oldProps.port !== this.props.port) {
      // this.destroyDecoder()
      // this.createDecoder()
      
    }
  }

  onRef(dom) {
    this.video = dom

    if (this.props.port) {
      this.ms = new MediaSource()
      this.video.src = window.URL.createObjectURL(this.ms)
      this.ms.addEventListener('sourceopen', () => {
        this.sourceBuffer = this.ms.addSourceBuffer('video/mp4;codecs=avc1.42001f')
        
        const socketConnect = () => {
          this.socket = new WebSocket(`ws://localhost:${this.props.port}`)
          this.socket.binaryType = 'arraybuffer'
    
          this.socket.onopen = () => console.log('open connection')
          this.socket.onmessage = ({ data }) => {
            this.sourceBuffer.appendBuffer(new Uint8Array(data))
            console.log(new Uint8Array(data))

            if (this.video.paused) {
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
            this.socketTimeout = setTimeout(this.onSocketConnect, 1000)
          }
        }
        socketConnect()
      }, false)
    }
  }

  destroyDecoder = () => {
    clearTimeout(this.socketTimeout)

    if (this.socket) {
      this.socket.onclose = () => console.log('closing socket without reconnect')
      this.socket.close()
    }

    
  }

	componentWillUnmount() {
    this.destroyDecoder()
  }

  onStatusRef(dom) {
    this.statusRef = dom
  }

	render() {
		return (
			<div className={style.live}>
        <video ref={this.onRef.bind(this)}></video>
        <pre className={style.status} ref={this.onStatusRef.bind(this)} />
      </div>
		)
	}
}
