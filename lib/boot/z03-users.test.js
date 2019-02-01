const assert = require('assert')
const test = require('../util/test')
const fetch = require('../util/fetch')

module.exports = async (app, config) => {
  const {
    db: { Users, Tokens },
  } = app

  const users = options =>
    fetch({ path: '/api/users', port: config.http.port, ...options })

  const tokens = options =>
    fetch({ path: '/api/tokens', port: config.http.port, ...options })

  const fakeUser = user => ({
    email: 'somefakeuser@gmail.com',
    password: 'aaaaaa',
    name: 'Joe Doe',
    address: 'Elm st., 20',
    ...user,
  })

  await test.module('Users&Tokens API', async () => {
    await test('Clean users and tokens', async () => {
      await Users.empty()

      const usersList = await Users.list()

      assert.deepStrictEqual(usersList, [])

      await Tokens.empty()

      const tokensList = await Tokens.list()

      assert.deepStrictEqual(tokensList, [])
    })

    await test('User creation success', async () => {
      const userData = fakeUser()

      const { statusCode, data } = await users({
        method: 'POST',
        data: userData,
      })

      assert.strictEqual(statusCode, 200)
      assert.deepStrictEqual(data, {
        email: userData.email,
        name: userData.name,
        address: userData.address,
        id: userData.email,
      })

      const user = await Users.read(userData.email)

      assert(user)
    })

    await test('Can not create user w/ the same email', async () => {
      const userData = fakeUser({
        email: 'duplicaitetest@gmail.com',
      })

      const { statusCode } = await users({
        method: 'POST',
        data: userData,
      })

      assert.strictEqual(statusCode, 200)

      const { statusCode: secondStatusCode, data } = await users({
        method: 'POST',
        data: userData,
      })

      assert.strictEqual(secondStatusCode, 422)
      assert.strictEqual(
        data.message,
        'User with this email duplicaitetest@gmail.com already exists'
      )
    })

    await test('Successful token creation', async () => {
      const userData = fakeUser({
        email: 'tokencreationtest@gmail.com',
      })

      // create user
      await users({
        method: 'POST',
        data: userData,
      })

      // successful login
      const { statusCode, data: token } = await tokens({
        method: 'POST',
        data: {
          email: userData.email,
          password: userData.password,
        },
      })

      assert.strictEqual(statusCode, 200)
      assert.strictEqual(token.userId, userData.email)
      assert(token.id)

      // token is in db
      const tokenFromDB = await Tokens.read(token.id)

      assert(tokenFromDB, 'Token was not saved')

      // get token back
      const { statusCode: successful, data: gotToken } = await tokens({
        query: {
          id: token.id,
        },
        headers: {
          token: token.id,
        },
      })

      assert.strictEqual(successful, 200)
      assert(gotToken, 'Unable to get token back')

      // token is now is now in user.tokens
      const userFromDB = await Users.read(token.userId)

      assert.deepStrictEqual(userFromDB.tokens, [token.id])
    })

    await test('Incorrect email', async () => {
      const { statusCode, data } = await tokens({
        method: 'POST',
        data: {
          password: 'aaaaaa',
          email: 'test-incorrect-email@gmail.com',
        },
      })

      assert.strictEqual(statusCode, 401)
      assert.strictEqual(data.message, 'Incorrect email or password')
    })

    await test('Incorrect password', async () => {
      const userData = fakeUser({
        email: 'incorrectpasswordtest@gmail.com',
      })

      // create user
      await users({
        method: 'POST',
        data: userData,
      })

      // failed to login
      const { statusCode, data } = await tokens({
        method: 'POST',
        data: {
          email: userData.email,
          password: 'bbbbbbb',
        },
      })

      assert.strictEqual(statusCode, 401)
      assert.strictEqual(data.message, 'Incorrect email or password')
    })

    await test('Getting existing user', async () => {
      const userData = fakeUser({
        email: 'gettingexistingusertest@gmail.com',
      })

      // create user
      await users({
        method: 'POST',
        data: userData,
      })

      // getting user by id w/o token
      const {
        statusCode: gettingUserWOTokenStatusCode,
        data: gettingUserWOTokenError,
      } = await users({
        query: { id: userData.email },
      })

      assert.strictEqual(gettingUserWOTokenStatusCode, 401)
      assert.deepStrictEqual(
        gettingUserWOTokenError.message,
        'Token is missing or expired'
      )

      // gettin user w/o id
      const { statusCode: gettingUserWOId } = await users({
        query: {},
      })
      assert.strictEqual(gettingUserWOId, 400)

      // login
      const {
        data: { id: token },
      } = await tokens({
        method: 'POST',
        data: {
          email: userData.email,
          password: userData.password,
        },
      })

      assert(token, 'Failed to get token')

      // get user by id
      const { statusCode: getUserStatusCode, data: getUser } = await users({
        query: { id: userData.email },
        headers: {
          token,
        },
      })

      assert.strictEqual(getUserStatusCode, 200)
      assert.deepStrictEqual(getUser, {
        id: userData.email,
        email: userData.email,
        name: userData.name,
        address: userData.address,
      })
    })

    await test('Editing current user', async () => {
      const userData = fakeUser({
        email: 'editingusertest@gmail.com',
      })

      // create user
      await users({
        method: 'POST',
        data: userData,
      })

      // editing user w/o token
      const { statusCode: editingUserWOTokenStatusCode } = await users({
        method: 'PUT',
        query: {
          id: userData.email,
        },
        data: {
          name: 'Modified Name',
          address: 'Modified Address',
        },
      })

      assert.strictEqual(editingUserWOTokenStatusCode, 401)

      // login
      const {
        statusCode: loginSuccess,
        data: { id: token },
      } = await tokens({
        method: 'POST',
        data: {
          email: userData.email,
          password: userData.password,
        },
      })

      assert.strictEqual(loginSuccess, 200)
      assert(token, 'Failed to get token')

      // sending empty update
      const { statusCode: emptyUpdatesStatusCode } = await users({
        method: 'PUT',
        query: {
          id: userData.email,
        },
        data: {},
        headers: { token },
      })

      assert(emptyUpdatesStatusCode, 400)

      // updating user
      const {
        statusCode: successfulStatusCode,
        data: updatedUser,
      } = await users({
        method: 'PUT',
        query: {
          id: userData.email,
        },
        data: {
          name: 'Modified Name',
          address: 'Modified Address',
        },
        headers: {
          token,
        },
      })

      assert(successfulStatusCode, 200)
      assert.deepStrictEqual(updatedUser, {
        id: userData.email,
        name: 'Modified Name',
        address: 'Modified Address',
        email: userData.email,
      })

      // ensure db was updated
      const userFromDB = await Users.read(updatedUser.id)

      assert.strictEqual(userFromDB.name, 'Modified Name')
      assert.strictEqual(userFromDB.address, 'Modified Address')
    })

    await test('Delete user', async () => {
      const userData = fakeUser({
        email: 'testuserdeletion@gmail.com',
      })

      const { data: user } = await users({
        method: 'POST',
        data: userData,
      })

      assert(user, 'Failed to create user')

      // try to delete w/o token
      const { statusCode: unauthenticated } = await users({
        method: 'DELETE',
        query: {
          id: userData.email,
        },
      })

      assert.strictEqual(unauthenticated, 401)

      // login
      const {
        statusCode: loginSuccess,
        data: { id: token },
      } = await tokens({
        method: 'POST',
        data: {
          email: userData.email,
          password: userData.password,
        },
      })

      assert.strictEqual(loginSuccess, 200)
      assert(token, 'Failed to create token')

      // trying to delete another user
      const { data: another } = await users({
        method: 'POST',
        data: fakeUser({
          email: 'testuserdeletionanotheruser@gmail.com',
        }),
      })

      assert(another, 'Failed to create another user')

      const { statusCode: unauthorized, data } = await users({
        method: 'DELETE',
        query: {
          id: another.email,
        },
        headers: { token },
      })

      assert.strictEqual(unauthorized, 403, data.message)

      // successful deletion
      const { statusCode: successful } = await users({
        method: 'DELETE',
        query: {
          id: user.email,
        },
        headers: {
          token,
        },
      })

      assert.strictEqual(successful, 204)

      const exists = await Users.exists(user.email)

      assert(!exists)
    })

    await test('Token prolongation', async () => {
      const userData = fakeUser({
        email: 'testtokenprolongation@gmail.com',
      })

      const { data: user } = await users({
        method: 'POST',
        data: userData,
      })

      assert(user, 'Failed to create user')

      const { data: tokenData } = await tokens({
        method: 'POST',
        data: {
          password: userData.password,
          email: userData.email,
        },
      })

      const isClose = (value, target) =>
        Math.round((value / target) * 1000) === 1000
      const hour = 60 * 60 * 1000

      const { id: token, expires } = tokenData

      assert(token, 'Failed to create token')
      // expires is approx now + 1 hour
      assert(isClose(expires, Date.now() + hour), 'Expire in an hour')

      // try w/o header
      const { statusCode: unauthenticated } = await tokens({
        method: 'PUT',
        query: {
          id: token,
        },
        data: {
          extend: true,
        },
      })

      assert.strictEqual(unauthenticated, 401)

      // set expire earlier to actually check prolongation
      const tokenFromDB = await Tokens.read(token)
      await Tokens.update({
        ...tokenFromDB,
        expires: expires - hour / 2,
      })

      // prolongation
      const { statusCode: successful, data: updatedToken } = await tokens({
        method: 'PUT',
        query: { id: token },
        data: {
          extend: true,
        },
        headers: {
          token,
        },
      })

      assert.strictEqual(successful, 200)
      assert.strictEqual(updatedToken.id, token)
      assert.strictEqual(updatedToken.userId, userData.email)
      // expires is approx now + 1 hour
      assert(
        isClose(updatedToken.expires, Date.now() + hour),
        'Expire in an hour'
      )
    })

    await test('Delete token', async () => {
      const userData = fakeUser({
        email: 'testtokendeletion@gmail.com',
      })

      const { statusCode: userCreatedSuccess, data: user } = await users({
        method: 'POST',
        data: userData,
      })

      assert.strictEqual(userCreatedSuccess, 200)

      //login
      const {
        statusCode: tokenCreatedSuccess,
        data: { id: token },
      } = await tokens({
        method: 'POST',
        data: {
          email: user.email,
          password: userData.password,
        },
      })

      assert.strictEqual(tokenCreatedSuccess, 200)

      // unauthenticated
      const { statusCode: unauthenticated } = await tokens({
        method: 'DELETE',
        query: {
          id: token,
        },
      })

      assert.strictEqual(unauthenticated, 401)

      // successful
      const { statusCode: successful } = await tokens({
        method: 'DELETE',
        query: {
          id: token,
        },
        headers: {
          token,
        },
      })

      assert.strictEqual(successful, 204)

      // ensure token was removed from user.tokens
      const userFromDB = await Users.read(userData.email)

      assert.deepStrictEqual(userFromDB.tokens, [])
    })

    await Users.empty()
    await Tokens.empty()
  })
}
