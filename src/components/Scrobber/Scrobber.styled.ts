import styled from "@emotion/styled"

export const Main = styled.div`
  user-select: none;
  transition: opacity 0.3s;

  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`

export const Top = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;

  display: flex;
  align-items: center;
  padding: 2em;
  background: linear-gradient(rgba(10, 10, 10, 1), rgba(10, 10, 10, 0));
`

export const Back = styled.a`
  color: #d8dee9;
  background: #434c5e;
  width: 4em;
  height: 4em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);

  & svg {
    width: 2em;
    height: 2em;
  }
`

export const Info = styled.div`
  display: flex;
  background: #434c5e;
  border-radius: 1em;
  padding: 0.75em;
  padding-right: 1em;
  align-items: center;

  margin-left: 1.5em;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
`

export const Name = styled.span`
  flex-grow: 1;
  display: flex;
  align-items: center;
  margin: 0;
  color: #d8dee9;
  text-decoration: none;
  font-size: 1em;
`

export const Color = styled.span`
  width: 1.5em;
  height: 1.5em;
  border-radius: 8px;
  margin-right: 0.75em;
  background: #eb5757;
`

export const TimeOffset = styled.div`
  background: #3b4252;
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

export const Live = styled.span`
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

    background: #eb5757;
    border-radius: 100%;
  }
`

export const Timeline = styled.div`
  position: absolute;
  padding-bottom: calc(5em / 2 + 5px);
  left: 0;
  right: 0;
  bottom: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(rgba(10, 10, 10, 0), rgba(10, 10, 10, 1));
`

export const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d8dee9;
  background: #434c5e;
  box-shadow: 0 3.4px 2.7px rgba(0, 0, 0, 0.019),
    0 8.7px 6.9px rgba(0, 0, 0, 0.027), 0 17.7px 14.2px rgba(0, 0, 0, 0.033),
    0 36.5px 29.2px rgba(0, 0, 0, 0.041), 0 100px 80px rgba(0, 0, 0, 0.06);

  padding: 0.8em;
  border-radius: 2.25em;
  margin-bottom: 1.25em;

  position: relative;

  &::after {
    content: "";
    border: 1.25em solid transparent;
    border-left-width: 0.8em;
    border-right-width: 0.8em;
    border-top-color: #434c5e;
    border-bottom-width: 0;
    position: absolute;
    top: 100%;
  }

  & > *:not(:last-child) {
    margin-right: 1em;
  }
`

export const Pill = styled.div`
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

  &:focus-within {
    background: #687590;
  }
`

export const PillInput = styled.input`
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
