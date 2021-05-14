import { css, Global } from "@emotion/react"
import { AppProps } from "next/app"
import Head from "next/head"

import { COLORS } from "utils/constants"
import { StreamContext } from "utils/stream"
import { config } from "shared/config"
import { SleepContext } from "utils/sleep"
import { useEffect, useState } from "react"
import NoSleep from "nosleep.js"
import { DefaultSeo } from "next-seo"

const streams = Object.entries(config.targets).map(
  ([key, { name }], index) => ({
    key,
    name,
    color: COLORS[index % COLORS.length],
  })
)

export default function App(props: AppProps) {
  const { Component, pageProps } = props

  const [sleep, setSleep] = useState<NoSleep>()

  useEffect(() => {
    setSleep(new NoSleep())
  }, [])

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1b263e" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="msapplication-TileColor" content="#1b263e" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#ffffff" />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DefaultSeo titleTemplate="%s | Kamera" defaultTitle="Kamera" />
      <Global
        styles={css`
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
              "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
              "Helvetica Neue", sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;

            overflow-x: hidden;
          }
        `}
      />
      <SleepContext.Provider value={sleep}>
        <StreamContext.Provider value={{ streams }}>
          <Component {...pageProps} />
        </StreamContext.Provider>
      </SleepContext.Provider>
    </>
  )
}
