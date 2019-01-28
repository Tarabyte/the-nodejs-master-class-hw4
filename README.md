# The NodeJS MasterClass Homework Assignment #2

The NodeJS MasterClass Homework Assignment #2

## Assignment

You are building the API for a pizza-delivery company. Don't worry about a frontend, just build the API. Here's the spec from your project manager:

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.

2. Users can log in and log out by creating or destroying a token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system).

4. A logged-in user should be able to fill a shopping cart with menu items

5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: https://stripe.com/docs/testing#cards

6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account

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
| **mailgun** | Optional         | MailGun configuration options. Contains sensetive information. Should be placed in local configs only. |
| key         | Required, String | MailGun API secret key                                                                                 |
| domain      | Required, String | MailGun domain                                                                                         |
| from        | Optional, String | Default from value for messages. Format `Name <email>`                                                 |

## Development

### Boot application

Application bootstrap process is dynamic. It sequentially loads and calls all files from `lib/boot` directory.

To add additional step one need to create a new `.js` file in boot directory and export a function from it. The function will be called with app and config as arguments.

If step should run only for some specific environment it should have `.<NODE_ENV>.js` file name. For example to create production only boot stript one need to create 'my-script.production.js' file.

### Using DAO

Data access layer (`app.db`) implements filesystem based id-value storage. Values are grouped into collections. Each collection contained in a separate directory to avoid id collisions.

Adding collection `await app.db.addCollection({ name: 'collection'}`.

Collections are accessible by their capitalized names for example `app.db.Users`.

Collection options

- `name` - required string. Must be unique within the database.
- `idField` - string. Defaults to `'_id'`.
- `idGenerator` - function `Object => string`. Generates id for given object. Defaults to `uuid` (@see `lib/util/uuid`).

### Writing tests

`lib/util/test.js` provides a utility function to asynchronous run tests.

- `test(name, fn, options?)` - runs a test implemented by `fn` function
- `test.skip(name, fn, options?)` - skips current test
- `test.module(name, fn)` - groups tests

By default test should complete in 1 second. Normally tests should be faster than that. To extend timeout one could pass `options = { timeout: Expected Time To Complete The Test }`. Timeout override is for current test only.

For example

```javascript
// lib/boot/long.test.js

module.exports = async (app, config) => {
  await test.module('Module', async () => {
    await test(
      'Long running test',
      async () => {
        // run long running job
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

## API Description

API Description goes here
