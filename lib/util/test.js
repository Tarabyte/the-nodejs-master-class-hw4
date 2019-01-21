/**
 * Simple async test runner that catches errors
 * @param {String} name
 * @param {Function} fn
 */
async function test(name, fn) {
  let timer = null
  try {
    // race w/ 2 seconds timeout
    await Promise.race([
      fn(),
      new Promise(
        (_, reject) =>
          (timer = setTimeout(
            reject,
            2000,
            new Error(`Test ${name} took too long.`)
          ))
      ),
    ])

    console.log(`\x1b[32m✔ ${name}\x1b[0m`)
  } catch (e) {
    console.error(`\x1b[31m✖ ${name}\x1b[0m\n`, e)
  } finally {
    // unref timer to avoid hanging process for 2 seconds more
    timer && timer.unref()
  }
}

module.exports = test
