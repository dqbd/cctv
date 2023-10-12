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
        <div className="flex items-center gap-[1.5em]">
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
          className="grid gap-[1.6em] grid-cols-[repeat(auto-fill,minmax(360px,1fr))]"
          css={css`
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
                  className="rounded-lg relative overflow-hidden transition-all hover:scale-[1.02] hover:z-10 active:scale-[0.98] active:z-10"
                  css={css`
                    box-shadow: ${theme.shadows.md};
                    background: hsl(219deg, 28%, 95%);

                    &:active {
                      background: hsl(219deg, 28%, 95%);
                    }
                  `}
                >
                  <section
                    className="flex items-end align-middle absolute inset-[5px] z-10 pointer-events-none rounded-md"
                    css={css`
                      background: linear-gradient(
                        to bottom,
                        hsla(219deg, 28%, 50%, 0.1) 0%,
                        hsla(219deg, 28%, 10%, 0.6)
                      );
                    `}
                  >
                    <div className="flex items-center justify-between flex-grow p-[1.2em]">
                      <h2 className="flex-grow font-medium text-base flex items-center m-0 text-white">
                        {name}
                      </h2>
                      <span
                        className="w-6 h-6 rounded-lg"
                        css={{ backgroundColor: color }}
                      />
                    </div>
                  </section>
                  <div className="w-full relative overflow-hidden pb-[56.25%]">
                    <RefreshImg
                      src={`/api/data/${key}/framestream.jpg`}
                      className="object-cover w-[calc(100%-10px)] h-[calc(100%-10px)] absolute inset-[5px] rounded-md"
                      alt={name}
                    />
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
