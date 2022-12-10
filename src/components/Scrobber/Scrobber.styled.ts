import styled from "@emotion/styled"

export const SMain = styled.div`
  user-select: none;
  transition: opacity 0.3s;

  position: absolute;
  top: 0;
  top: env(safe-area-inset-top);
  bottom: 0;
  left: 0;
  right: 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`

export const STop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;

  display: flex;
  align-items: center;
  padding: 2em;
  background: linear-gradient(rgba(10, 10, 10, 1), rgba(10, 10, 10, 0));
`

export const SBack = styled.a`
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

export const SInfo = styled.div`
  display: flex;
  background: #434c5e;
  border-radius: 1em;
  padding: 0.75em;
  padding-right: 1em;
  align-items: center;

  margin-left: 1.5em;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
`

export const SName = styled.span`
  flex-grow: 1;
  display: flex;
  align-items: center;
  margin: 0;
  color: #d8dee9;
  text-decoration: none;
  font-size: 1em;
`

export const SColor = styled.span`
  width: 1.5em;
  height: 1.5em;
  border-radius: 8px;
  margin-right: 0.75em;
  background: #eb5757;
`

export const STimeOffset = styled.div`
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

    background: #eb5757;
    border-radius: 100%;
  }
`

export const STimeline = styled.div`
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

export const SCenter = styled.div`
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
