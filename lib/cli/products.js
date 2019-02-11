/**
 * Products commands
 */
const { ask, tell, dir, header, table } = require('./effects')
const { manual } = require('./man')

module.exports = app => {
  const { Products } = app.db

  // list available products
  function* list() {
    const products = yield Products.all()
    return products
  }

  // show product info
  function* info(name) {
    if (name) {
      const all = yield list
      const product = all.find(item => item.name.toLowerCase().startsWith(name))
      if (product) {
        yield dir(product)
      } else {
        yield tell(`There is no product "${name}" available`)
      }
    } else {
      yield tell('Product name is required')
      yield tell(`Usage: info <product-name>`)
    }
  }

  // add new product
  function* add() {
    let product = {}

    const products = yield list

    const cancel = Symbol('cancel')

    try {
      product.name = yield function* getName() {
        while (true) {
          const possibleName = (yield ask('Enter new product name: ')).trim()

          const normalized = possibleName.toLowerCase()

          if (normalized === ':q') {
            throw cancel
          }

          if (!possibleName) {
            yield tell('Please enter product name or :q to cancel')
            continue
          }

          const alreadyExists = products.find(
            item => item.name.toLowerCase() === possibleName
          )

          if (alreadyExists) {
            yield tell('Product already exists')
            yield dir(alreadyExists)
            yield tell('Please use another name or :q to cancel')
            continue
          }

          return possibleName
        }
      }

      product.price = yield function* getPrice() {
        while (true) {
          const possiblePrice = (yield ask(
            `Enter ${product.name} price: `
          )).trim()

          const normalized = possiblePrice.toLowerCase()

          if (normalized === ':q') {
            throw cancel
          }

          if (!possiblePrice) {
            yield tell('Please enter product price or :q to cancel')
            continue
          }

          const priceValue = parseFloat(possiblePrice)

          if (Number.isNaN(priceValue) || priceValue <= 0) {
            yield tell('Price should be a valid number or enter :q to cancel')
            continue
          }

          return priceValue
        }
      }

      const created = yield Products.create(product)

      yield tell('Product created')
      yield dir(created)
    } catch (e) {
      if (e === cancel) {
        return
      }

      throw e
    }
  }

  function* products(args) {
    let commandName = args.shift()
    const showWelcome = !commandName

    if (showWelcome) {
      yield header('Welcome to products management')
      yield tell('\n')
      yield tell('Available commands are list, add, info, quit.')
    }

    while (true) {
      if (!commandName) {
        args = (yield ask('products: '))
          .split(/\s+/)
          .map(str => str.trim().toLowerCase())
          .filter(Boolean)
        commandName = args.shift()
      }

      switch (commandName) {
        case 'quit':
          return
        case 'list':
          // load all products
          const all = yield list
          yield table(['id', 'name', { title: 'Price, $', key: 'price' }], all)
          break
        case 'info':
          // show product info
          const [name] = args
          yield* info(name)
          break
        case 'add':
          // add new product
          yield add
          break
        default:
          yield tell(
            `Unknown command "${commandName}". Supported commands are list, add, info, quit`
          )
      }

      commandName = null
    }
  }

  return manual(products, 'Product management commands', function* help() {
    yield header('Products Manual')
    yield tell(`
Available commands:
  list         - List all available products
  info <name>  - Show product info using name param
  add          - Add new product
  quit         - Quit products management
    `)
  })
}
