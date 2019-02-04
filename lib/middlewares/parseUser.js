/**
 * Populate req.user and req.token using req.headers.token
 *
 */
const lookups = [
  // from token
  req => req.headers.token,
  // from cookie
  req => {
    const { cookie } = req.headers

    if (!cookie) return null

    for (const nameValue of cookie.split(';')) {
      const [name, value] = nameValue.split('=')

      if (name.trim() === 'token') {
        return value.trim()
      }
    }

    return null
  },
]

// run lookup strategies (the first wins)
const lookup = req => {
  for (const method of lookups) {
    const token = method(req)

    if (token) {
      return token
    }
  }

  return null
}

module.exports = async req => {
  const {
    app: {
      db: { Tokens, Users },
    },
  } = req

  const tokenId = lookup(req)

  if (!tokenId) {
    // no tokenid been provided assuming unauthenticated request
    return
  }

  const token = await Tokens.read(tokenId)

  if (token.expires < Date.now()) {
    // token is expired
    return
  }

  // lookup user
  const user = await Users.read(token.userId)

  req.user = user
  req.token = token
}
