import "../global.css"
import { AppProps } from "next/app"
import Head from "next/head"

import { COLORS } from "utils/constants"
import { StreamContext } from "utils/stream"
import { ConfigContext, ConfigDto } from "shared/config"
import { SleepContext } from "utils/sleep"
import { useEffect, useState } from "react"
import { DefaultSeo } from "next-seo"
import NoSleep from "nosleep.js"

import dayjs from "dayjs"
import minMax from "dayjs/plugin/minMax"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

dayjs.extend(minMax)

const queryClient = new QueryClient()

export default function App(props: AppProps) {
  const { Component, pageProps } = props

  const [sleep, setSleep] = useState<NoSleep>()

  useEffect(() => {
    setSleep(new NoSleep())
  }, [])

  const config = ConfigDto.parse(pageProps.config)

  const streams = Object.entries(config.targets).map(
    ([key, { name }], index) => ({
      key,
      name,
      color: COLORS[index % COLORS.length],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigContext.Provider value={config}>
        <SleepContext.Provider value={sleep}>
          <StreamContext.Provider value={{ streams }}>
            <Head>
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
              <link
                rel="mask-icon"
                href="/safari-pinned-tab.svg"
                color="#1b263e"
              />
              <link rel="shortcut icon" href="/favicon.ico" />
              <meta name="msapplication-TileColor" content="#1b263e" />
              <meta name="msapplication-config" content="/browserconfig.xml" />
              <meta name="theme-color" content="#ffffff" />

              <meta
                name="apple-mobile-web-app-status-bar-style"
                content="black-translucent"
              />

              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=5.0, viewport-fit=cover"
              />
            </Head>
            <DefaultSeo titleTemplate="%s | Kamera" defaultTitle="Kamera" />

            <Component {...pageProps} />
          </StreamContext.Provider>
        </SleepContext.Provider>
      </ConfigContext.Provider>
    </QueryClientProvider>
  )
}
