/**
 * Simple templating
 */
const { dirname, join } = require('path')

const { readFile, writeFile } = require('./fs')

const isProd = process.env.NODE_ENV === 'production'

// template helpers
const helpers = {}

// global data
const globals = {}

// include helper factory
const includeFactory = templatePath => {
  const dir = dirname(templatePath)

  return (path, ...rest) => template(join(dir, path), ...rest)
}

// coroutine to resolve promises
const co = async (strings, ...values) => {
  values = await Promise.all(values)

  return Array.from(
    { length: strings.length + values.length },
    // intermix entries from strings and values
    (_, i) => (i % 2 ? values : strings)[(i / 2) | 0]
  ).join('')
}

// compiled templates cache
const cache = isProd
  ? new Map()
  : {
      // null cache strategy
      has() {
        return false
      },
      get() {
        return undefined
      },
      set() {
        return this
      },
    }

// load and compile template
const compile = async path => {
  // check if compiled
  if (cache.has(path)) {
    return cache.get(path)
  }

  // read template string
  const body = (await readFile(path, 'utf-8')).trim()

  if (!body) {
    throw new Error(`Empty template ${path}`)
  }

  // compile the function
  const compiledPath = join(process.cwd(), `${path}.compiled.js`)

  // write generated file to disk to simplify debugging and such
  await writeFile(
    compiledPath,
    `/**
* Compiled template ${path}
* Do not modify
*/
module.exports = (data, helpers, co) => co\`${body}\`
`
  )

  // use require to load generated content
  const fn = require(compiledPath)

  // make include relative to current template
  const include = includeFactory(path)

  // enhance data and helpers w/ globals
  const tmpl = (localData, localHelpers) =>
    fn(
      { ...globals, ...localData },
      { ...helpers, ...localHelpers, include },
      co
    )

  // save to avoid compilation step in future
  cache.set(path, tmpl)

  return tmpl
}

// compile and run template if data is passed
const template = async function(path, data, helpers) {
  const tmpl = await compile(path)

  // no data specified, only load template
  if (arguments.length === 1) {
    return tmpl
  }

  // data was specified, run the template
  return await tmpl(data, helpers)
}

template.compile = compile
template.globals = globals
template.helpers = helpers

module.exports = template