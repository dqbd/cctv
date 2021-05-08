import { forwardRef, ImgHTMLAttributes, useEffect, useState } from "react"

export const RefreshImg = forwardRef<
  HTMLImageElement,
  ImgHTMLAttributes<HTMLImageElement>
>(({ src, alt, ...props }, ref) => {
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
      {...props}
      src={`${src}?q=${session}`}
      alt={alt}
      ref={ref}
      onLoad={() => setVisible(true)}
      onError={() => setVisible(false)}
      css={{ opacity: visible ? 1 : 0, transition: "all 0.3s" }}
    />
  )
})
