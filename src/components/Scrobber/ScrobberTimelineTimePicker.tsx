import { useEffect, useState } from "react"
import moment, { Moment } from "moment"
import { useTimer } from "./Scrobber.utils"
import { LocalizationProvider, MobileTimePicker } from "@material-ui/lab"
import AdapterMoment from "@material-ui/lab/AdapterMoment"
import { SPill, SPillInput } from "./ScrobberTimelineTimePicker.styled"

async function getServerTimeDiff() {
  const clientStart = Date.now(),
    timeBefore = performance.now()
  const serverReq = await fetch("/api/time")
  const timeAfter = performance.now()

  const roundTripTime = timeAfter - timeBefore
  const incomingTripTime = roundTripTime / 2
  const serverTime = (await serverReq.json()).time - incomingTripTime

  return serverTime - clientStart
}
function useServerTimeDiff() {
  const [serverTimeDiff, setServerTimeDiff] = useState(0)
  useEffect(() => {
    getServerTimeDiff().then((diff) => setServerTimeDiff(diff))
  }, [])

  return serverTimeDiff
}

export function ScrobberTimelineTimePicker(props: {
  onChange?: (shift: number) => void
  value: number
  className?: string
}) {
  const current = useTimer()
  const serverDiff = useServerTimeDiff()
  const [inputDate, setInputDate] = useState<Moment | null>(null)
  const activeDate = moment(new Date(current - props.value + serverDiff))

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <SPill className={props.className}>
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
            <SPillInput {...inputProps} ref={inputRef} />
          )}
          cancelText="Zrušit"
          todayText="Dnes"
          toolbarTitle="Vybrat čas"
        />

        <span css={{ fontSize: "1.25em" }}>
          {activeDate.format("HH:mm:ss")}
        </span>
      </SPill>
    </LocalizationProvider>
  )
}
