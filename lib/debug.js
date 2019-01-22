/**
 * Console debug info logger w/ colors
 */
const { debuglog, format } = require('util')

// Supported color codes
const colors = 'black|red|green|yellow|blue|magenta|cyan'.split('|').reduce(
  (all, name, i) => ((all[name] = 30 + i), all), // 30 is base color code
  Object.create(null)
)

const DEFAULT_COLOR_CODE = 39

/**
 * Create a logger function for specified debug section w/ additional keys for different colors
 *
 * @param {String} section? Named debug section. Defaults to '*'.
 * @param {String} defaultColor? Default color
 * @returns {Function} Logger function
 */
const createLogger = (section = '*', defaultColor) => {
  const log = section === '*' ? console.log : debuglog(section)
  const defaultColorCode = colors[defaultColor] || DEFAULT_COLOR_CODE

  // create a printing function
  const print = attrs => (...args) =>
    log(`\x1b[${attrs}m${format(...args)}\x1b[0m`)

  const logger = Object.entries(colors).reduce(
    // add logger.<color> functions
    (logger, [color, code]) => ((logger[color] = print(code)), logger),
    print(defaultColorCode)
  )

  return logger
}

// unconditional logger
createLogger.notify = createLogger()

module.exports = createLogger
