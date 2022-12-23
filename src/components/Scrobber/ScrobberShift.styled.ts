import styled from "@emotion/styled"
import { theme } from "utils/theme"

export const STimeOffset = styled.div`
  background: ${theme.colors.blue400};
  height: 2.5em;
  border-radius: 1.25em 0 0 1.25em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 calc(1em + 1.25em) 0 1em;
  text-align: center;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`

export const SLive = styled.span`
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;

  &:before {
    content: "";
    display: block;
    margin-right: 0.75em;
    width: 8px;
    height: 8px;
    margin-top: 1px;

    background: ${theme.colors.red500};
    border-radius: 100%;
  }
`
