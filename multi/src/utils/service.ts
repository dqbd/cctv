declare global {
  namespace NodeJS {
    interface Global {
      db: any
      smooth: any
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
