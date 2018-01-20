import { h, Component } from 'preact';
import style from './style';

const DAY_LENGTH = 24 * 60 * 60 * 1000
const MAX_LENGTH = 7 * DAY_LENGTH
const SIZE_MULTIPLIER = 2

export default class Scrobber extends Component {

	state = {
		shift: 0,
		current: undefined,
		paused: false,
		visible: true,
	}

	onShift = (shift) => {
		clearTimeout(this.debounce)
		this.debounce = setTimeout(() => {
			this.props.onShift(Math.ceil(shift / 1000))
		}, 200)
	}

	performTick = () => {
		if (!this.interval) {
			this.interval = 0
		}
		
		const current = Date.now()
		const date = new Date(current)

		if (!this.state.paused) {
			this.setState({ current })
		}

		clearTimeout(this.timer)
		this.timer = setTimeout(this.performTick, Math.max(1000 - date.getMilliseconds(), 0))
	}

	extendOpacity = () => {
		this.setState({ visible: true })
		clearTimeout(this.timeout)
		this.timeout = setTimeout(() => this.setState({ visible: false }), 8000)
	}

	componentDidMount() {
		this.extendOpacity()
		document.addEventListener('mousedown', this.extendOpacity)
		document.addEventListener('mousemove', this.extendOpacity)
		this.performTick()
	}

	handleScroll = () => {
		this.extendOpacity()

		if (this.ref) {
			if (!this.state.paused) {
				const shift = this.ref.scrollLeft * DAY_LENGTH / this.ref.offsetWidth / SIZE_MULTIPLIER
				this.setState({ shift })
				this.onShift(shift)
			} else {
				this.ref.scrollLeft = this.state.shift / DAY_LENGTH * this.ref.offsetWidth * SIZE_MULTIPLIER
			}
		}
	}

	componentWillUnmount() {
		if (this.ref) {
			this.ref.removeEventListener('scroll', this.handleScroll)
		}

		document.removeEventListener('mousedown', this.extendOpacity)

		clearTimeout(this.timer)
		clearTimeout(this.debounce)
		clearTimeout(this.timeout)
	}

	addRef = (ref) => {
		this.ref = ref
		
		if (this.ref) {
			this.ref.addEventListener('scroll', this.handleScroll)
		}
	}

	handleLive = () => {
		navigator.vibrate(100)
		
		if (this.ref) {
			this.ref.scrollLeft = 0
			this.setState({ paused: false, shift: 0 })
			this.onShift(0)
		}
	}

	handlePlayPause = () => {
		const { paused, current, shift } = this.state
		navigator.vibrate(100)

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

	getSegments = () => {
		const { current } = this.state
		const lastPossible = current - MAX_LENGTH
		let segments = []
		let pos = current

		let iteration = 0

		while (pos > lastPossible) {
			let date = new Date(pos)

			let previousDay = new Date(pos)
			previousDay.setMilliseconds(999)
			previousDay.setSeconds(59)
			previousDay.setMinutes(59)
			previousDay.setHours(23)
			previousDay.setDate(date.getDate() - 1)

			let prev = Math.max(lastPossible, previousDay.getTime())
			let diff = pos - prev

			segments.push({ name: date.toLocaleDateString(), minWidth: `${(diff * SIZE_MULTIPLIER * 100 / DAY_LENGTH)}vw` })
			pos -= diff
		}

		return segments
	}

	render() {
		const { current, shift, paused, visible } = this.state
		const segments = this.getSegments()

		return (
			<div class={style.timeline} style={{ opacity: visible ? 1 : 0 }}>
				<div class={style.position}>
					<div class={style.button} onClick={this.handleLive}>🔴</div>
					<div class={style.bubble}>
						{new Date(current - shift).toLocaleString()}
					</div>
					<div class={style.button} onClick={this.handlePlayPause}>{paused ? `🔥` : `❄️`}</div>
				</div>
				<div class={style.scrobber} ref={this.addRef}>
					<div class={style.slider}>
						{segments.map(({ minWidth, name }) => (
							<div class={style.day} style={{ minWidth }}><span>{name}</span></div>
						))}
					</div>
				</div>
			</div>
		)
	}
}