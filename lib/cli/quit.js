const { ask, tell, header } = require('./effects')
const { manual } = require('./man')

function* quit(args) {
  // user might pass --q or --quiet flag
  const flags = args.map(flag => flag.trim()).filter(Boolean)

  const isQuiet = flags.includes('--q') || flags.includes('--quiet')

  if (isQuiet) {
    // silently terminate the process
    return process.exit(0)
  }

  // confirm
  while (true) {
    const answer = (yield ask(
      'Are you sure you want to quit? (yes/no): '
    )).toLowerCase()

    switch (answer) {
      case 'yes':
        // user confirmed
        return process.exit(0)
      case 'no':
        // user cancelled
        return
      default:
        yield tell(`Unknown response ${answer}. Please answer "yes" or "no"`)
        break
    }
  }
}

module.exports = manual(quit, 'Quit the application', function* help() {
  yield header('Quit Manual')
  yield tell('Stops running application')
  yield tell(`
Flags:
  --quite, --q - Quit without confirmation
  `)
})
