export function vibrateDecorator<T extends Array<unknown>, U>(
  callback: ((...args: T) => U) | undefined | null
) {
  if (!callback) return undefined
  return (...args: T): U => {
    try {
      navigator.vibrate(200)
    } catch (err) {}
    return callback?.(...args)
  }
}
