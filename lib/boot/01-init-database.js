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

  if (!dbPath) {
    throw new Error(
      `Unable to initialize db. dbPath should be a string. Got ${typeof dbPath} instead.`
    )
  }

  const db = new DB(dbPath)

  db.addCollection({
    name: 'users',
    // use email as key
    idGenerator: user => user.email,
  })
    .addCollection({
      name: 'tokens',
    })
    .addCollection({
      name: 'products',
      // make id simple
      idField: 'id',
    })

  await db.connect()

  // save db for future use
  Object.defineProperty(app, dbProp, {
    value: db,
  })
}
