import { useState } from "react"
import moment, { Moment } from "moment"
import { useTimer } from "./Scrobber.utils"
import { MobileDatePicker, LocalizationProvider } from "@material-ui/lab"
import AdapterMoment from "@material-ui/lab/AdapterMoment"
import { SPill, SPillInput } from "./ScrobberTimelineDatePicker.styled"

export function ScrobberTimelineDatePicker(props: {
  onChange?: (shift: number) => void
  value: number
  className?: string
}) {
  const current = useTimer()
  const [inputDate, setInputDate] = useState<Moment | null>(null)
  const activeDate = moment(new Date(current - props.value))

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} locale="cs">
      <SPill className={props.className}>
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
            <SPillInput {...inputProps} ref={inputRef} />
          )}
          cancelText="Zrušit"
          todayText="Dnes"
          toolbarTitle="Vybrat datum"
        />
        <span css={{ fontSize: "1em" }}>
          {activeDate.format("DD. MMMM YYYY")}
        </span>
      </SPill>
    </LocalizationProvider>
  )
}
