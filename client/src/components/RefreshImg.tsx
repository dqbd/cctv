import { useEffect, useState } from "react"

export function RefreshImg({
  src,
  alt,
  ...props
}: {
  src: string | null
  [rest: string]: any
}) {
  const [session, setSession] = useState(Date.now())
  useEffect(() => {
    const interval = window.setInterval(
      () => void setSession(Date.now()),
      15 * 1000
    )
    return () => void window.clearInterval(interval)
  }, [])

  return <img src={`${src}?q=${session}`} alt={alt} {...props} />
}
