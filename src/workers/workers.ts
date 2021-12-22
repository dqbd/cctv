import { wait } from "utils/wait"
import { spawn } from "child_process"
import { config } from "shared/config"
import { performance } from "perf_hooks"
import { TransformCallback, Transform } from "stream"
import path from "path"

const TARGET_SCRIPT = path.resolve(__dirname, "perform.js")
const ALL_BR = /\n/g

interface State {
  lastPrefix: string | null
  lastIsLinebreak: boolean
}

class PrefixTransform extends Transform {
  prefix: string
  state: State = {
    lastPrefix: null,
    lastIsLinebreak: true,
  }

  constructor(prefix: string) {
    super()
    this.prefix = `[${prefix}] `
  }

  _transform(
    chunk: string | Buffer,
    _: BufferEncoding,
    callback: TransformCallback
  ) {
    const prefix = this.prefix
    const nPrefix = `\n${prefix}`
    const state = this.state
    const firstPrefix = state.lastIsLinebreak
      ? prefix
      : state.lastPrefix !== prefix
      ? "\n"
      : ""

    const prefixed = `${firstPrefix}${chunk}`.replace(ALL_BR, nPrefix)
    const index = prefixed.indexOf(
      prefix,
      Math.max(0, prefixed.length - prefix.length)
    )

    state.lastPrefix = prefix
    state.lastIsLinebreak = index !== -1

    callback(null, index !== -1 ? prefixed.slice(0, index) : prefixed)
  }
}

async function runWorker(cameraKey: string, attempt = 0) {
  const prefixStream = new PrefixTransform(cameraKey)
  prefixStream.pipe(process.stdout)
  prefixStream.write("Starting worker\n")

  return new Promise((resolve, reject) => {
    try {
      const startProcess = performance.now()
      const cameraCp = spawn("node", [TARGET_SCRIPT, cameraKey]).on(
        "exit",
        () => {
          const execTime = performance.now() - startProcess
          const nextAttempt = execTime < 2 * 1000 ? 0 : attempt + 1
          const delay = Math.min(nextAttempt * 1000, 5 * 60 * 1000)

          prefixStream.write(`Worker has exit (${execTime}ms)\n`)
          if (delay > 0) prefixStream.write(`Waiting ${delay}ms\n`)
          prefixStream.destroy()

          wait(delay)
            .then(() => runWorker(cameraKey, nextAttempt))
            .then(resolve)
            .catch(reject)
        }
      )

      cameraCp.stdout.pipe(prefixStream, { end: false })
    } catch (err) {
      reject(err)
    }
  })
}

async function main() {
  return Promise.all(
    Object.keys(config.targets).map((cameraKey) =>
      runWorker(cameraKey).catch((err) => {
        console.error(err)
        process.exit(1)
      })
    )
  )
}

main()
