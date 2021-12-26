/* eslint-disable no-var */
declare global {
  var db: unknown
  var smooth: unknown
}

export function registerService<T>(name: "db" | "smooth", fn: () => T) {
  // TODO: resolve unregistering
  // if (process.env.NODE_ENV === "development") {
  //   if (!(name in global)) {
  //     global[name] = fn()
  //   }
  //   return global[name] as T
  // }
  return fn()
}
