import styled from "@emotion/styled"

export const SPill = styled.div`
  position: relative;
  background: #545f75;
  height: 2.5em;
  padding: 0rem 3em;
  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: 0 3.4px 2.7px rgba(0, 0, 0, 0.019),
    0 8.7px 6.9px rgba(0, 0, 0, 0.027), 0 17.7px 14.2px rgba(0, 0, 0, 0.033),
    0 36.5px 29.2px rgba(0, 0, 0, 0.041), 0 100px 80px rgba(0, 0, 0, 0.06);

  border-radius: 1.25em;
  text-align: center;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  transition: background 0.3s;

  @media (max-width: 768px) {
    padding: 0 1em;
  }

  &:focus-within {
    background: #687590;
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
`
