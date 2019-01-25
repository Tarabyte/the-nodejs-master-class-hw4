/**
 * Collection class
 */
const { constants } = require('fs')
const { basename, sep } = require('path')
const {
  ensuredir,
  readdir,
  unlink,
  open,
  write,
  close,
  read,
  fstat,
  truncate,
  access,
} = require('../util/fs')
const capitalize = require('../util/capitalize')
const uuid = require('../util/uuid')
const debug = require('./debug')

// file extension
const EXT = '.json'

class Collection {
  /**
   * options.name - Collection name (required)
   * options.idGenerator - Unique id generator for given collection. Defaults to uuid
   * options.idField - Field to store item id. Defaults to _id
   * @param {Object} options
   */
  constructor(options) {
    const { name, idGenerator = uuid, idField = '_id' } = options
    this.name = capitalize(name)
    this.dirName = name.toLowerCase()
    this.idGenerator = idGenerator
    this.idField = idField
  }

  /**
   * Attach collection to the DB
   */
  async attach(db) {
    this.dir = db.getPath(this.dirName)

    debug('%s: Attaching collection to the dir %s', this.name, this.dir)

    await ensuredir(this.dir)
  }

  /**
   * List all entries in the DB
   */
  async list() {
    debug('%s: Listing items from %s', this.name, this.dir)
    const files = await readdir(this.dir)

    return files.map(file => decodeURIComponent(basename(file, EXT)))
  }

  /**
   * Empty entire collection
   */
  async empty() {
    debug('%s: Removing all items from the collection.', this.name)
    const { dir } = this

    const files = await readdir(dir)

    // unlink all files
    await Promise.all(files.map(file => unlink(`${dir}${sep}${file}`)))
  }

  /**
   * Check if item w/ id exists
   * @param {String} itemId Item id
   */
  async exists(itemId) {
    debug('%s: Checking if item w/ id %s exists.', this.name, itemId)

    const fileName = this._getFileName(itemId)
    debug('%s: Item file name is %s.', this.name, fileName)

    try {
      // try to access the file
      await access(fileName, constants.F_OK)
      return true
    } catch (e) {
      // no file but check been successful
      if (e.code === 'ENOENT') {
        return false
      }

      throw e
    }
  }

  /**
   * Saves item in data base
   * @param {Object} item Object to save
   * @returns {Object} Modified item
   */
  async create(item) {
    debug('%s: Creating a new item %j.', this.name, item)
    this._ensureId(item)

    const fileName = this._getFileName(item)
    debug('%s: Item file name is %s.', this.name, fileName)

    // open file for writing, throw if exists
    const fd = await open(fileName, 'wx')
    try {
      // write stringified item to file
      await write(fd, JSON.stringify(item))

      return item
    } finally {
      // close descriptor
      if (fd) {
        await close(fd)
      }
    }
  }

  /**
   * Read item by id
   * @param {String} id
   */
  async read(id) {
    debug('%s: Reading item by id %s.', this.name, id)
    const fileName = this._getFileName(id)

    debug('%s: Item file name is %s.', this.name, fileName)

    let fd = null
    try {
      fd = await open(fileName, 'r')

      // read file size to effectively allocate buffer
      const { size } = await fstat(fd)

      // read file to buffer
      const { buffer } = await read(fd, Buffer.alloc(size), 0, size, 0)

      // deserialize item
      const item = JSON.parse(buffer.toString())

      // freeze item identifier
      Object.defineProperty(item, this.idField, {
        enumerable: true,
        value: id,
      })

      return item
    } catch (e) {
      // return null for absent item
      if (e.code === 'ENOENT') {
        return null
      }

      // rethrow otherwise
      throw e
    } finally {
      // always close descriptor
      if (fd) {
        await close(fd)
      }
    }
  }

  /**
   * Updates given item
   * @param {Object} item Item to update
   */
  async update(item) {
    debug('%s: Updating item %j.', this.name, item)

    if (!(this.idField in item)) {
      throw new Error(`Unable to update item w/o ${this.idField}`)
    }

    const fileName = this._getFileName(item)

    debug('%s: Item file name is %s.', this.name, fileName)

    // open file for reading and writing, throw if doesn't exist
    const fd = await open(fileName, 'r+')

    try {
      // clean previous contents
      await truncate(fd)

      // write stringified item to file
      await write(fd, JSON.stringify(item), 0)
    } finally {
      // close descriptor
      await close(fd)
    }

    return item
  }

  /**
   * Remove item from disk
   * @param {Object} itemOrId Item or item id to be deleted
   */
  async remove(item) {
    debug('%s: Deleting item %j.', this.name, item)

    if (!(this.idField in item)) {
      throw new Error(`Unable to remove item w/o ${this.idField}`)
    }

    await this.removeById(item[this.idField])

    return item
  }

  /**
   * Remove item w/ given id
   * @param {String} itemId Item identifier
   */
  async removeById(itemId) {
    debug('%s: Deleting item by id %s.', this.name, itemId)

    const fileName = this._getFileName(itemId)

    debug('%s: Item file name is %s.', this.name, fileName)

    await unlink(fileName)

    return itemId
  }

  /**
   * Read entire collection from DB
   */
  async all() {
    // first read all ids
    const ids = await this.list()

    // then read all items
    return await Promise.all(ids.map(id => this.read(id)))
  }

  /**
   * Construct item file path.
   * @param {Object|String} item Item to get file path for
   * @returns {String} item file path based on id
   */
  _getFileName(item) {
    const id = encodeURIComponent(item[this.idField] || item)

    return `${this.dir}${sep}${id}.json`
  }

  /**
   * Ensure item has id
   * @param {Object} item
   * @returns {*} item id
   */
  _ensureId(item) {
    return item[this.idField] || (item[this.idField] = this.idGenerator(item))
  }

  /**
   * Extracts id from item
   * @param {Object} item
   */
  getId(item) {
    return item[this.idField]
  }
}

module.exports = Collection
