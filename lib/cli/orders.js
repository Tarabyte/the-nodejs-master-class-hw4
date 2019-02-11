/**
 * Orders Management
 */
const { tell, dir, header, table } = require('./effects')
const { manual } = require('./man')
const group = require('./group')

module.exports = app => {
  const {
    db: { Orders },
  } = app

  // show recent orders
  function* recent() {
    const all = yield Orders.all()

    const date = Date.now() - ('24 hours', 24 * 60 * 60 * 1000)

    const todays = all.filter(order => order.createdAt > date)

    if (todays.length) {
      yield table(
        ['order', 'user', 'date', { title: 'Price, $', key: 'total' }],
        todays.map(item => ({
          order: item._id,
          user: item.userId,
          date: new Date(item.createdAt).toLocaleDateString(),
          total: item.items.reduce(
            (sum, row) => sum + row.value * row.price,
            0
          ),
        }))
      )
    } else {
      yield tell('No orders today :(')
    }
  }

  // show order details
  function* info([id]) {
    if (id) {
      const order = yield Orders.read(id)

      if (order) {
        yield dir({
          user: order.userId,
          status: order.payment ? 'Paid' : 'Not Paid',
          date: new Date(order.createdAt).toLocaleString(),
          items: order.items,
        })
      } else {
        yield tell(`Order ${id} does not exist.`)
      }
    } else {
      yield tell('Order id is required')
      yield tell('Usage: info <order-id>')
    }
  }

  const orders = group(
    {
      recent,
      info,
    },
    {
      prompt: 'orders: ',
      *welcome() {
        yield header('Welcome to orders management')
        yield tell('\n')
        yield tell('Available commands are recent, info, quit.')
      },
    }
  )

  return manual(orders, 'Orders management commads', function* help() {
    yield header('Orders Manual')

    yield tell(`
Avalialble commands:
    recent     - List orders placed in the last 24 hours
    info <id>  - Get order info by id
    quit       - Quit orders management
      `)
  })
}
