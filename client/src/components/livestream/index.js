import { h, Component } from 'preact'
import Worker from 'worker-loader!../../broadway/Decoder'
import YUVCanvas from '../../broadway/YUVCanvas'
import style from './style'

export default class Livestream extends Component {

  canvas = {
    dom: null,
    webGLCanvas: null,
    width: 0,
    height: 0,
    port: 0,
  }

	componentDidMount() {
    if (this.props.port) {
      this.createDecoder()
    }
  }
  
  componentDidUpdate(oldProps) {
    if (oldProps.port !== this.props.port) {
      this.destroyDecoder()
      this.createDecoder()
    }
  }

  createDecoder = () => {
    console.log('creating decoder')
    this.worker = new Worker()
    this.worker.addEventListener('message', ({ data }) => {
      if (data.consoleLog) return console.log(data.consoleLog)
      if (data.buf) this.onDecoded(new Uint8Array(data.buf, 0, data.length), data.width, data.height, data.infos)
    })

    this.worker.postMessage({
      type: "Broadway.js - Worker init",
      options: {
        filter: 'original',
        filterHorLuma: 'optimized',
        filterVerLumaEdge: 'optimized',
        getBoundaryStrengthsA: 'optimized'
      }
    })


    const socketConnect = () => {
      this.socket = new WebSocket(`ws://192.168.1.217:${this.props.port}`)
      this.socket.binaryType = 'arraybuffer'
  
      this.socket.onopen = () => console.log('open connection')
      this.socket.onmessage = ({ data }) => {

        if (typeof data !== 'string') {
          const copy = new Uint8Array(data)
          this.worker.postMessage({ buf: copy.buffer, offset: 0, length: copy.length }, [copy.buffer])
        } else {
          if (this.statusRef) {
            this.statusRef.innerHTML = data
          }
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
  }

  destroyDecoder = () => {
    clearTimeout(this.socketTimeout)

    if (this.canvas.dom) {
      this.canvas.dom.height = 0
    }

    if (this.socket) {
      this.socket.onclose = () => console.log('closing socket without reconnect')
      this.socket.close()
    }

    if (this.worker) {
      this.worker.terminate()
    }
  }


	componentWillUnmount() {
    this.destroyDecoder()
  }

  onDecoded = (buffer, bufWidth, bufHeight) => {
    if (!this.canvas.dom) return
    console.log('decoding frame')
    
    if (this.canvas.width !== bufWidth || this.canvas.height !== bufHeight || this.canvas.port !== this.props.port || !this.canvas.webGLCanvas) {
      console.log('recreating canvas')
      this.canvas.width = bufWidth
      this.canvas.height = bufHeight
      this.canvas.port = this.props.port

      this.canvas.dom.width = bufWidth
      this.canvas.dom.height = bufHeight
      this.canvas.webGLCanvas = new YUVCanvas({
        canvas: this.canvas.dom,
        contextOptions: {},
        width: bufWidth,
        height: bufHeight,
      })
    }

    var ylen = bufWidth * bufHeight
    var uvlen = (bufWidth / 2) * (bufHeight / 2)
    
    this.canvas.webGLCanvas.drawNextOutputPicture({
      yData: buffer.subarray(0, ylen),
      uData: buffer.subarray(ylen, ylen + uvlen),
      vData: buffer.subarray(ylen + uvlen, ylen + uvlen + uvlen)
    })
  }
  
  onRef(dom) {
    this.canvas.dom = dom
  }

  onStatusRef(dom) {
    this.statusRef = dom
  }

	render() {
		return (
			<div className={style.live}>
        <canvas ref={this.onRef.bind(this)}></canvas>
        <pre className={style.status} ref={this.onStatusRef.bind(this)} />
      </div>
		)
	}
}
