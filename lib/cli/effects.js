/**
 * IO effects
 */
const IO = Symbol('io command')
const effect = fn =>
  function io(...args) {
    return {
      ...fn(...args),
      [IO]: io,
    }
  }

const tell = effect(message => ({ message }))
const ask = effect(question => ({ question }))
const header = effect(message => ({ message }))
const dir = effect((obj, options) => ({ obj, options }))
const table = effect((headers, values) => ({ headers, values }))

module.exports = {
  IO,
  tell,
  ask,
  header,
  dir,
  table,
}
