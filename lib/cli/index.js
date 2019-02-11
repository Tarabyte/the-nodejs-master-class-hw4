/**
 * Managers CLI
 */
const readline = require('readline')
const interpretator = require('./interpretator')
const { ask, tell, header, dir, table, IO } = require('./effects')
const quit = require('./quit')
const products = require('./products')
const orders = require('./orders')
const users = require('./users')
const man = require('./man')

const { notify } = require('../debug')
const capitalise = require('../util/capitalize')

module.exports = app => {
  const io = readline.Interface({
    input: process.stdin,
    output: process.stdout,
  })

  // make Input/Output handlers
  const IOHandlers = new Map([
    [tell, ({ message }) => console.log(message)],
    [ask, ({ question }) => new Promise(r => io.question(question, r))],
    [
      header,
      ({ message }) => {
        // display center message
        const { columns } = process.stdout

        const diff = columns - message.length - ('two whitespaces', 2)

        console.log('\n')
        if (diff < 0) {
          // header is too long
          console.log(message)
        } else {
          console.log(
            `${'*'.repeat(diff / 2)} ${message} ${'*'.repeat(diff / 2)}`
          )
        }
      },
    ],
    [
      dir,
      ({ obj, options }) => {
        console.dir(obj, { colors: true, ...options })
      },
    ],
    [
      table,
      ({ headers, values }) => {
        headers = headers.map(header =>
          typeof header === 'object'
            ? header
            : { title: `${capitalise(header)}`, key: header }
        )

        const rows = values.map(obj =>
          headers.map(header => {
            const value = obj[header.key]

            if (value == null) return ''

            return `${value}`
          })
        )

        const widths = headers.map(header => header.title.length)

        rows.forEach(row =>
          row.forEach((cell, i) => {
            widths[i] = Math.max(widths[i], cell.length)
          })
        )

        const print = (str, i) => `${str}${' '.repeat(widths[i] - str.length)}`

        const head = `|${headers
          .map((header, i) => print(header.title, i))
          .join('|')}|`

        const top = `┌${widths.map(width => '─'.repeat(width)).join('┬')}┐`
        const sep = `├${widths.map(width => '─'.repeat(width)).join('┼')}┤`
        const bottom = `└${widths.map(width => '─'.repeat(width)).join('┴')}┘`

        console.log(top)
        console.log(head)
        console.log(sep)
        rows.forEach((row, i) => {
          console.log(`|${row.map(print).join('|')}|`)
          console.log(i === rows.length - 1 ? bottom : sep)
        })
      },
    ],
  ])

  // make interpretator
  const interpret = interpretator(command => {
    const handler = IOHandlers.get(command[IO])

    if (handler) {
      return handler(command)
    }

    console.warn('Unknown io request %j', command)

    return null
  })

  // all supported commands
  const commands = {
    quit,
    exit: quit,
    products: products(app),
    orders: orders(app),
    users: users(app),
  }

  // init help
  man(commands)

  const getCommand = (prompt = '> ') =>
    new Promise(resolve => {
      io.once('line', resolve)
      io.setPrompt(prompt)
      io.prompt()
    })

  // when app is started run CLI loop
  app.events.on('started', async () => {
    notify.green('CLI is running')
    while (true) {
      const userInput = await getCommand()
      const [commandName, ...commandArgs] = userInput.split(/\s+/)
      const command = commands[commandName]

      // unknown command
      if (!command) {
        io.setPrompt('')
        console.log(
          `Unknown command ${commandName}. Supported commands: ${Object.keys(
            commands
          ).join(', ')}`
        )
        continue
      }

      // run the command
      try {
        await interpret(command, commandArgs)
      } catch (e) {
        notify.red(`Failed to execute the command ${commandName}`)
        console.error(e)
      }
    }
  })
}
