/**
 * Users controller implementation
 */
const {
  validator,
  required,
  isEmail,
  minLength,
  string,
  optional,
} = require('./validate')
const { hash, authenticated } = require('./auth')
const compose = require('../util/compose')
const project = require('../util/project')

// validate query has id, that is correct email
const validateId = validator(
  { id: [required, isEmail] },
  {
    extract: (_, req) => req.query,
    merge: (req, query) => (req.query = query),
    message: 'Incorrect user id',
    code: 400,
  }
)

// project public user fields
const projectUser = project({
  name: true,
  address: true,
  id: '_id',
  orders: true,
  email: true,
})

module.exports = {
  /**
   * Handle user creation
   */
  post: validator(
    {
      email: [required, string, isEmail],
      name: [required, string, minLength(2)],
      password: [required, string, minLength(6)],
      address: [required, string, minLength(1)],
    },
    {
      extract: body => ({
        email: typeof body.email === 'string' && body.email.trim(),
        name: typeof body.name === 'string' && body.name.trim(),
        password: body.password,
        address: body.address,
      }),
      message: 'User data is invalid',
    }
  )(async (req, respond) => {
    const {
      app: {
        db: { Users },
      },
      body: user,
    } = req

    // check user exists
    const exists = await Users.exists(user.email)

    if (exists) {
      return respond(
        422,
        new Error(`User with this email ${user.email} already exists`)
      )
    }

    // populate system fields
    user.createdAt = user.modifiedAt = new Date()

    // save password hash
    user.password = hash(user.password)

    // save new user
    const newUser = await Users.create(user)

    // return newly created user
    return respond(200, projectUser(newUser))
  }),

  /**
   * Handle user access by id
   */
  get: compose(
    authenticated,
    validateId
  )(async (req, respond) => {
    const {
      query: { id },
      app: {
        db: { Users },
      },
      user,
    } = req

    // user only can access his own data
    if (id !== Users.getId(user)) {
      return respond(403, new Error('Access denied'))
    }

    // copy some fields from user
    return respond(200, projectUser(user))
  }),

  /**
   * Handle user edit
   */
  put: compose(
    authenticated,
    validateId,
    validator(
      {
        name: optional(string, minLength(2)),
        address: optional(string, minLength(1)),
        password: optional(string, minLength(6)),
      },
      {
        extract: body => ({
          name: typeof body.name === 'string' && body.name.trim(),
          password: body.password,
          address: body.address,
        }),
        message: 'User data is invalid',
      }
    )
  )(async (req, respond) => {
    const {
      body: { name, address, password },
      user,
      query: { id },
      app: {
        db: { Users },
      },
    } = req

    // collect actual updates
    const updates = {}

    if (name) {
      updates.name = name
    }

    if (address) {
      updates.address = address
    }

    if (password) {
      updates.password = hash(password)
    }

    // some fields should be specified
    if (!Object.keys(updates).length) {
      return respond(400, new Error('No fields to update were specified'))
    }

    // user only can access his own data
    if (id !== Users.getId(user)) {
      return respond(403, new Error('Access denied'))
    }

    // read current user from DB
    const currentUser = await Users.read(Users.getId(user))

    // save updated user
    const updatedUser = await Users.update({
      ...currentUser,
      ...updates,
    })

    // send updated user back
    return respond(200, projectUser(updatedUser))
  }),

  /**
   * Handle user deletion
   */
  delete: compose(
    authenticated,
    validateId
  )(async (req, respond) => {
    const {
      app: {
        db: { Users },
      },
      query: { id },
      user,
    } = req

    if (id !== Users.getId(user)) {
      return respond(403, new Error('Access denied'))
    }

    // delete user
    await Users.remove(user)

    return respond(204)
  }),
}
