/**
 * Project object on another object
 */

module.exports = template => {
  const fields = Object.entries(template).map(([key, extract]) => [
    key,
    typeof extract === 'string' ? extract : key,
  ])

  return obj =>
    fields.reduce(
      (target, [key, prop]) => ((target[key] = obj[prop]), target),
      {}
    )
}
