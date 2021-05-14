import { useState } from "react"
import moment, { Moment } from "moment"
import { vibrateDecorator } from "utils/vibrateDecorator"
import { Slider } from "components/Slider/Slider"
import Link from "next/link"
import * as S from "./Scrobber.styled"
import { config } from "shared/config"
import { useTimer, useVisibleTimer, formatTime } from "./Scrobber.utils"

import {
  MobileDatePicker,
  LocalizationProvider,
  MobileTimePicker,
} from "@material-ui/lab"
import AdapterMoment from "@material-ui/lab/AdapterMoment"

function TimePicker(props: {
  onChange?: (shift: number) => void
  value: number
  className?: string
}) {
  const current = useTimer()
  const [inputDate, setInputDate] = useState<Moment | null>(null)
  const activeDate = moment(new Date(current - props.value))

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <S.Pill className={props.className}>
        <MobileTimePicker
          ampm={false}
          value={inputDate}
          onChange={setInputDate}
          onAccept={(date) => {
            props.onChange?.(
              moment().diff(
                activeDate.clone().set({
                  hour: date?.hour(),
                  minute: date?.minute(),
                })
              )
            )
          }}
          onOpen={() => setInputDate(activeDate.clone())}
          renderInput={({ inputProps, inputRef }) => (
            <S.PillInput {...inputProps} ref={inputRef} />
          )}
        />

        <span css={{ fontSize: "1.25em" }}>
          {activeDate.format("HH:mm:ss")}
        </span>
      </S.Pill>
    </LocalizationProvider>
  )
}

function DatePicker(props: {
  onChange?: (shift: number) => void
  value: number
  className?: string
}) {
  const current = useTimer()
  const [inputDate, setInputDate] = useState<Moment | null>(null)
  const activeDate = moment(new Date(current - props.value))

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <S.Pill className={props.className}>
        <MobileDatePicker
          value={inputDate}
          onChange={setInputDate}
          onAccept={(date) => {
            props.onChange?.(
              moment().diff(
                activeDate.clone().set({
                  year: date?.year(),
                  month: date?.month(),
                  date: date?.date(),
                })
              )
            )
          }}
          onOpen={() => setInputDate(activeDate.clone())}
          renderInput={({ inputProps, inputRef }) => (
            <S.PillInput {...inputProps} ref={inputRef} />
          )}
        />
        <span css={{ fontSize: "1em" }}>
          {activeDate.format("DD. MMMM YYYY")}
        </span>
      </S.Pill>
    </LocalizationProvider>
  )
}

function Timeline(props: {
  color: string
  value: number
  onChange: (shift: number) => void
}) {
  const [scrollShift, setScrollShift] = useState<number | null>(null)
  const onShiftCommit = vibrateDecorator((shift: number) => {
    setScrollShift(null)
    props.onChange(Math.max(0, Math.min(config.maxAge * 1000, shift)))
  })

  const contentShift = scrollShift != null ? scrollShift : props.value

  return (
    <>
      <S.Timeline>
        <S.Center>
          <div css={{ display: "flex" }}>
            <S.TimeOffset onClick={() => onShiftCommit(0)}>
              {!contentShift ? (
                <S.Live>Živě</S.Live>
              ) : (
                formatTime(-contentShift)
              )}
            </S.TimeOffset>

            <TimePicker
              value={contentShift}
              onChange={onShiftCommit}
              css={{ marginLeft: "-1.25em", padding: "0rem 3em" }}
            />
          </div>
          <DatePicker value={contentShift} onChange={onShiftCommit} />
        </S.Center>
      </S.Timeline>
      <Slider
        onScroll={setScrollShift}
        onScrollEnd={onShiftCommit}
        value={props.value}
        color={props.color}
      />
    </>
  )
}

export function Scrobber(props: {
  onChange: (shift: number) => void
  value: number
  stream: {
    key: string
    name: string
    color: string
  }
}) {
  const { visible, show } = useVisibleTimer(10 * 1000)

  return (
    <S.Main
      css={{ opacity: visible ? 1 : 1 }}
      onTouchStart={show.current}
      onMouseMove={show.current}
    >
      <S.Top>
        <Link href="/">
          <S.Back>
            <svg
              viewBox="0 0 29 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25 9.17424V11.8258H9.09091L16.3826 19.1174L14.5 21L4 10.5L14.5 0L16.3826 1.88258L9.09091 9.17424H25Z"
                fill="currentColor"
              />
            </svg>
          </S.Back>
        </Link>
        <S.Info>
          <S.Color css={{ backgroundColor: props.stream?.color }} />
          <S.Name>{props.stream?.name}</S.Name>
        </S.Info>
      </S.Top>
      <Timeline
        value={props.value}
        onChange={props.onChange}
        color={props.stream.color}
      />
    </S.Main>
  )
}
