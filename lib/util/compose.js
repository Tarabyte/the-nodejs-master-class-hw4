/**
 * Function composition
 */
module.exports = (fn, ...fns) => (...args) =>
  fns.reduce((prev, fn) => fn(prev), fn(...args))
