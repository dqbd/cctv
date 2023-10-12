export function vibrateDecorator<T extends Array<unknown>, U>(
  callback: (...args: T) => U,
) {
  return (...args: T): U => {
    try {
      navigator.vibrate(200)
    } catch (err) {}
    return callback?.(...args)
  }
}
