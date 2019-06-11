import React, { Component } from 'react'

type Props = {
  source: string,
}

export default class Livestream extends Component<Props> {
  ms: MediaSource | null = null
  video: HTMLVideoElement | null = null
  objectUrl: string | null = null
  socket: WebSocket | null = null
  socketTimeout: number | null = null

  frameBuffer: Uint8Array[] = []
  
  componentDidUpdate(oldProps: Props) {
    if (oldProps.source !== this.props.source) {
      this.destroyDecoder()
      this.createDecoder()
    }
  }

  socketConnect = () => {
    this.socket = new WebSocket(this.props.source)
    this.socket.binaryType = 'arraybuffer'

    this.socket.onopen = () => console.log('open connection')
    this.socket.onmessage = ({ data }) => {
      this.frameBuffer.push(new Uint8Array(data))
      this.doAppend()

      if (this.video && this.video.paused) {
        this.video.play()
      }
    }
    
    this.socket.onerror = () => {
      console.log('error in socket')
      if (this.socket) {
        this.socket.close()
      }
    }
    this.socket.onclose = () => {
      console.log('closing socket')
      if (this.socketTimeout !== null) {
        clearTimeout(this.socketTimeout)
      }

      const callback: TimerHandler = () => this.socketConnect()
      this.socketTimeout = setTimeout(callback, 1000)
    }
  }
  
  onUpdateEnd = () => {
    this.doAppend()
  }

  doAppend = () => {
    if (this.frameBuffer && this.frameBuffer.length > 0) {
      const frame = this.frameBuffer.shift()
      if (this.ms && frame && this.ms.sourceBuffers[0]) {
        const sourceBuffer = this.ms.sourceBuffers[0]
        if (!sourceBuffer.updating) {
          sourceBuffer.appendBuffer(frame)
        }
      }
    }
  }

  onSourceOpen = () => {
    console.log('source open')

    if (this.ms) {
      const sourceBuffer = this.ms.addSourceBuffer('video/mp4;codecs=avc1.42001f')
      sourceBuffer.addEventListener('updateend', this.onUpdateEnd)
      this.socketConnect()
    }
  }

  onRef = (dom: HTMLVideoElement) => {
    this.video = dom
    if (!this.video) return

    if (this.objectUrl) {
      this.video.src = this.objectUrl
    } else {
      this.createDecoder()
    }
  }

  createDecoder = () => {
    if (!this.props.source) return
  
    this.ms = new MediaSource()
    this.ms.addEventListener('sourceopen', this.onSourceOpen, false)
    this.objectUrl = window.URL.createObjectURL(this.ms)

    if (this.video) {
      this.video.src = this.objectUrl
    }
  }

  destroyDecoder = () => {
    if (this.socketTimeout !== null) {
      clearTimeout(this.socketTimeout)
    }

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
			<div>
        <video ref={this.onRef}></video>
      </div>
		)
	}
}
