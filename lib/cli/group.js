/**
 * Group command combinator
 */
const { ask, tell } = require('./effects')

module.exports = (commands, config = {}) => {
  const supportedCommands = Object.keys(commands).sort()
  const quit = config.quit || 'quit'
  supportedCommands.push(quit)

  return function* grouped(args) {
    let commandName = args.shift()

    // no command show welcome message
    if (!commandName && config.welcome) {
      yield config.welcome
    }

    // main command loop
    while (true) {
      if (!commandName) {
        args = (yield ask(config.prompt || ' '))
          .trim()
          .split(/\s+/)
          .filter(Boolean)

        commandName = args.shift()

        if (!commandName) return
      }

      // quit the loop
      if (commandName === quit) {
        return
      }

      const command = commands[commandName.toLowerCase()]

      if (command) {
        yield* command(args)
      } else {
        yield tell(
          `Unknown command ${commandName}. Supported commands ${supportedCommands.join(
            ', '
          )}.`
        )
      }

      commandName = null
    }
  }
}
