/**
 * Simple task runner on file save
 */
const { watch } = require('fs')
const { spawn } = require('child_process')
const { sep, extname } = require('path')
const log = require('../lib/debug')('*', 'magenta')

// running process
let pending = null

const run = file => {
  if (file) {
    log.yellow(`Reloading because file ${file} changed`)
  }
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

const isSrcFile = file => {
  // all root files cause reloading
  if (!file.includes(sep) && extname(file)) {
    return true
  }

  // lib or public folder
  if (file.startsWith(`lib${sep}`) || file.startsWith(`public${sep}`)) {
    return true
  }

  // templates
  if (file.startsWith(`templates${sep}`)) {
    // only reload if uncompiled template was changed
    return extname(file) === '.html'
  }

  return false
}

const filterSrcFiles = fn => (_, file) => {
  if (isSrcFile(file)) {
    fn(file)
  }
}

watch('./', { recursive: true }, filterSrcFiles(debounce(run, 100)))

run()
