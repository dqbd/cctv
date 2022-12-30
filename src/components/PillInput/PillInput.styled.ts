import styled from "@emotion/styled"
import { theme } from "utils/theme"

export const SPill = styled.div`
  all: unset;
  cursor: pointer;

  position: relative;
  background: ${theme.colors.blue600};
  height: 2.5em;
  padding: 0rem 3em;
  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: ${theme.shadows.md};

  border-radius: 1.25em;
  text-align: center;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  transition: background 0.3s;

  @media (max-width: 864px) {
    padding: 0 1em;
  }

  div&:focus-within,
  button&:hover {
    background: ${theme.colors.blue700};
  }
`

export const SPillInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 100%;
  width: 100%;
  height: 30px;
  background: white;
  border: none;
  box-sizing: border-box;
  text-align: center;

  background: none;
  color: none;
  opacity: 0;
  margin-top: 0;
  bottom: 0;
  height: 100%;

  cursor: pointer;
  outline: none;

  font-size: 16px;
  user-select: none;
`
