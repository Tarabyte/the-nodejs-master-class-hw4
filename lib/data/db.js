const { resolve, join } = require('path')

const { ensuredir } = require('../util/fs')

const debug = require('./debug')
const Collection = require('./collection')

const attachCollection = db => async collection => {
  await collection.attach(db)

  Object.defineProperty(db, collection.name, {
    value: collection,
  })
}

/**
 * Database class
 */
class DB {
  constructor(baseDir) {
    this.baseDir = resolve(process.cwd(), baseDir)

    this.collections = new Set()
    this.getPath = path => join(this.baseDir, path)
  }

  /**
   * Converts object to collction instance
   * Adds it to collections set
   * @param {Object} options
   * @returns {Collection} Collection instance
   */
  createCollection(options) {
    const collection = new Collection(options)

    this.collections.add(collection)

    return collection
  }

  /**
   * Adds collection w/ given options
   * @returns {DB} current db for chaining
   */
  addCollection(options) {
    this.createCollection(options)

    return this
  }

  /**
   * Connects db to file system
   */
  async connect() {
    debug('Connecting DB to dir %s.', this.baseDir)
    // ensure baseDir exists
    await ensuredir(this.baseDir, { recursive: true })

    // copy collections array
    const collections = [...this.collections]

    debug(
      'Attaching collections %j',
      collections.map(collection => collection.name)
    )

    const attach = attachCollection(this)

    // attach all collections
    await Promise.all(collections.map(attach))

    // replace addCollection w/ autoattach
    this.addCollection = async options => {
      const collection = this.createCollection(options)

      await attach(collection)

      return this
    }

    return this
  }
}

module.exports = DB
