import styled from "@emotion/styled"

export const SContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  cursor: all-scroll;
  height: 5em;
  overscroll-behavior: contain;
`

export const SCanvas = styled.canvas`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  touch-action: none;
`
