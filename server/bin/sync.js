const path = require('path')
const util = require('util')
const mkdirp = require('mkdirp')
const chokidar = require('chokidar')
const readdir = util.promisify(require('fs').readdir)

const Database = require('../lib/database')
const config = require('../config.js')

const db = new Database(path.resolve(__dirname, 'app.db'), { memory: true })

Promise.all(Object.keys(config.targets).map(async (cameraKey) => {
    const folderTarget = path.resolve(config.base, cameraKey)
    mkdirp.sync(folderTarget)

    const listed = await readdir(folderTarget).then(
        folders => Promise.all(
            folders
                .filter(folder => folder.indexOf('_') >= 0)
                .map(async target => {
                    console.log('Loading into database', cameraKey, target)
                    return [target, await readdir(path.resolve(folderTarget, target))]
                })
        )
    )
    
    listed.forEach(subfolder => db.insertFolder(cameraKey, subfolder))
}))

const parseTargetEvent = (target) => {
    const relative = path.relative(config.base, target)
    const cameraKey = relative.split(path.sep).shift()
    const finalPath = path.relative(path.resolve(config.base, cameraKey), target)
    return { cameraKey, finalPath }
}


chokidar.watch(config.base, {
    ignoreInitial: true,
})
    .on('add', target => {
        if (target.indexOf('_0.ts') >= 0) return
        
        const { cameraKey, finalPath } = parseTargetEvent(target)
        console.log(`File ${cameraKey} ${finalPath} has been added`)
        db.insert(cameraKey, finalPath)
    })
    .on('unlink', target => {
        if (target.indexOf('_0.ts') >= 0) return
        
        const { cameraKey, finalPath } = parseTargetEvent(target)
        console.log(`File ${cameraKey} ${finalPath} has been removed`)
        db.remove(cameraKey, finalPath)
    })


const cleanupInterval = setInterval(() => {
    Object.keys(config.targets).forEach(cameraKey => {
        db.removeOldScenes(cameraKey, config.maxAge)
    })
}, config.cleanupPolling * 1000)

process.on('exit', () => {
    clearInterval(cleanupInterval)
})
