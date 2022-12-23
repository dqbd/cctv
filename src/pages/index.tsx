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
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          grid-gap: 1em;
          margin: 1em;

          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-top);

          @media (max-width: 768px) {
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

                  @media (hover: hover) {
                    &:hover {
                      transform: scale(1.02);
                      z-index: 2;

                      background: hsl(219deg, 28%, 95%);
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
