/**
 * Simple uuid generator a-la RFC 4122 v4
 */
const { randomBytes } = require('crypto')

// pre-cache char to string
const bytesToString = Array.from({ length: 0x100 }, (_, byte) =>
  // add 100 hex to handle leading zeros for us
  (byte + 0x100).toString(0x10).substr(1)
)

const toString = byte => bytesToString[byte]

module.exports = () => {
  // generate random bytes
  const bytes = randomBytes(0x10)

  // @see https://tools.ietf.org/html/rfc4122#section-4.4
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // convert to string
  // we want Array.prototype.map not Uint8Array.prototype.map to store strings
  return Array.prototype.map.call(bytes, toString).join('')
}
