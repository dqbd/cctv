import React, { useRef, useLayoutEffect, useState, useEffect } from 'react'
import moment from 'moment'

import { vibrateDecorator } from '../../utils/vibrateDecorator'
import styles from './Scrobber.module.css'
import { NavLink } from 'react-router-dom'
import { Slider } from '../Slider/Slider'

import { MAX_LENGTH } from '../../utils/constants'

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
	}, [callback])
}

const useVisibleTimer = (delay = 1000) => {
	const [visible, setVisible] = useState(true)
	const show = useRef<() => any>(() => setVisible(true))
	const hide = useRef<() => any>(() => setVisible(false))

	useEffect(() => {
		let timer: number | null = null

		hide.current = () => {
			if (timer !== null) window.clearTimeout(timer)
			setVisible(false)
		}

		show.current = () => {
			if (timer !== null) window.clearTimeout(timer)
			setVisible(true)
			timer = window.setTimeout(hide.current, delay)
		}

		show.current()

		return () => {
			if (timer !== null) window.clearTimeout(timer)
		}
	}, [delay])

	return { visible, show, hide }
}

const Scrobber = ({
	onShift,
	stream,
}: {
	onShift: (shift: number) => void,
	stream: {
		key: string,
		name: string,
		color: string,
	}
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

	const { visible, show } = useVisibleTimer(10 * 1000)

	useTimer((now) => setCurrent(now))

	useEffect(() => {
		let handleTimeout: number | null = null
		callbacks.current.commitShift = (newShift: number, noWait = false) => {
			const shift = Math.max(0, Math.min(MAX_LENGTH * 1000, newShift))
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

	}, [commitedShift, onShift])

	const date = moment(new Date(current - shift))

	let minRangeRounded = current - MAX_LENGTH * 1000
	minRangeRounded -= minRangeRounded % (60 * 1000)

	let maxRangeRounded = current
	maxRangeRounded += (60 * 1000) - maxRangeRounded % (60 * 1000)

	const minDate = moment(new Date(minRangeRounded))
	const maxDate = moment(new Date(maxRangeRounded))

	return (
		<div
			className={styles.main}
			style={{ opacity: visible ? 1 : 0 }}
			onTouchStart={show.current}
			onMouseMove={show.current}
		>
			<div className={styles.top}>
				<NavLink to="/" className={styles.back}>
					<svg viewBox="0 0 29 21" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M25 9.17424V11.8258H9.09091L16.3826 19.1174L14.5 21L4 10.5L14.5 0L16.3826 1.88258L9.09091 9.17424H25Z" fill="currentColor" />
					</svg>
				</NavLink>
				<div className={styles.info}>
					<span className={styles.color} style={{ backgroundColor: stream && stream.color }}></span>
					<span className={styles.name}>{stream && stream.name}</span>
				</div>
			</div>
			<div className={styles.timeline}>
				<div className={styles.center}>
					<div className={[styles.timewrapper].join(' ')}>
						<div
							onClick={() => callbacks.current.scrollChange && vibrateDecorator(callbacks.current.scrollChange)(0)}
							className={[styles.timeoffset].join(' ')}
						>
							{!shift ? <span className={[styles.live].join(' ')}>Živě</span> : formatTime(-shift)}
						</div>

						<div className={[styles.pill, styles.margin].join(' ')}>
							<input
								className={styles.cover}
								onChange={(e) => callbacks.current.timeChange && vibrateDecorator(callbacks.current.timeChange)(e.target.value)}
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
							onChange={(e) => callbacks.current.dateChange && vibrateDecorator(callbacks.current.dateChange)(e.target.valueAsDate)}
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
				onScrollEnd={(shift) => callbacks.current.scrollChange && vibrateDecorator(callbacks.current.scrollChange)(shift)}
				value={commitedShift}
				color={stream.color}
			/>
		</div>
	)
}

export default Scrobber