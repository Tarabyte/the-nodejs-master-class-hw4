const { DB } = require('../data')
const debug = require('../debug')('INIT_DB', 'yellow')

/**
 * Initialize FS database using config.dbPath
 *
 * Connected db will be accessible via app[config.dbProp]
 */
module.exports = async (app, config) => {
  const { dbPath, dbProp = 'db' } = config

  debug('Initializing database at %s.', dbPath)

  const db = new DB(dbPath)

  db.addCollection({
    name: 'users',
  })
    .addCollection({
      name: 'tokens',
    })
    .addCollection({
      name: 'items',
    })

  await db.connect()

  // save db for future use
  Object.defineProperty(app, dbProp, {
    value: db,
  })
}