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
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const interval = window.setInterval(
      () => void setSession(Date.now()),
      15 * 1000
    )
    return () => void window.clearInterval(interval)
  }, [])

  return (
    <img
      src={`${src}?q=${session}`}
      alt={alt}
      onLoad={() => setVisible(true)}
      onError={() => setVisible(false)}
      style={{ opacity: visible ? 1 : 0, transition: "all 0.3s" }}
      {...props}
    />
  )
}
