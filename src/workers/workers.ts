import { wait } from "utils/wait"
import { spawn } from "child_process"
import { config } from "shared/config"
import { performance } from "perf_hooks"
import { TransformCallback, Transform } from "stream"
import path from "path"
import { logger } from "utils/logger"

const TARGET_SCRIPT = path.resolve(__dirname, "worker.js")

interface State {
  lastPrefix: string | null
  lastIsLinebreak: boolean
}


async function runWorker(cameraKey: string, attempt = 0) {
  prefixStream.write("Starting worker\n")

  logger.debug({})

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
          prefixStream.unpipe(process.stdout)
          prefixStream.destroy()

          wait(delay)
            .then(() => runWorker(cameraKey, nextAttempt))
            .then(resolve)
            .catch(reject)
        }
      )

      cameraCp.stdout.pipe(prefixStream, { end: false })
      cameraCp.stderr.pipe(prefixStream, { end: false })
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
