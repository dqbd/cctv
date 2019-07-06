import React, { useRef, useLayoutEffect, useState, useEffect } from 'react'
import moment from 'moment'
import { useGesture, GestureHandlersPartial } from 'react-use-gesture'

import { vibrateDecorator } from '../../utils/vibrateDecorator'
import styles from './Scrobber.module.css'

const MAX_LENGTH = 7 * 24 * 60 * 60

const formatTime = (time: number) => {
  const absTime = Math.abs(time)

  const seconds = Math.floor(absTime / 1000) % 60
  const minutes = Math.floor(absTime / 1000 / 60) % 60
	const hours = Math.floor(absTime / 1000 / 60 / 60) % 24
	const days = Math.floor(absTime / 1000 / 60 / 60 / 24)
	
	let result = []
	if (seconds > 0 || minutes > 0 || hours > 0) {
		result.unshift(`${seconds.toFixed(0).padStart(2, '0')}s`)
	}

  if (minutes > 0 || hours > 0) {
    result.unshift(`${minutes.toFixed(0).padStart(2, '0')}m`)
  }
  if (hours > 0) {
    result.unshift(`${hours.toFixed(0).padStart(2, '0')}h`)
	}
	
	if (days > 0) {
		result.unshift(`${days}d`)
	}

  return `${Math.sign(time) < 0 ? '-' : ''}${result.join(' ')}`
}

export const useTimer = (callback: (now: number) => any) => {
	useLayoutEffect(() => {
		let timer: number | null = null

		const tick = () => {
			const now = Date.now()
			callback(now)
			if (timer !== null) window.clearTimeout(timer)
			timer = window.setTimeout(tick, Math.max(1000 - new Date(now).getMilliseconds(), 0))
		}
		tick()
		
		return () => {
			if (timer !== null) window.clearTimeout(timer)
		}
	}, [])
}

const Slider = ({
	value,
	onScrollEnd,
	onScroll,
}: {
	value: number,
	onScroll: (shift: number) => any,
	onScrollEnd: (shift: number) => any,
}) => {
	const callbackRef = useRef<GestureHandlersPartial>({
		onDrag: () => {},
		onDragEnd: () => {},
		onWheel: () => {},
		onWheelEnd: () => {},
	})

	const canvasRef = useRef<HTMLCanvasElement>(null)
	const bind = useGesture({
		onWheel: (event) => {
			if (callbackRef.current.onWheel) {
				callbackRef.current.onWheel(event)
			}
		},
		onWheelEnd: (event: any) => {
			if (callbackRef.current.onWheelEnd) {
				callbackRef.current.onWheelEnd(event)
			}
		},
		onDrag: (event) => {
			if (callbackRef.current.onDrag) {
				callbackRef.current.onDrag(event)
			}
		},
		onDragEnd: (event: any) => {
			if (callbackRef.current.onDragEnd) {
				callbackRef.current.onDragEnd(event)
			}
		},
	})

	useLayoutEffect(() => {
		let animationId: number | null = null
		// the idea: we don't need to specify the day, it should be resolved by itself.
		// just make sure we don't draw outside the canvas

		// offset of the slider caused by value
		const valueOffset = -Math.floor(value / 1000) 

		// offset set temporarily during scrolling
		let userOffset = 0

		const draw = (canvas: HTMLCanvasElement | null) => {
			if (!canvas) return
			const ctx = canvas.getContext('2d')
			if (!ctx) return
			
			canvas.width = window.innerWidth

			// draws the line, receving arguments as px, not relative to time
			const drawLine = (xFrom: number, xTo: number, viewOffset: number = 0) => {
				const { width, height } = canvas.getBoundingClientRect()
				
				ctx.lineWidth = 10
				ctx.strokeStyle = '#EB5757'

				ctx.beginPath()
				ctx.moveTo(Math.min(width, Math.max(0, xFrom + viewOffset)), height / 2)
				ctx.lineTo(Math.min(width, Math.max(0, xTo + viewOffset)), height / 2)
				ctx.closePath()
				ctx.stroke()
			}	
			
			// hide progress bar when necessary
			const drawDayBoundedLine = (shift: number) => {
				const { width } = canvas.getBoundingClientRect()

				const now = moment()
				const shiftedNow = now.clone().add(shift, 'seconds')
				const startDayX = Math.min(MAX_LENGTH, now.diff(shiftedNow.clone().startOf('day'), 'second'))
				const endDayX = Math.max(0, now.diff(shiftedNow.clone().endOf('day'), 'second'))

				drawLine(endDayX + shift, startDayX + shift, width / 2)
			}
		
			drawDayBoundedLine(valueOffset + userOffset)
		}


		const tick = () => {
			draw(canvasRef.current)
			animationId = window.requestAnimationFrame(tick)
		}

		const handleScroll = (delta: number) => {
			userOffset = delta

			// limit userOffset to be in range of <-MAX_LENGTH_IN_SECONDS, 0>, as userOffset is negative in nature
			// (valueOffset + userOffset) <= 0 && (valueOffset + userOffset) >= -MAX_LENGTH_IN_SECONDS
			userOffset = Math.min(-valueOffset, Math.max(-MAX_LENGTH - valueOffset, userOffset))
	
			// onScroll assumes offset in ms
			onScroll(-(valueOffset + userOffset) * 1000)
		}

		const handleScrollEnd = () => {
			onScrollEnd(-(valueOffset + userOffset) * 1000)
		}

		callbackRef.current = {
			onDrag: (event) => handleScroll(event.delta[0]),
			onWheel: (event: any) => handleScroll(-event.delta[0] || event.delta[1]),
			onDragEnd: () => handleScrollEnd(),
			onWheelEnd: () => handleScrollEnd(),
		}

		tick()

		return () => {
			if (animationId) window.cancelAnimationFrame(animationId)
		}
	}, [value])

	return (
		<div className={styles.canvas}>
			<canvas
				ref={canvasRef}
				height={100}
				{...bind()}
			/>
		</div>
	)
}

const Scrobber = ({
	onShift,
}: {
	onShift: (shift: number) => void,
}) => {

	const [current, setCurrent] = useState(Date.now())
	const [shift, setShift] = useState(0)
	const [commitedShift, setCommitedShift] = useState(0)

	const callbacks = useRef<{
		commitShift?: (newShift: number, noWait: boolean) => any,
		scrollChange?: (shift: number) => any,
		timeChange?: (value: string) => any,
		dateChange?: (value: Date | null) => any,
	}>({})

	const [visible, setVisible] = useState(true)

	useTimer((now) => setCurrent(now))

	useEffect(() => {
		let handleTimeout: number | null = null
		callbacks.current.commitShift = (newShift: number, noWait = false) => {
			const shift = Math.max(0, Math.min(MAX_LENGTH, newShift))
			setShift(shift)
	
			if (handleTimeout) window.clearTimeout(handleTimeout)
			if (!noWait) {
				handleTimeout = window.setTimeout(() => {
					setCommitedShift(shift)
					onShift(Math.ceil(shift / 1000))
				}, 100)
			} else {
				setCommitedShift(shift)
				onShift(Math.ceil(shift / 1000))
			}
		}

		callbacks.current.scrollChange = (shift: number) => {
			if (callbacks.current.commitShift) callbacks.current.commitShift(shift, true)
		}
	
		callbacks.current.timeChange = (value: string) => {
			const [hours, minutes] = value.split(':').map(item => Number.parseInt(item, 10))
			console.log(hours,minutes)
			const now = moment()
			const past = now.clone().subtract(commitedShift, 'milliseconds')
				.hours(hours)
				.minutes(minutes)
	
			if (callbacks.current.commitShift) callbacks.current.commitShift(now.diff(past), true)
		}
		
		callbacks.current.dateChange = (value: Date | null) => {
			if (!value) return
			const now = moment()
			const ref = moment().subtract(commitedShift, 'milliseconds')
			const past = moment(value)
				.hours(ref.hours())
				.minutes(ref.minutes())
				.seconds(ref.seconds())
				.milliseconds(ref.milliseconds())
	
			console.log(commitedShift, past.format('YYYY-MM-DD HH:mm:ss'))
			if (callbacks.current.commitShift) callbacks.current.commitShift(now.diff(past), true)
		}

		return () => {
			if (handleTimeout) window.clearTimeout(handleTimeout)
		}

	}, [commitedShift])

	const date = moment(new Date(current - shift))

	let minRangeRounded = current - MAX_LENGTH
	minRangeRounded -= minRangeRounded % (60 * 1000)

	let maxRangeRounded = current
	maxRangeRounded += (60 * 1000) - maxRangeRounded % (60 * 1000)

	const minDate = moment(new Date(minRangeRounded))
	const maxDate = moment(new Date(maxRangeRounded))

	return (
		<div className={styles.main}>
			<div className={styles.timeline} style={{ opacity: visible ? 1 : 1 }}>
				<div className={styles.center}>
					<div className={[styles.timewrapper].join(' ')}>
						<div className={[styles.timeoffset].join(' ')}>
							{!shift ? <span className={[styles.live].join(' ')}>Živě</span> : formatTime(-shift)}
						</div>

						<div className={[styles.pill, styles.margin].join(' ')}>
							<input
								className={styles.cover}
								onChange={(e) => callbacks.current.timeChange && callbacks.current.timeChange(e.target.value)}
								value={date.format('HH:mm')}
								min={minDate.format('HH:mm')}
								max={maxDate.format('HH:mm')}
								type="time"
							/>
							<span className={[styles.time].join(' ')}>{date.format('HH:mm:ss')}</span>
						</div>
					</div>
					<div className={[styles.pill].join(' ')}>
						<input
							className={styles.cover}
							onChange={(e) => callbacks.current.dateChange && callbacks.current.dateChange(e.target.valueAsDate)}
							value={date.format('YYYY-MM-DD')}
							min={minDate.format('YYYY-MM-DD')}
							max={maxDate.format('YYYY-MM-DD')}
							type="date"
						/>
						<span className={[styles.calendar].join(' ')}>{date.format('DD. MMMM YYYY')}</span>
					</div>
				</div>
			</div>
			<Slider
				onScroll={(shift) => setShift(shift)}
				onScrollEnd={(shift) => callbacks.current.scrollChange && callbacks.current.scrollChange(shift)}
				value={commitedShift}
			/>
		</div>
	)
}

export default Scrobber