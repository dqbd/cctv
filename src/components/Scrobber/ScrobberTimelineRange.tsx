import { useState } from "react"
import { css } from "@emotion/react"
import { LocalizationProvider, MobileDateTimePicker } from "@material-ui/lab"
import AdapterMoment from "@material-ui/lab/AdapterMoment"
import moment from "moment"
import { Pill, PillInput } from "components/PillInput/PillInput"

function ScrobberTimelineRangeDateTime(props: {
  value: moment.Moment | null
  minDateTime?: moment.Moment | null
  maxDateTime?: moment.Moment | null
  onChange: (date: moment.Moment | null) => void
}) {
  return (
    <Pill>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <MobileDateTimePicker
          ampm={false}
          value={props.value}
          onChange={props.onChange}
          renderInput={({ inputProps, inputRef }) => (
            <PillInput {...inputProps} ref={inputRef} />
          )}
          minDateTime={props.minDateTime ?? undefined}
          maxDateTime={props.maxDateTime ?? undefined}
          cancelText="Zrušit"
          todayText="Dnes"
          toolbarTitle="Vybrat čas"
        />
      </LocalizationProvider>
      <span css={{ fontSize: "1em" }}>
        {props.value?.format("DD. MMMM YYYY HH:mm:ss") ?? "---"}
      </span>
    </Pill>
  )
}

export function ScrobberTimelineRange() {
  const [from, setFrom] = useState<moment.Moment | null>(null)
  const [to, setTo] = useState<moment.Moment | null>(null)
  return (
    <div
      css={css`
        display: flex;
        gap: 8px;
      `}
    >
      <ScrobberTimelineRangeDateTime
        value={from}
        onChange={setFrom}
        maxDateTime={to}
      />
      <ScrobberTimelineRangeDateTime
        value={to}
        onChange={setTo}
        minDateTime={from}
      />
    </div>
  )
}
