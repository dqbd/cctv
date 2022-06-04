declare namespace NodeJS {
  type CustomEnv = import("./shared/config").EnvTypes

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ProcessEnv extends CustomEnv {}
}
