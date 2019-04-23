import React, { Component } from 'react'
import styles from './Scrobber.module.css'

import Timeline, { DAY_LENGTH, TIME_PER_PIXEL, SIZE_MULTIPLIER, MAX_LENGTH, Scene } from '../Timeline/Timeline'

type Props = {
  onShift: (shift: number) => void,
  onStop: () => void,
  name: string,
}

type State = {
  shift: number,
  current: number,
  paused: boolean,
  visible: boolean,
  scenes: Scene[]
}
export default class Scrobber extends Component<Props, State> {
  debounce: number | null = null
  interval: number | null = null
  timeout: number | null = null
  sceneTimer: number | null = null
  timer: number | null = null
  ref: HTMLDivElement | null = null

	state = {
		shift: 0,
		current: Date.now(),
		paused: false,
		visible: true,
		scenes: [],
	}

	onShift = (shift: number) => {
    if (this.debounce) {
      clearTimeout(this.debounce)
    }

    const callback: TimerHandler = () => {
			this.props.onShift(Math.ceil(shift / 1000))
    }
    
		this.debounce = setTimeout(callback, 200)
	}

	performTick = () => {
		if (!this.interval) {
			this.interval = 0
		}
		
		const current = Date.now()
    this.setState({ current })
    
    if (this.timer !== null) {
      clearTimeout(this.timer)
    }

    const callback: TimerHandler = this.performTick
		this.timer = setTimeout(callback, Math.max(1000 - new Date(current).getMilliseconds(), 0))
	}

	extendOpacity = () => {
    this.setState({ visible: true })
    
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    const callback: TimerHandler = () => this.setState({ visible: false })
		this.timeout = setTimeout(callback, 8000)
	}

	componentDidMount() {
		this.extendOpacity()
		document.addEventListener('touchstart', this.extendOpacity)
		document.addEventListener('mousedown', this.extendOpacity)
		document.addEventListener('mousemove', this.extendOpacity)
		
		this.performTick()
	}

	handleScroll = () => {
		this.extendOpacity()

		if (this.ref) {
			if (!this.state.paused) {
				const shift = this.ref.scrollLeft * TIME_PER_PIXEL
				this.setState({ shift })
				this.onShift(shift)
			}
		}
	}

	componentWillUnmount() {
		if (this.ref) {
			this.ref.removeEventListener('scroll', this.handleScroll)
		}

		document.removeEventListener('mousedown', this.extendOpacity)

		if (this.timer) clearTimeout(this.timer)
		if (this.debounce) clearTimeout(this.debounce)
		if (this.timeout) clearTimeout(this.timeout)
		if (this.sceneTimer) clearTimeout(this.sceneTimer)
	}

	addRef = (ref: HTMLDivElement) => {
		this.ref = ref
		
		if (this.ref) {
			this.ref.addEventListener('scroll', this.handleScroll)
		}
	}

	handleLive = () => {
		try {
			navigator.vibrate(100)
		} catch (err) {}
		
		if (this.ref) {
			this.ref.scrollLeft = 0
			this.setState({ paused: false, shift: 0 })
			this.onShift(0)
		}
	}

	handlePlayPause = () => {
		const { paused, current, shift } = this.state
		try {
			navigator.vibrate(100)
		} catch (err) {}

		if (paused) {
			const now = Date.now()
			const newShift = shift + (now - current)

			this.setState({ paused: false, shift: newShift })
			this.performTick()
			
			if (this.ref) {
				this.ref.scrollLeft = newShift / DAY_LENGTH * this.ref.offsetWidth * SIZE_MULTIPLIER
			}
			
			this.onShift(newShift)
		} else {
			this.setState({ paused: true })
			this.props.onStop()
		}
	}

	handleShift = (seconds: number) => {
		const px = (seconds * 1000) / TIME_PER_PIXEL
		if (this.ref) {
			this.ref.scrollLeft = Math.max(0, Math.min(MAX_LENGTH / TIME_PER_PIXEL, this.ref.scrollLeft + px))
		}
  }

	handleShiftRight = () => this.handleShift(30)

	handleShiftLeft = () => this.handleShift(-30)

	render() {
		const { current, shift, paused, visible, scenes } = this.state

		return (
			<div className={styles.timeline} style={{ opacity: visible ? 1 : 0 }}>
				<div className={styles.position}>
					<div className={styles.button} onClick={this.handleShiftLeft}>⏪</div>
					<div className={styles.bubble}>
						{new Date(current - shift).toLocaleString()}
					</div>
					<div className={styles.button} onClick={this.handleShiftRight}>⏩</div>
				</div>
				<div className={styles.scrobber} ref={this.addRef}>
					<Timeline current={current} scenes={scenes} />
				</div>
			</div>
		)
	}
}