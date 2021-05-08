/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace NodeJS {
    interface Global {
      db: unknown
      smooth: unknown
    }
  }
}

export function registerService<T>(name: "db" | "smooth", fn: () => T) {
  if (process.env.NODE_ENV === "development") {
    if (!(name in global)) {
      global[name] = fn()
    }

    return global[name] as T
  }
  return fn()
}
