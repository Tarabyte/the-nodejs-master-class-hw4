/**
 * Ensure user is authenticated
 */

module.exports = next => (req, respond) => {
  const { user } = req

  if (!user) {
    // redirect to login page
    return respond(307, 'Authorization Required', {
      'Content-Type': 'text/html',
      Location: '/login',
    })
  }

  return next(req, respond)
}
