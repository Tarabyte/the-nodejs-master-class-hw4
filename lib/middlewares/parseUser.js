/**
 * Populate req.user and req.token using req.headers.token
 *
 */
module.exports = async req => {
  const {
    headers,
    app: {
      db: { Tokens, Users },
    },
  } = req

  const { token: tokenId } = headers

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
