import { useEffect, useState } from "react"
import { css } from "@emotion/react"
import { LocalizationProvider, MobileDateTimePicker } from "@material-ui/lab"
import AdapterDayjs from "@material-ui/lab/AdapterDayjs"
import dayjs from "dayjs"
import { Pill, PillInput } from "components/PillInput/PillInput"

function ScrobberRangeDateTime(props: {
  value: dayjs.Dayjs | null
  onChange: (date: dayjs.Dayjs | null) => void
  minDateTime?: dayjs.Dayjs | null
  maxDateTime?: dayjs.Dayjs | null
}) {
  const [tempValue, setTempValue] = useState<dayjs.Dayjs | null>(null)

  return (
    <Pill>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
  className?: string
}) {
  const [from, setFrom] = useState<dayjs.Dayjs | null>(null)
  const [to, setTo] = useState<dayjs.Dayjs | null>(null)

  const handleScrobberChange = (
    from: dayjs.Dayjs | null,
    to: dayjs.Dayjs | null
  ) => {
    if (from != null && to != null) {
      props.onChange({ from: from.valueOf(), to: to.valueOf() })
    } else {
      props.onChange(null)
    }
  }

  useEffect(() => {
    if (props.value?.from != null) {
      setFrom(dayjs(props.value.from))
    }

    if (props.value?.to != null) {
      setTo(dayjs(props.value.to))
    }
  }, [props.value?.from, props.value?.to])

  return (
    <div
      className={props.className}
      css={css`
        display: flex;
        gap: 8px;

        @media (max-width: 864px) {
          flex-direction: column;
        }
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
  )
}
