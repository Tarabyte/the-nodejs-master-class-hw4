# The NodeJS MasterClass Homework Assignment #4

The NodeJS MasterClass Homework Assignment #4

## Assignment

It is time to build the Admin CLI for the pizza-delivery app you built in the previous assignments. Please build a CLI interface that would allow the manager of the pizza place to:

1. View all the current menu items

2. View all the recent orders in the system (orders placed in the last 24 hours)

3. Lookup the details of a specific order by order ID

4. View all the users who have signed up in the last 24 hours

5. Lookup the details of a specific user by email address

This is an open-ended assignment. You can take any direction you'd like to go with it, as long as your project includes the requirements. It can include anything else you wish as well.

## CLI Commands

Commands list goes here

## Configuration

Configuration is environment dependent and done via `.env.<NODE_ENV>.json` and `.env.<NODE_ENV>.local.json` files. Local files could be used to locally set private configuration that should never be committed to the repo (`.env.*.local.json` pattern is ignored).

For example to configure application to run in production mode one need to create `.env.production.local.json` and then specify NODE_ENV=production when running the application

### Configuration options

| Option      | Description      | Comments                                                                                               |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| dbPath      | Required, String | `CWD` relative path to mount database                                                                  |
| secret      | Required, String | String used to hash passwords                                                                          |
| **http**    | Optional         | Contains configuration options for HTTP server. Defaults to `null` (no http server started)            |
| port        | Required, Number | port to start http server                                                                              |
| **https**   | Optional         | Contains configuration options for HTTPS server. Defaults to `null` (no https server started)          |
| port        | Required, Number | port to start https server                                                                             |
| key         | Required, String | path to key file                                                                                       |
| cert        | Required, String | path to cert file                                                                                      |
| **stripe**  | Optional         | Stripe configuration options. Contains sensetive information. Should be placed in local configs only.  |
| key         | Required, String | Stripe API secret key                                                                                  |
| publicKey   | Required, Strint | Stripe API public key                                                                                  |
| **mailgun** | Optional         | MailGun configuration options. Contains sensetive information. Should be placed in local configs only. |
| key         | Required, String | MailGun API secret key                                                                                 |
| domain      | Required, String | MailGun domain                                                                                         |
| from        | Optional, String | Default from value for messages. Format `Name <email>`                                                 |
| **web**     | Optional         | Web client configuration                                                                               |
| appName     | String           | Application name                                                                                       |
| year        | Number           | Copyright year                                                                                         |

## Development

### Boot application

Application bootstrap process is dynamic. It sequentially loads and calls all files from `lib/boot` directory.

To add additional step one need to create a new `.js` file in boot directory and export a function from it. The function will be called with app and config as arguments.

If step should run only for some specific environment it should have `.<NODE_ENV>.js` file name. For example to create production only boot stript one need to create 'my-script.production.js' file.

### Using DAO

Data access layer (`app.db`) implements filesystem based id-value storage. Values are grouped into collections. Each collection contained in a separate directory to avoid id collisions.

Adding collection `await app.db.addCollection({ name: 'collection'})`.

Collections are accessible by their capitalized names for example `app.db.Users`.

Collection options

- `name` - required string. Must be unique within the database.
- `idField` - string. Defaults to `'_id'`.
- `idGenerator` - function `Object => string`. Generates id for given object. Defaults to `uuid` (@see `lib/util/uuid`).

### Writing tests

`lib/util/test.js` provides a utility function to asynchronous run tests.

- `test(name, fn, options?)` - runs a test implemented by `fn` function
- `test.skip(name, fn, options?)` - skips current test
- `test.module(name, fn, { setup?, teardown?})` - groups tests with optional setup and teardown logic

By default test should complete in 1 second. Normally tests should be faster than that. To extend timeout one could pass `options = { timeout: Expected Time To Complete The Test }`. Timeout override is for current test only.

For example

```javascript
// lib/boot/long.test.js

module.exports = async (app, config) => {
  await test.module('Module', async () => {
    await test(
      'Long running test',
      async () => {
        // long running job
      },
      { timeout: 5000 }
    )
  })
}
```

### Running test

Test runner implemented as a part of application boot process. Tests are marked as `.test.js` to only run when `NODE_ENV=test`.

To only run tests you are working on you could pass `--test=pattern` argument. This would only run test modules which names match the pattern.

```bash
# only runs MailGun related tests
NODE_ENV=test node . --test=MailGun
```

### TDD

One could use `.bin/monitor` to rerun tests when code changes.

```bash
# rerun test matching order or stripe or mailgun pattern
NODE_ENV=test node .bin/monitor --test="(order|stripe|mailun)"
```

# API Description

## Users collection

### `POST /users` create new user

**body** - json stringified object

| Property | Type                                   | Description               |
| -------- | -------------------------------------- | ------------------------- |
| email    | required, unique, string, valid email  | Valid user email address. |
| password | required, string, minimum 6 characters | User password.            |
| name     | required, string, not empty            | User name.                |
| address  | required, string, not empty            | User address.             |

**Responses**

| Code | Response                                | Description                                       |
| ---- | --------------------------------------- | ------------------------------------------------- |
| 200  | `{email, name, address, id}`            | Successful user creation                          |
| 422  | `{message, details: { [field]: error}}` | Missing or invalid field(s) or email already used |
| 500  | `{message}`                             | Unable to create user                             |

---

### `GET /users?id=:userId` get user by id

**query** must include existing user email.

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**Responses**

| Code | Response                          | Description                            |
| ---- | --------------------------------- | -------------------------------------- |
| 200  | `{email, name, address, id}`      | User object                            |
| 401  | `{message}`                       | Missing or expired token               |
| 422  | `{message, details: {id: error}}` | `query.id` is missing or invalid email |
| 500  | `{message}`                       | Unable to get user                     |

---

### `PUT /users?id=:userId` update user by id

**query** must include existing user email.

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**body** - json stringified object

| Property | Type                                   | Description    |
| -------- | -------------------------------------- | -------------- |
| password | optional, string, minimum 6 characters | User password. |
| name     | optional, string, not empty            | User name.     |
| address  | optional, string, not empty            | User address.  |

**Responses**

| Code | Response                                | Description                            |
| ---- | --------------------------------------- | -------------------------------------- |
| 200  | `{email, name, address, id}`            | User object                            |
| 401  | `{message}`                             | Missing or expired token               |
| 403  | `{message}`                             | Token belongs to another userId        |
| 422  | `{message, details: {id: error}}`       | `query.id` is missing or invalid email |
| 422  | `{message, details: { [field]: error}}` | Invalid field(s)                       |
| 422  | `{message }`                            | No fields to update                    |
| 500  | `{message}`                             | Unable to update user                  |

---

### `DELETE /users?id=:userId` delete user by id

**query** must include existing user email.

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**Responses**

| Code | Response                          | Description                            |
| ---- | --------------------------------- | -------------------------------------- |
| 204  | empty                             | User successfully deleted              |
| 401  | `{message}`                       | Missing or expired token               |
| 403  | `{message}`                       | Token belongs to another userId        |
| 422  | `{message, details: {id: error}}` | `query.id` is missing or invalid email |
| 500  | `{message}`                       | Unable to delete user                  |

---

## Tokens collection

### `POST /tokens` create new token

**body** - json stringified object

| Property | Type                                   | Description               |
| -------- | -------------------------------------- | ------------------------- |
| email    | required, unique, string, valid email  | Valid user email address. |
| password | required, string, minimum 6 characters | User password.            |

**Responses**

| Code | Response                                | Description                 |
| ---- | --------------------------------------- | --------------------------- |
| 200  | `{userId, id, expires}`                 | New token                   |
| 401  | `{message}`                             | User does not exist         |
| 401  | `{message}`                             | Password does not match     |
| 422  | `{message, details: { [field]: error}}` | Missing or invalid field(s) |
| 500  | `{message}`                             | Unable to create token      |

---

### `GET /tokens?id=:tokenId` get token by id

**query** must include existing token id.

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**Responses**

| Code | Response                          | Description                      |
| ---- | --------------------------------- | -------------------------------- |
| 200  | `{email, name, address, id}`      | User object                      |
| 401  | `{message}`                       | Missing or expired token         |
| 403  | `{message}`                       | Token belongs to another user    |
| 404  | `{message}`                       | Token with the id does not exist |
| 422  | `{message, details: {id: error}}` | `query.id` is missing            |
| 500  | `{message}`                       | Unable to get token              |

---

### `PUT /tokens?id=:tokenId` extend token expiration date by 1 hour

**query** must include existing token id.

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**body** - json stringified object

| Property | Type                    | Description          |
| -------- | ----------------------- | -------------------- |
| extend   | required, boolean, true | Flag to extend token |

**Responses**

| Code | Response                               | Description                      |
| ---- | -------------------------------------- | -------------------------------- |
| 200  | `{userId, id, expires}`                | Token object                     |
| 400  | `{message}`                            | Extend value is not `true`       |
| 401  | `{message}`                            | Missing or expired token         |
| 403  | `{message}`                            | Token belongs to another userId  |
| 404  | `{message}`                            | Token with the id does not exist |
| 422  | `{message, details: {id: error}}`      | `query.id` is missing            |
| 422  | `{message, details: { extend: error}}` | Invalid extend field value       |
| 500  | `{message}`                            | Unable to update token           |

---

### `DELETE /tokens?id=:tokenId` delete token by id

**query** must include existing token.

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**Responses**

| Code | Response                          | Description                      |
| ---- | --------------------------------- | -------------------------------- |
| 204  | empty                             | Token successfully deleted       |
| 401  | `{message}`                       | Missing or expired token         |
| 403  | `{message}`                       | Token belongs to another userId  |
| 404  | `{message}`                       | Token with the id does not exist |
| 422  | `{message, details: {id: error}}` | `query.id` is missing            |
| 500  | `{message}`                       | Unable to delete token           |

---

## Products Collection

### `GET /products` get available products

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**Responses**

| Code | Response                                | Description                 |
| ---- | --------------------------------------- | --------------------------- |
| 200  | `{ products: Array<{id, name, price}>}` | Products list               |
| 401  | `{message}`                             | Missing or expired token    |
| 500  | `{message}`                             | Unable to get products list |

## Cart

### `POST /cart` add item to cart

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**body** - json stringified object

| Property  | Type                                                    | Description                |
| --------- | ------------------------------------------------------- | -------------------------- |
| productId | required, string, existing product id                   | Product id to add to cart. |
| value     | required, positive, integer, greater than or equal to 1 | Amount of items to add     |

**Responses**

| Code | Response                                    | Description                    |
| ---- | ------------------------------------------- | ------------------------------ |
| 200  | `{items: Array<{productId, value, price}>}` | New cart state                 |
| 401  | `{message}`                                 | Missing or expired token       |
| 422  | `{message, details: { [field]: error}}`     | Missing or invalid field(s)    |
| 500  | `{message}`                                 | Unable to update shopping cart |

---

### `DELETE /cart?productId=:productId` remove item from cart

**query** must include existing product id.

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**Responses**

| Code | Response                                    | Description                    |
| ---- | ------------------------------------------- | ------------------------------ |
| 200  | `{items: Array<{productId, value, price}>}` | New cart state                 |
| 401  | `{message}`                                 | Missing or expired token       |
| 422  | `{message, details: { productId: error}}`   | Missing or invalid field(s)    |
| 500  | `{message}`                                 | Unable to update shopping cart |

---

### `GET /cart` get current user cart

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**Responses**

| Code | Response                                    | Description                 |
| ---- | ------------------------------------------- | --------------------------- |
| 200  | `{items: Array<{productId, value, price}>}` | Cart state                  |
| 401  | `{message}`                                 | Missing or expired token    |
| 500  | `{message}`                                 | Unable to get shopping cart |

---

## Orders Collection

### `POST /orders` create order for current shopping cart

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**body** - json stringified object

| Property     | Type             | Description          |
| ------------ | ---------------- | -------------------- |
| paymentToken | required, string | Stripe payment token |

**Responses**

| Code | Response                                                        | Description                      |
| ---- | --------------------------------------------------------------- | -------------------------------- |
| 200  | `{ order: { userId, items: Array<{productId, value, price}>} }` | Created order                    |
| 401  | `{message}`                                                     | Missing or expired token         |
| 422  | `{message, details: { [field]: error}}`                         | Missing or invalid field(s)      |
| 500  | `{message}`                                                     | Unable to update create an order |

---

### `GET /orders?id=:orderId` get current user orders or specific order

**headers** must include authorization token `{token: 'TOKEN_ID'}`.

**query** may include existing order id

**Responses**

| Code | Response                                                                                   | Description                                       |
| ---- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 200  | `{ order: {userId, items: Array<{productId, value, price}>} }` or `{orders: Array<Order>}` | Existing order or array of orders                 |
| 401  | `{message}`                                                                                | Missing or expired token                          |
| 404  | `{message}`                                                                                | Order with the `id` (if specified) does not exist |
| 500  | `{message}`                                                                                | Unable to get order(s)                            |

---
