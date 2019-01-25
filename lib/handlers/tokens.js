const {
  validator,
  isEmail,
  string,
  bool,
  required,
  minLength,
  length,
} = require('./validate')
const { hash, authenticated } = require('./auth')
const compose = require('../util/compose')
const project = require('../util/project')

// token time to live
const TTL = 60 * 60 * 1000 // 1 hour

// validate token is in query
const validateTokenId = validator(
  { id: [required, string, length(0x20)] },
  {
    extract: (_, req) => req.query,
    merge: (req, query) => (req.query = query),
    message: 'Invalid token id',
    code: 400,
  }
)

// public token fields
const projectToken = project({
  userId: true,
  expires: true,
  id: '_id',
})

module.exports = {
  /**
   * Handle token creation
   */
  post: validator(
    {
      email: [required, string, isEmail],
      password: [required, string, minLength(6)],
    },
    {
      extract: body => ({
        email: typeof body.email === 'string' ? body.email.trim() : undefined,
        password: typeof body.password === 'string' ? body.password : undefined,
      }),
      message: 'Incorrect credentials',
    }
  )(async (req, respond) => {
    const {
      app: {
        db: { Users, Tokens },
      },
      body: { email, password },
    } = req

    const user = await Users.read(email)

    // no user w/ the email exists
    if (!user) {
      // do not leak that email actually does not exist
      return respond(401, new Error('Incorrect email or password'))
    }

    // password mismatch
    if (hash(password) !== user.password) {
      return respond(401, new Error('Incorrect email or password'))
    }

    const userId = Users.getId(user)

    const token = await Tokens.create({
      userId,
      expires: Date.now() + TTL,
    })

    // save user - token relation
    user.tokens = user.tokens || []
    user.tokens.push(Tokens.getId(token))

    await Users.update(user)

    // return token data
    return respond(200, projectToken(token))
  }),

  /**
   * Handle token update (extend expiration date)
   */
  put: compose(
    authenticated,
    validateTokenId,
    validator({
      extend: [required, bool],
    })
  )(async (req, respond) => {
    const {
      user,
      body: { extend },
      query: { id },
      app: {
        db: { Tokens, Users },
      },
    } = req

    if (!extend) {
      return respond(400, new Error('extend should be true'))
    }

    const tokenFromDB = await Tokens.read(id)

    if (Users.getId(user) !== tokenFromDB.userId) {
      return respond(403, new Error('Access denied'))
    }

    if (tokenFromDB.expires < Date.now()) {
      return respond(401, new Error('Token is expired'))
    }

    tokenFromDB.expires = Date.now() + TTL

    const updatedToken = await Tokens.update(tokenFromDB)

    return respond(200, projectToken(updatedToken))
  }),

  /**
   * Handle get token by id
   */
  get: compose(
    authenticated,
    validateTokenId
  )(async (req, respond) => {
    const {
      user,
      query: { id },
      app: {
        db: { Tokens, Users },
      },
    } = req

    const token = await Tokens.read(id)

    if (!token) {
      return respond(404, new Error(`Token with the id ${id} does not exist`))
    }

    // attempt to request some else token
    if (Users.getId(user) !== token.userId) {
      return respond(403, new Error('Access denied'))
    }

    return respond(200, projectToken(token))
  }),

  /**
   * Handle token deletion
   */
  delete: compose(
    authenticated,
    validateTokenId
  )(async (req, respond) => {
    const {
      user,
      query: { id },
      app: {
        db: { Tokens, Users },
      },
    } = req

    const token = await Tokens.read(id)

    if (!token) {
      return respond(404, new Error(`Token with the id ${id} does not exist`))
    }

    // attempt to request some else token
    if (Users.getId(user) !== token.userId) {
      return respond(403, new Error('Access denied'))
    }

    await Tokens.remove(token)

    // remove user-token relation
    user.tokens = user.tokens.filter(item => item !== id)

    await Users.update(user)

    return respond(204)
  }),
}
