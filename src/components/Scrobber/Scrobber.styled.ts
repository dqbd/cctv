import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { theme } from "utils/theme"

export const SWrapper = styled.div`
  position: absolute;
  padding-bottom: calc(5em / 2 + 5px);
  left: 0;
  right: 0;
  bottom: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  background: ${theme.gradients.bottom};
`

export const SContainer = styled.div<{ mode: "shift" | "range" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.lightBlue900};
  background: ${theme.colors.blue500};
  box-shadow: ${theme.shadows.md};

  padding: 0.8em;
  border-radius: 2.25em;
  margin-bottom: 1.25em;

  position: relative;

  &::after {
    content: "";
    border: 1.25em solid transparent;
    border-left-width: 0.8em;
    border-right-width: 0.8em;
    border-top-color: ${theme.colors.blue500};
    border-bottom-width: 0;
    position: absolute;
    top: 100%;
  }

  & > *:not(:last-child) {
    margin-right: 1em;
  }

  ${({ mode }) => {
    if (mode === "range") {
      return css`
        &::after {
          display: none;
        }
      `
    }

    return null
  }}
`
