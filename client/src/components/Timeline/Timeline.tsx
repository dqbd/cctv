import React, { Component } from 'react'
import moment from 'moment'

export const DAY_LENGTH = 24 * 60 * 60 * 1000
export const MAX_LENGTH = 7 * DAY_LENGTH
export const SIZE_MULTIPLIER = 10

export const TIME_PER_PIXEL = 30 * 1000

export type Scene = {
  timestamp: number,
  scene: number,
}

type Props = {
  current: number,
  scenes: Scene[],
}

class Timeline extends Component<Props> {
  canvas: HTMLCanvasElement | null = null

	componentDidMount() {
		this.draw()
	}

	shouldComponentUpdate(newProps: Props) {
		return newProps.current !== this.props.current || newProps.scenes.length !== this.props.scenes.length
	}

	componentDidUpdate() {
		this.draw()
	}

	timeToPx = (time: number) => {
		return time / TIME_PER_PIXEL
	}

	timestampToPx = (timestamp: number) => {
		const { current } = this.props
		return this.timeToPx(current - timestamp)
	}

	getRef = (dom: HTMLCanvasElement) => {
		this.canvas = dom
		this.draw()
	}

	draw = () => {
		const { current, scenes } = this.props
		if (!this.canvas || !current) return
		
    const ctx = this.canvas.getContext('2d')    
    if (!ctx) return

		const width = this.timeToPx(MAX_LENGTH)
		const height = 70
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
			const y = availableHeight - availableHeight * scene
			ctx.lineTo(x, y)
		})

		ctx.stroke()

		ctx.lineWidth = 3
		ctx.strokeStyle = '#fff'
		ctx.fillStyle = '#fff'
    ctx.textBaseline = "bottom"
		ctx.font = "16px sans-serif"
		
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

export default Timeline