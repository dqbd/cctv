import { h, Component } from 'preact';
import style from './style';
import moment from 'moment'

const DAY_LENGTH = 24 * 60 * 60 * 1000
const MAX_LENGTH = 7 * DAY_LENGTH
const SIZE_MULTIPLIER = 10

const TIME_PER_PIXEL = 30 * 1000

class Timeline extends Component {

	componentDidMount() {
		this.draw()
	}

	shouldComponentUpdate(newProps) {
		return newProps.current !== this.props.current || newProps.scenes.length !== this.props.scenes.length
	}

	componentDidUpdate() {
		this.draw()
	}

	timeToPx = (time) => {
		return time / TIME_PER_PIXEL
	}

	timestampToPx = (timestamp) => {
		const { current } = this.props
		return this.timeToPx(current - timestamp)
	}

	getRef = (dom) => {
		this.canvas = dom
		this.draw()
	}

	draw = () => {
		const { current, scenes } = this.props
		if (!this.canvas || !current) return
		
		const ctx = this.canvas.getContext('2d')

		const width = this.timeToPx(MAX_LENGTH)
		const height = 300
		const circleRadius = 10

		this.canvas.width = width
		this.canvas.height = height

		ctx.lineWidth = 1
		ctx.strokeStyle = '#ff00ff'

		ctx.beginPath()
		ctx.moveTo(0, height / 2)
		scenes.forEach(({ timestamp, scene }) => {
			const availableHeight = (height - 3) / 2
			const x = this.timestampToPx(timestamp * 1000)
			const y = availableHeight - availableHeight * Math.pow(scene, 2)
			ctx.lineTo(x, y)
		})

		ctx.stroke()

		ctx.lineWidth = 3
		ctx.strokeStyle = '#fff'
		ctx.fillStyle = '#fff'
		ctx.textBaseline = "bottom"
		ctx.textSize = "16px"
		
		let now = current
		const minDay = current - MAX_LENGTH
		let shift = 0
		

		while (now - shift >= minDay) {
			const ofDay = now - moment(now).startOf('day').valueOf()

			const startX = this.timeToPx(shift)
			const endX = this.timeToPx(shift + ofDay)

			ctx.beginPath()
			ctx.arc(endX, height / 2, circleRadius, 0, 2 * Math.PI)
			ctx.closePath()
			ctx.stroke()

			ctx.font = '1em sans-serif'
			ctx.fillText(moment(now).format('YYYY-MM-DD'), startX + (shift && circleRadius) + 5, height / 2 - 6.5)

			ctx.beginPath()
			ctx.moveTo(startX + (shift && circleRadius), height / 2)
			ctx.lineTo(endX - circleRadius, height / 2)
			ctx.closePath()
			ctx.stroke()

			shift += ofDay
		}

	}

	

	render() {
		return <canvas ref={this.getRef} />
	}
}

export default class Scrobber extends Component {

	state = {
		shift: 0,
		current: Date.now(),
		paused: false,
		visible: true,
		scenes: [],
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
		// const current = (this.state.current) ? (this.state.current + 60 * 1000) : Date.now()
		this.setState({ current })

		clearTimeout(this.timer)
		this.timer = setTimeout(this.performTick, Math.max(1000 - new Date(current).getMilliseconds(), 0))
	}

	extendOpacity = () => {
		this.setState({ visible: true })
		clearTimeout(this.timeout)
		// this.timeout = setTimeout(() => this.setState({ visible: false }), 8000)
	}

	fetchScenes = async () => {
		const { name } = this.props
		const { data } = await fetch(`http://192.168.1.217:8081/scene/${name}`).then(a => a.json())

		this.setState({ scenes: data })

		clearTimeout(this.sceneTimer)
		this.sceneTimer = setTimeout(this.fetchScenes, 10 * 1000)
	}

	componentDidMount() {
		this.extendOpacity()
		document.addEventListener('touchstart', this.extendOpacity)
		document.addEventListener('mousedown', this.extendOpacity)
		document.addEventListener('mousemove', this.extendOpacity)
		
		this.performTick()
		this.fetchScenes()
	}

	handleScroll = () => {
		this.extendOpacity()

		if (this.ref) {
			if (!this.state.paused) {
				const shift = this.ref.scrollLeft * TIME_PER_PIXEL
				
				this.setState({ shift })
				this.onShift(shift)
			} else {
				// this.ref.scrollLeft = this.state.shift / DAY_LENGTH * this.ref.offsetWidth * SIZE_MULTIPLIER
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
		clearTimeout(this.sceneTimer)
	}

	addRef = (ref) => {
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

	getSegments = () => {
		const { current, scenes } = this.state
		const lastPossible = current - MAX_LENGTH
		let segments = []
		let pos = current

		let iteration = 0

		
		while (pos > lastPossible) {
			let date = new Date(pos)
			const key = [date.getFullYear(), date.getMonth(), date.getDate()].join('_')

			let previousDay = new Date(pos)
			previousDay.setMilliseconds(999)
			previousDay.setSeconds(59)
			previousDay.setMinutes(59)
			previousDay.setHours(23)
			previousDay.setDate(date.getDate() - 1)

			let prev = Math.max(lastPossible, previousDay.getTime())
			let diff = pos - prev

			const width = diff * SIZE_MULTIPLIER / DAY_LENGTH
			const realWidth = width * window.innerWidth


			// draw stuff for me
			const sceneMap = scenes[key]
			let canvas = null

			// if (sceneMap) {
			// 	canvas = <Canvas width={width} height={300} onDraw={(ctx, width, height) => {

			// 		ctx.strokeStyle = '#aaa'
			// 		ctx.strokeWidth = 10

					// for (let i = 0; i <= diff; i += 1000) {
					// 	ctx.beginPath()
					// 	const x = (i * 9 / DAY_LENGTH) * realWidth
					// 	ctx.moveTo(x, height)
					// 	ctx.lineTo(x, 0)
						
					// 	ctx.stroke()
					// }

					// console.log(ctx)
					// ctx.beginPath()
					// ctx.strokeStyle = '#ff00FF'
					// ctx.strokeWidth = 10
					// ctx.moveTo(0, height)
					// sceneMap.forEach(({ timestamp, scene }) => {
					// 	const diff = current - (timestamp * 1000)
					// 	const x = (diff * SIZE_MULTIPLIER / DAY_LENGTH) * width
					// 	const y = height - height * scene

					// 	ctx.lineTo(x, y)
					// })

					// ctx.stroke()
			// 	}} />
			// }


			segments.push({ name: date.toLocaleDateString(), minWidth: `${width * 100}vw`, canvas })
			pos -= diff
		}	

		return segments
	}

	render() {
		const { current, shift, paused, visible, scenes } = this.state
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
					<Timeline current={current} scenes={scenes} />
					{/* <div class={style.slider}>
						{segments.map(({ minWidth, name, canvas }) => (
							<div class={style.day} style={{ minWidth }}>
								{canvas}
								<span>{name}</span>
							</div>
						))}
					</div> */}
				</div>
			</div>
		)
	}
}