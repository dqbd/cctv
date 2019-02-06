const path = require('path')
const util = require('util')

const readdir = util.promisify(require('fs').readdir)
const rimraf = util.promisify(require('rimraf'))

const Config = require('./server/config')
const config = new Config(require('./config.js'))

const now = new Date()
const nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0).valueOf()


const wait = (delay) => new Promise(resolve => setTimeout(resolve, delay))

const cleanup = () => Promise.all(Object.keys(config.targets()).map(async (cameraKey) => {
  const baseFolder = path.resolve(config.base(), cameraKey)

  try {
    const folders = (await readdir(baseFolder))
      .filter((folderName) => {
        const [year, month, day, hour] = folderName.split('_').map(num => Number.parseInt(num, 10))
        const folderTime = new Date(year, month - 1, day, hour, 0, 0, 0).valueOf()
        const cleanupTime = folderTime + config.maxAge() * 1000
        return cleanupTime <= nowTime
      })

    await Promise.all(folders.map(folder => {
      const target = path.resolve(baseFolder, folder)
      console.log('Deleting folder', target)
      return rimraf(target)
    }))

  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}))

const loop = async () => {
  console.log('Polling cleanup')
  await cleanup()
  await wait(config.cleanupPolling() * 1000)
  loop()
}

loop()