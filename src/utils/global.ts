export class GlobalRef<T> {
  private readonly sym: symbol

  constructor(uniqueName: string) {
    this.sym = Symbol.for(uniqueName)
  }

  get value() {
    // @ts-expect-error Obtaining value
    return global[this.sym] as T | undefined
  }

  set value(value: T) {
    // @ts-expect-error Setting value
    global[this.sym] = value
  }
}
