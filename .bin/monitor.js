/**
 * Simple task runner on file save
 */
const { watch } = require('fs')
const { spawn } = require('child_process')
const log = require('../lib/debug')('*', 'magenta')

// running process
let pending = null

const run = () => {
  if (pending) {
    log('Killing previous process')

    pending.on('close', e => {
      if (e) {
        console.error('Unable to kill previous process', e)
      } else {
        pending = null
      }

      // restart
      run()
    })

    pending.kill()
    return
  }

  log('Starting')
  // copy args
  const args = ['.', ...process.argv.slice(2)]
  // copy env variables
  const env = {
    ...process.env,
  }

  pending = spawn('node', args, {
    stdio: ['inherit', 'inherit', 'inherit'],
    env,
  })

  pending.on(
    'close',
    (prev => () => {
      // still same process
      if (prev === pending) {
        log('Waiting for changes\n\n')
        pending = null
      }
    })(pending)
  )
}

const debounce = (fn, delay) => {
  let timer

  const execute = (...args) => {
    timer = null
    fn(...args)
  }

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(execute, delay, ...args)
  }
}

watch('./lib', { recursive: true }, debounce(run, 100))

run()
