import React, { useRef, useLayoutEffect } from 'react'
import moment from 'moment'
import { useGesture, GestureHandlersPartial } from 'react-use-gesture'
import styles from './Slider.module.css'

import { MAX_LENGTH } from '../../utils/constants'

export const Slider = ({
	value,
	color,
	onScrollEnd,
	onScroll,
}: {
	value: number,
	color: string,
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
			if (!canvas || !canvas.parentElement) return
			const ctx = canvas.getContext('2d')
			if (!ctx) return
			
			const parentRect = canvas.parentElement.getBoundingClientRect()
			canvas.width = parentRect.width
			canvas.height = parentRect.height

			// draws the line, receving arguments as px, not relative to time
			const drawLine = (xFrom: number, xTo: number, viewOffset: number = 0) => {
				const { width, height } = canvas.getBoundingClientRect()
				
				ctx.lineWidth = 10
				ctx.strokeStyle = color

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

				// invert direction, as we want to line to act as a timeline
				drawLine(-(endDayX + shift), -(startDayX + shift), width / 2)
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
			onDrag: (event) => handleScroll(-event.delta[0]),
			onWheel: (event: any) => handleScroll(event.delta[0] || -event.delta[1]),
			onDragEnd: () => handleScrollEnd(),
			onWheelEnd: () => handleScrollEnd(),
		}

		tick()

		return () => {
			if (animationId) window.cancelAnimationFrame(animationId)
		}
	}, [value, color, onScroll, onScrollEnd])

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

export default Slider
