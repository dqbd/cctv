import { useEffect, useState } from "react"
import { css } from "@emotion/react"
import { LocalizationProvider, MobileDateTimePicker } from "@material-ui/lab"
import AdapterMoment from "@material-ui/lab/AdapterMoment"
import moment from "moment"
import { Pill, PillInput } from "components/PillInput/PillInput"

function ScrobberRangeDateTime(props: {
  value: moment.Moment | null
  onChange: (date: moment.Moment | null) => void
  minDateTime?: moment.Moment | null
  maxDateTime?: moment.Moment | null
}) {
  const [tempValue, setTempValue] = useState<moment.Moment | null>(null)

  return (
    <Pill>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <MobileDateTimePicker
          ampm={false}
          value={tempValue}
          onChange={setTempValue}
          renderInput={({ inputProps, inputRef }) => (
            <PillInput {...inputProps} ref={inputRef} />
          )}
          onAccept={props.onChange}
          onOpen={() => setTempValue(props.value)}
          minDateTime={props.minDateTime ?? undefined}
          maxDateTime={props.maxDateTime ?? undefined}
          cancelText="Zrušit"
          todayText="Dnes"
          toolbarTitle="Vybrat čas"
        />
      </LocalizationProvider>
      <span css={{ fontSize: "1em" }}>
        {props.value?.format("DD/MM/YY HH:mm:ss") ?? "---"}
      </span>
    </Pill>
  )
}

export function ScrobberRange(props: {
  value: { from: number; to: number } | null
  onChange: (value: { from: number; to: number } | null) => void
  onModeChange: () => void
}) {
  const [from, setFrom] = useState<moment.Moment | null>(null)
  const [to, setTo] = useState<moment.Moment | null>(null)

  const handleScrobberChange = (
    from: moment.Moment | null,
    to: moment.Moment | null
  ) => {
    if (from != null && to != null) {
      props.onChange({ from: from.valueOf(), to: to.valueOf() })
    } else {
      props.onChange(null)
    }
  }

  useEffect(() => {
    if (props.value?.from != null) {
      setFrom(moment(props.value.from))
    }

    if (props.value?.to != null) {
      setTo(moment(props.value.to))
    }
  }, [props.value?.from, props.value?.to])

  return (
    <>
      <div
        css={css`
          display: flex;
          gap: 8px;
        `}
      >
        <ScrobberRangeDateTime
          value={from}
          maxDateTime={to}
          onChange={(from) => {
            setFrom(from)
            handleScrobberChange(from, to)
          }}
        />
        <ScrobberRangeDateTime
          value={to}
          minDateTime={from}
          onChange={(to) => {
            setTo(to)
            handleScrobberChange(from, to)
          }}
        />
      </div>

      <Pill onClick={props.onModeChange}>Živě</Pill>
    </>
  )
}
