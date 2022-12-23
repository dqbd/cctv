import { useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import { formatTime, useTimer } from "./ScrobberShift.utils"
import {
  MobileDatePicker,
  LocalizationProvider,
  MobileTimePicker,
} from "@material-ui/lab"
import AdapterDayjs from "@material-ui/lab/AdapterDayjs"
import { Pill, PillInput } from "components/PillInput/PillInput"
import { STimeOffset, SLive } from "./ScrobberShift.styled"
import { useServerTimeDiff } from "./ScrobberShift.utils"

function ScrobberShiftTime(props: {
  onChange?: (shift: number) => void
  value: number
  className?: string
}) {
  const current = useTimer()
  const serverDiff = useServerTimeDiff()
  const [inputDate, setInputDate] = useState<dayjs.Dayjs | null>(null)
  const activeDate = dayjs(new Date(current - props.value + serverDiff))

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Pill className={props.className}>
        <MobileTimePicker
          ampm={false}
          value={inputDate}
          onChange={setInputDate}
          onAccept={(date) => {
            if (date != null) {
              props.onChange?.(
                dayjs().diff(
                  activeDate
                    .set("hour", date.hour())
                    .set("minute", date.minute())
                )
              )
            }
          }}
          onOpen={() => setInputDate(activeDate)}
          renderInput={({ inputProps, inputRef }) => (
            <PillInput {...inputProps} ref={inputRef} />
          )}
          cancelText="Zrušit"
          todayText="Dnes"
          toolbarTitle="Vybrat čas"
        />

        <span css={{ fontSize: "1.25em" }}>
          {activeDate.format("HH:mm:ss")}
        </span>
      </Pill>
    </LocalizationProvider>
  )
}

function ScrobberShiftDate(props: {
  onChange?: (shift: number) => void
  value: number
  className?: string
}) {
  const current = useTimer()
  const [inputDate, setInputDate] = useState<Dayjs | null>(null)
  const activeDate = dayjs(new Date(current - props.value))

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} locale="cs">
      <Pill className={props.className}>
        <MobileDatePicker
          value={inputDate}
          onChange={setInputDate}
          onAccept={(date) => {
            if (date != null) {
              props.onChange?.(
                dayjs().diff(
                  activeDate
                    .set("year", date.year())
                    .set("month", date.month())
                    .set("date", date.date())
                )
              )
            }
          }}
          onOpen={() => setInputDate(activeDate)}
          renderInput={({ inputProps, inputRef }) => (
            <PillInput {...inputProps} ref={inputRef} />
          )}
          cancelText="Zrušit"
          todayText="Dnes"
          toolbarTitle="Vybrat datum"
        />
        <span css={{ fontSize: "1em" }}>
          {activeDate.format("DD. MMMM YYYY")}
        </span>
      </Pill>
    </LocalizationProvider>
  )
}

export function ScrobberShift(props: {
  value: number
  intentValue: number | null
  onChange: (value: number) => void
  onModeChange: () => void
}) {
  const contentValue =
    props.intentValue != null ? props.intentValue : props.value

  return (
    <>
      <div css={{ display: "flex" }}>
        <STimeOffset onClick={() => props.onChange(0)}>
          {!contentValue ? <SLive>Živě</SLive> : formatTime(-contentValue)}
        </STimeOffset>

        <ScrobberShiftTime
          value={contentValue}
          onChange={props.onChange}
          css={{ marginLeft: "-1.25em", padding: "0rem 3em" }}
        />
      </div>

      <ScrobberShiftDate value={contentValue} onChange={props.onChange} />

      <Pill onClick={props.onModeChange}>Rozsah</Pill>
    </>
  )
}
