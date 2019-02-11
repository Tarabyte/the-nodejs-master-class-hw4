/**
 * Commands help
 */
const { tell, header, table } = require('./effects')
const MAN = Symbol('man')

const man = commands => {
  function* manual(about) {
    const commandName = about
      .map(str => str.trim())
      .filter(Boolean)
      .pop()

    // user is asking for specific command
    if (commandName && commands[commandName]) {
      const command = commands[commandName]

      // ask command to describe its behaviour
      yield* command(['help'])
    } else {
      // show entire help
      const instructions = [
        // group similar commands
        ...Object.entries(commands)
          .reduce((acc, [name, command]) => {
            if (acc.has(command)) {
              acc.get(command).names.push(name)
            } else {
              acc.set(command, { command, names: [name] })
            }

            return acc
          }, new Map())
          .values(),
      ]
        .map(value => [value.names.sort().join(', '), value.command])
        .sort((a, b) => a[0] > b[0])
        .map(([name, command]) => [
          name,
          command[MAN] || 'This command has no description',
        ])

      // show as table
      yield table(
        [{ title: 'Command', key: 0 }, { title: 'Description', key: 1 }],
        instructions
      )
    }
  }

  // hell yeah man has its own man
  const manWithManual = man.manual(manual, 'Print this help', function* help() {
    yield header('Manual')
    yield tell(`
Prints supported commands description and help

Usage:
  man, help, ?       - Lists all commands
  man <command-name> - Prints command help if available
    `)
  })

  // add all help commands support
  man.helpCommands.forEach(command => (commands[command] = manWithManual))
}

// Command description key
man.MAN = MAN

// Available help commands
man.helpCommands = ['help', 'man', '?']

// manual decorator
man.manual = (fn, description, help) => {
  function* withManual(args) {
    const [cmd] = args

    if (help && man.helpCommands.includes(cmd)) {
      yield* help()
    } else {
      yield* fn(args)
    }
  }

  withManual[MAN] = description

  return withManual
}

module.exports = man
