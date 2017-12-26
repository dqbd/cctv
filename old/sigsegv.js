const { spawn } = require('child_process')
const process = require('process')
const unquote = require('unquote')
const [execPath, js, command] = process.argv

if (!command) throw new Error('No command specified')
const [name, ...args] = unquote(command).split(' ')
const child = spawn(name, args)

console.log('running', name, args)
const handleOutput = (data) => {
    console.log(data && data.toString && data.toString())
    if (data.toString().indexOf('SIGSEGV') > 0) {
        child.stdin.pause()
        child.kill('SIGINT')
        throw new Error('SIGSEGV detected')
    }
}

child.stdout.on('data', handleOutput)
child.stderr.on('data', handleOutput)
child.on('close', (code) => console.log(`process has closed ${code}`))
