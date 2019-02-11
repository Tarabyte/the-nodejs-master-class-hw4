/**
 * Orders Management
 */
const { tell, dir, header, table } = require('./effects')
const { manual } = require('./man')
const group = require('./group')

module.exports = app => {
  const {
    db: { Users, Orders },
  } = app

  function* recent() {
    const all = yield Users.all()
    const yesterday = Date.now() - ('24 hours', 24 * 60 * 60 * 1000)

    // filter users created last 24 hours
    const recent = all.filter(user => new Date(user.createdAt) > yesterday)

    if (recent.length) {
      yield table(
        ['name', 'email', 'address', 'registered', 'orders'],
        recent.map(item => ({
          name: item.name,
          email: item.email,
          address: item.address,
          registered: new Date(item.createdAt).toLocaleString(),
          orders: (item.orders && item.orders.length) || 'No Orders',
        }))
      )
    } else {
      yield tell('No users registered today :(')
    }
  }

  function* info([email]) {
    if (!email) {
      yield tell('Email is required')
      yield tell('Usage: info <email>')
      return
    }

    const user = yield Users.read(email)

    if (!user) {
      yield tell(`User with email ${email} does not exist.`)
    } else {
      // show user
      yield dir({
        name: user.name,
        email: user.email,
        address: user.address,
      })

      // try to load orders
      const orders = user.orders || []
      if (!orders.length) {
        yield tell('No orders')
      } else {
        // because we can
        const loadedOrders = yield Promise.all(
          orders.map(id => Orders.read(id))
        )

        yield tell('User orders:')
        yield table(
          ['order', 'date', { title: 'Total, $', key: 'total' }],
          loadedOrders.map(item => ({
            order: item._id,
            date: new Date(item.createdAt).toLocaleString(),
            total: item.items.reduce(
              (sum, item) => sum + item.value * item.price,
              0
            ),
          }))
        )
      }
      yield tell('\n')
    }
  }

  const users = group(
    {
      recent,
      info,
    },
    {
      prompt: 'users: ',
      *welcome() {
        yield header('Welcome to users management')
        yield tell('\n')
        yield tell('Available commands are recent, info, quit.')
      },
    }
  )

  return manual(users, 'Users management commands', function* help() {
    yield header('Users Manual')

    yield tell(`
Available commands:
    recent        - List users signed up in the last 24 hours
    info <email>  - Get user info by email
    quit          - Quit users management
      `)
  })
}
