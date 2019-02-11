/**
 * Effect interpretor
 * Converts effect -> Promise algebra to a runner
 * All the mumba-yumba with promises comes from the fact we are on node 8 so no async generators
 */
module.exports = algebra => {
  const promisify = value => {
    // null or undefined
    if (value == null) return Promise.resolve(value)
    // is thenable
    if (typeof value.then === 'function') return Promise.resolve(value)
    // is generator (recurrsion)
    if (
      typeof value === 'function' &&
      value.prototype &&
      typeof value.prototype.next === 'function' &&
      typeof value.prototype.throw === 'function'
    ) {
      return run(value)
    }

    // custom effect
    return promisify(algebra(value))
  }

  // actual runner
  const run = (gen, ...args) =>
    new Promise((resolve, reject) => {
      // start the iteration process
      const iterator = typeof gen === 'function' ? gen(...args) : gen

      // call next step
      const _next = result => {
        try {
          handle(iterator.next(result))
        } catch (e) {
          reject(e)
        }
      }

      // pass error to generator
      const _throw = e => {
        try {
          handle(iterator.throw(e))
        } catch (e) {
          reject(e)
        }
      }

      const handle = ({ done, value }) =>
        done ? resolve(value) : promisify(value).then(_next, _throw)

      // start processing
      _next()
    })

  return run
}
