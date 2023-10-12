import { Readable, Writable } from "stream"

declare module "npm-run-all" {
  namespace RunAll {
    interface RunnerResult {
      name?: string
      code?: number | undefined
    }

    interface Runner {
      (
        patterns: string[] | string,
        options?: {
          aggregateOutput?: boolean
          arguments?: string[]
          continueOnError?: boolean
          parallel?: boolean
          maxParallel?: number
          npmPath?: string
          packageConfig?: Record<string, unknown>
          printLabel?: boolean
          printName?: boolean
          race?: boolean
          silent?: boolean
          stdin?: Readable | null
          stdout?: Writable | null
          stderr?: Writable | null
          taskList?: string[] | null
        },
      ): Promise<RunnerResult[]>
    }
  }

  const runAll: RunAll.Runner
  export = runAll
}
