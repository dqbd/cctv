import NextErrorComponent, { ErrorProps } from "next/error"
import { loadServerConfig } from "shared/config"

type ErrorContext = Parameters<
  (typeof NextErrorComponent)["getInitialProps"]
>[0]

function AppError({ statusCode }: ErrorProps) {
  return <NextErrorComponent statusCode={statusCode} />
}

AppError.getInitialProps = async (ctx: ErrorContext) => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(ctx)

  const { config } = await loadServerConfig()
  Object.assign(errorInitialProps, { config })

  return errorInitialProps
}
export default AppError
