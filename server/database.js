const fs = require('fs')
const chokidar = require('chokidar')

const { createSegment } = require('./segment')

class Database {
    constructor(config) {
        this.config = config
        this.database = new Map()
    }

    clearAll() {
        this.database.clear()
    }

    
    set(folder, list) {
        this.database.set(folder, list)
    }

    clear(folder) {
        this.set(folder, [])
    }


    insert(folder, item) {
        
    }

    build(folder) {
        this.clear()

        fs.readdir(path.join(this.config.base(), folder), (err, files) => {
            if (!err && files && files.length > 0) {

                this.set(
                    files.reduce((memo, file) => {
                        const segment = createSegment(file)
                        if (!segment) return memo

                        if (segment.timestamp * 1000 <= ???) {
                            fs.unlink(path.join(this.config.base(), folder, file), (err) => console.error)
                        } else {
                            memo.push(segment)
                        }
                        return memo
                    }, [])
                    .sort((a, b) => a.timestamp - b.timestamp)
                )
            }
          })
    }

    startListening() {
        
    }
}

class Selector extends Database {
    slice() {

    }

    shift() {

    }
}

module.exports = Selector