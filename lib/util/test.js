/**
 * Simple async test runner that catches errors
 * @param {String} name
 * @param {Function} fn
 * @param {Object} [options] Additional test options
 */
async function test(name, fn, options = {}) {
  let timer = null
  try {
    const { timeout = 1000 } = options
    // race w/ timeout
    await Promise.race([
      fn(),
      new Promise(
        (_, reject) =>
          (timer = setTimeout(
            reject,
            timeout,
            new Error(`Test ${name} took too long.`)
          ))
      ),
    ])

    console.log(`\x1b[32m✔ ${name}\x1b[0m`)
  } catch (e) {
    console.error(`\x1b[31m✖ ${name}\x1b[0m\n`, e)
  } finally {
    // unref timer to avoid hanging process for {timeout} ms more
    timer && timer.unref()
  }
}

// skipping the test
test.skip = name => {
  console.log(`\x1b[33m⋯ Skipping: ${name}\x1b[0m`)
}

// module
test.module = async (name, fn) => {
  console.group(name)

  try {
    await fn()
  } finally {
    console.groupEnd(name)
  }
}

module.exports = test
