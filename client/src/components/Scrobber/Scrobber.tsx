import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import moment from 'moment'

import { vibrateDecorator } from '../../utils/vibrateDecorator'
import styles from './Scrobber.module.css'

type Scene = {
  timestamp: number,
  scene: number,
}

type Props = {
	onShift: (shift: number) => void,
  onStop: () => void,
  name: string,
}

type State = {
	shift: number,
  current: number,
  visible: boolean,
  scenes: Scene[]
}

const DAY_LENGTH = 24 * 60 * 60 * 1000
const MAX_LENGTH = 7 * DAY_LENGTH

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
		visible: true,
		scenes: [],
	}

	onShift = (newShift: number) => {
		const shift = Math.max(0, Math.min(MAX_LENGTH, newShift))
		this.setState({ shift })
    this.props.onShift(Math.ceil(shift / 1000))
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

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.extendOpacity)

		if (this.timer) clearTimeout(this.timer)
		if (this.debounce) clearTimeout(this.debounce)
		if (this.timeout) clearTimeout(this.timeout)
		if (this.sceneTimer) clearTimeout(this.sceneTimer)
	}

	handleLive = vibrateDecorator(() => this.onShift(0))
	handleShiftRight = vibrateDecorator(() => this.onShift(this.state.shift + 30000))
	handleShiftLeft = vibrateDecorator(() => this.onShift(this.state.shift - 30000))

	handleTimeChange = (value: string) => {
		const [hours, minutes] = value.split(':').map(item => Number.parseInt(item, 10))
		
		const now = moment()
		const past = now.clone().subtract(this.state.shift, 'milliseconds')
			.hours(hours)
			.minutes(minutes)

		this.onShift(now.diff(past))
	}
	
	handleDateChange = (value: Date | null) => {
		if (!value) return
		const now = moment()
		const ref = moment().subtract(this.state.shift, 'milliseconds')
		const past = moment(value)
			.hours(ref.hours())
			.minutes(ref.minutes())
			.seconds(ref.seconds())
			.milliseconds(ref.milliseconds())

		this.onShift(now.diff(past))
	}

	render() {
		const { current, shift, visible } = this.state
		const date = moment(new Date(current - shift))

		let minRangeRounded = current - MAX_LENGTH
		minRangeRounded -= minRangeRounded % (60 * 1000)

		let maxRangeRounded = current
		maxRangeRounded += (60 * 1000) - maxRangeRounded % (60 * 1000)

		const minDate = moment(new Date(minRangeRounded))
		const maxDate = moment(new Date(maxRangeRounded))

		return (
			<div className={styles.timeline} style={{ opacity: visible ? 1 : 0 }}>
				<NavLink to="/">
					<a className={[styles.btn, styles.circle, styles.back].join(' ')}>
						<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M21 9.17424V11.8258H5.09091L12.3826 19.1174L10.5 21L0 10.5L10.5 0L12.3826 1.88258L5.09091 9.17424H21Z" fill="currentColor"/>
						</svg>
					</a>
				</NavLink>

				<div className={styles.center}>
					<button className={[styles.btn, styles.circle, styles.shift].join(' ')} onClick={this.handleShiftLeft}>
						<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M16 0H13V14H16V0ZM11 0L0 7L11 14V0ZM21 0H18V14H21V0Z" fill="currentColor"/>
						</svg>
					</button>

					<div className={[styles.time, styles.btn, styles.pill].join(' ')}>
						<input
							className={styles.cover}
							onChange={(e) => this.handleTimeChange(e.target.value)}
							value={date.format('HH:mm')}
							min={minDate.format('HH:mm')}
							max={maxDate.format('HH:mm')}
							type="time"
						/>
						{date.format('HH:mm:ss')}
					</div>

					<div className={[styles.calendar, styles.btn, styles.pill].join(' ')}>
						<input
							className={styles.cover}
							onChange={(e) => this.handleDateChange(e.target.valueAsDate)}
							value={date.format('YYYY-MM-DD')}
							min={minDate.format('YYYY-MM-DD')}
							max={maxDate.format('YYYY-MM-DD')}
							type="date"
						/>
						{date.format('DD. MMMM YYYY')}
					</div>

					<button className={[styles.btn, styles.circle, styles.shift].join(' ')} onClick={this.handleShiftRight}>
						<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M5 0H8V14H5V0ZM10 0L21 7L10 14V0ZM0 0H3V14H0V0Z" fill="currentColor"/>
						</svg>
					</button>
				</div>

				<button className={[styles.btn, styles.pill, styles.live].join(' ')} onClick={this.handleLive}>
					<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M25.4983 10.3367H15.8933L19.7749 6.34167C15.9074 2.51667 9.64578 2.375 5.77828 6.2C1.91078 10.0392 1.91078 16.23 5.77828 20.0833C9.64578 23.9083 15.9074 23.9083 19.7749 20.0833C21.7016 18.1708 22.6649 15.9467 22.6649 13.1417H25.4983C25.4983 15.9467 24.2516 19.5875 21.7583 22.0525C16.7858 26.9825 8.71078 26.9825 3.73828 22.0525C-1.22006 17.1367 -1.26256 9.14667 3.70994 4.23083C8.68244 -0.685 16.6583 -0.685 21.6308 4.23083L25.4983 0.25V10.3367ZM13.4566 7.33333V13.3542L18.4149 16.3008L17.3949 18.015L11.3316 14.4167V7.33333H13.4566Z" fill="currentColor"/>
					</svg>
					<span>Živý přenos</span>
				</button>
			</div>
		)
	}
}