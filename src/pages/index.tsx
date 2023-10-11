import { css, Global } from "@emotion/react"
import { StreamContext } from "utils/stream"
import { RefreshImg } from "components/RefreshImg"
import { Fragment, useContext, useEffect } from "react"
import { SleepContext } from "utils/sleep"
import { useRouter } from "next/router"
import Head from "next/head"
import { GetServerSideProps } from "next"
import { loadServerConfig } from "shared/config"
import { theme } from "utils/theme"

export default function Page() {
  const router = useRouter()
  const sleep = useContext(SleepContext)

  useEffect(() => {
    sleep?.disable()
  }, [sleep])

  return (
    <Fragment>
      <Head>
        <meta name="theme-color" content="#434c5e" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=5.0, viewport-fit=cover"
        />
      </Head>
      <Global
        styles={css`
          html {
            background-color: ${theme.colors.blue500};
          }
        `}
      />

      <div
        css={css`
          margin: 2em;
          margin-top: max(env(safe-area-inset-top), 2em);
          margin-bottom: max(env(safe-area-inset-bottom), 2em);
          margin-left: max(env(safe-area-inset-left), 2em);
          margin-right: max(env(safe-area-inset-right), 2em);

          display: flex;
          flex-direction: column;
          gap: 2em;

          @media (max-width: 864px) {
            margin: 1em;
            margin-top: max(env(safe-area-inset-top), 1em);
            margin-bottom: max(env(safe-area-inset-bottom), 1em);
            margin-left: max(env(safe-area-inset-left), 1em);
            margin-right: max(env(safe-area-inset-right), 1em);

            gap: 1em;
          }
        `}
      >
        <div
          css={css`
            display: flex;
            gap: 1.5em;
            align-items: center;
          `}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M41.832 19.128C41.9377 18.8878 41.9949 18.6292 42.0005 18.3669C42.0061 18.1046 41.96 17.8437 41.8647 17.5993C41.7694 17.3548 41.6268 17.1315 41.4452 16.9422C41.2635 16.7529 41.0463 16.6013 40.806 16.496L14.656 4.98397C12.666 4.10797 10.216 5.08597 9.366 7.06797L4.946 17.376C4.53018 18.351 4.51818 19.4512 4.91263 20.4351C5.30709 21.419 6.07578 22.2062 7.05 22.624L19.126 27.8L16.646 34H8V28H4V44H8V38H16.646C18.292 38 19.75 37.012 20.358 35.484L22.802 29.376L33.212 33.836C33.6968 34.044 34.2442 34.0521 34.7349 33.8584C35.2256 33.6647 35.6199 33.285 35.832 32.802L36.456 31.382L39.858 32.742L43.858 22.742L40.786 21.516L41.832 19.128ZM32.964 29.38L8.626 18.95L13.042 8.64597L37.366 19.354L32.964 29.38Z"
              fill="white"
            />
          </svg>

          <span
            css={css`
              font-size: 16px;
              color: ${theme.colors.white};
              font-weight: 600;
            `}
          >
            Kamery
          </span>
        </div>

        <div
          css={css`
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
            gap: 1.6em;

            @media (max-width: 720px) {
              font-size: 10px;
              grid-template-columns: 1fr;
            }
          `}
        >
          <StreamContext.Consumer>
            {({ streams }) =>
              streams.map(({ key, name, color }) => (
                <div
                  key={key}
                  onClick={() => {
                    sleep?.enable()
                    router.push(`/camera/${key}`)
                  }}
                  css={css`
                    border-radius: 8px;
                    text-decoration: none;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.2s;

                    box-shadow: ${theme.shadows.md};
                    background: hsl(219deg, 28%, 95%);

                    @media (hover: hover) {
                      &:hover {
                        transform: scale(1.02);
                        z-index: 2;
                      }
                    }

                    &:active {
                      transform: scale(0.98);
                      z-index: 2;

                      background: hsl(219deg, 28%, 95%);
                    }
                  `}
                >
                  <section
                    css={css`
                      display: flex;
                      align-items: flex-end;
                      vertical-align: middle;

                      position: absolute;
                      bottom: 5px;
                      left: 5px;
                      right: 5px;
                      top: 5px;
                      z-index: 3;

                      pointer-events: none;
                      border-radius: 6px;

                      background: linear-gradient(
                        to bottom,
                        hsla(219deg, 28%, 50%, 0.1) 0%,
                        hsla(219deg, 28%, 10%, 0.6)
                      );
                    `}
                  >
                    <div
                      css={css`
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-grow: 1;
                        padding: 1.2em;
                      `}
                    >
                      <h2
                        css={css`
                          flex-grow: 1;
                          font-style: normal;
                          font-weight: 500;
                          font-size: 16px;
                          display: flex;
                          align-items: center;
                          margin: 0;
                          color: ${theme.colors.white};
                          text-decoration: none;
                        `}
                      >
                        {name}
                      </h2>
                      <span
                        css={css`
                          width: 24px;
                          height: 24px;
                          border-radius: 8px;
                          background-color: ${color};
                        `}
                      />
                    </div>
                  </section>
                  <div
                    css={css`
                      width: 100%;
                      padding-bottom: 56.25%;
                      position: relative;
                      overflow: hidden;

                      & video,
                      & img {
                        object-fit: contain;
                        width: calc(100% - 10px);
                        height: calc(100% - 10px);

                        position: absolute;
                        top: 5px;
                        bottom: 5px;
                        left: 5px;
                        right: 5px;

                        border-radius: 6px;
                      }

                      & img {
                        object-fit: cover;
                      }
                    `}
                  >
                    <RefreshImg src={`/api/data/${key}/frame.jpg`} alt={name} />
                  </div>
                </div>
              ))
            }
          </StreamContext.Consumer>
        </div>
      </div>
    </Fragment>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { config } = await loadServerConfig()

  return {
    props: {
      config,
    },
  }
}
