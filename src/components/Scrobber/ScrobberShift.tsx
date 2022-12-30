import { useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import { formatTime } from "./ScrobberShift.utils"
import {
  MobileDatePicker,
  LocalizationProvider,
  MobileTimePicker,
} from "@material-ui/lab"
import AdapterDayjs from "@material-ui/lab/AdapterDayjs"
import { Pill, PillInput } from "components/PillInput/PillInput"
import { STimeOffset, SLive } from "./ScrobberShift.styled"
import { useServerTimeDiff } from "./ScrobberShift.utils"
import {
  fitDateInBounds,
  getDateBounds,
  PlaybackType,
  useStreamStore,
} from "utils/stream"

function ScrobberShiftTime(props: {
  onShiftSet?: (shift: number) => void
  value: PlaybackType
  displayDate: Dayjs
  className?: string
}) {
  const [inputDate, setInputDate] = useState<dayjs.Dayjs | null>(null)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Pill className={props.className}>
        <MobileTimePicker
          ampm={false}
          value={inputDate}
          onChange={setInputDate}
          onAccept={(date) => {
            if (date != null) {
              props.onShiftSet?.(
                dayjs().diff(
                  props.displayDate
                    .set("hour", date.hour())
                    .set("minute", date.minute())
                )
              )
            }
          }}
          onOpen={() => setInputDate(props.displayDate)}
          renderInput={({ inputProps, inputRef }) => (
            <PillInput {...inputProps} ref={inputRef} />
          )}
          cancelText="Zrušit"
          todayText="Dnes"
          toolbarTitle="Vybrat čas"
        />

        <span css={{ fontSize: "1.25em" }}>
          {props.displayDate.format("HH:mm:ss")}
        </span>
      </Pill>
    </LocalizationProvider>
  )
}

function ScrobberShiftDate(props: {
  onShiftSet?: (shift: number) => void
  value: PlaybackType
  displayDate: Dayjs
  className?: string
}) {
  const [inputDate, setInputDate] = useState<Dayjs | null>(null)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} locale="cs">
      <Pill className={props.className}>
        <MobileDatePicker
          value={inputDate}
          onChange={setInputDate}
          onAccept={(date) => {
            if (date != null) {
              props.onShiftSet?.(
                dayjs().diff(
                  props.displayDate
                    .set("year", date.year())
                    .set("month", date.month())
                    .set("date", date.date())
                )
              )
            }
          }}
          onOpen={() => setInputDate(props.displayDate)}
          renderInput={({ inputProps, inputRef }) => (
            <PillInput {...inputProps} ref={inputRef} />
          )}
          cancelText="Zrušit"
          todayText="Dnes"
          toolbarTitle="Vybrat datum"
        />
        <span css={{ fontSize: "1em" }}>
          {props.displayDate.format("DD. MMMM YYYY")}
        </span>
      </Pill>
    </LocalizationProvider>
  )
}

export function ScrobberShift(props: {
  intentShift: number | null
  bounds: { shift: [number, number] } | { pov: [dayjs.Dayjs, dayjs.Dayjs] }
  onShiftSet: (value: number) => void
  onModeChange: () => void
}) {
  const serverDiff = useServerTimeDiff()
  const now = useStreamStore((state) => state.now)
  const playback = useStreamStore((state) => state.playback)

  const displayDate = fitDateInBounds(
    ("playing" in playback
      ? now.add(playback.playing, "millisecond")
      : playback.paused
    )
      .add(serverDiff, "millisecond")
      .add(props.intentShift ?? 0, "millisecond"),
    getDateBounds(now, props.bounds)
  )

  const displayShift = displayDate.diff(now, "millisecond")
  const isLive = Math.floor(Math.abs(displayShift) / 1000) === 0

  return (
    <>
      <div css={{ display: "flex" }}>
        <STimeOffset onClick={() => props.onShiftSet(0)}>
          {isLive ? <SLive>Živě</SLive> : formatTime(-displayShift)}
        </STimeOffset>

        <ScrobberShiftTime
          value={playback}
          displayDate={displayDate}
          onShiftSet={props.onShiftSet}
          css={{ marginLeft: "-1.25em", padding: "0rem 3em" }}
        />
      </div>

      <ScrobberShiftDate
        value={playback}
        displayDate={displayDate}
        onShiftSet={props.onShiftSet}
      />

      <Pill onClick={props.onModeChange}>Rozsah</Pill>
    </>
  )
}
