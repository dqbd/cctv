import React, { Component } from 'react'
import Hls from 'hls.js'
import style from './HLSArchive.module.css'

type Props = {
  source: string,
}

export default class HLSArchive extends Component<Props> {
  hls: Hls | null = null
  timer: number | null  = null
  ref: HTMLVideoElement | null = null

  componentDidMount() {
    this.handlePlayback()
  }

  componentDidUpdate(oldProps: Props) {
    if (oldProps.source !== this.props.source) {
      this.handlePlayback()
    }
  }

  componentWillUnmount() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
    }

    if (this.ref) {
      this.ref.pause()
    }
    if (this.hls) {
      this.hls.destroy()
    }
  }

  videoRef = (ref: HTMLVideoElement) => {
    this.ref = ref
    this.handlePlayback()
  }

  autoplay: TimerHandler = () => {
    if (this.ref) this.ref.play()
  }

  handlePlayback = () => {
    const { source } = this.props

    console.log(source)

    if (source && this.ref) {
      if (this.timer !== null) {
        clearTimeout(this.timer)
      }
      
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
        this.timer = setTimeout(this.autoplay, 300)
      }
    }
  }

  render() {
    return <video className={style.video} ref={this.videoRef} autoPlay muted playsInline />
  }
}
