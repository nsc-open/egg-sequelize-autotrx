module.exports = (options, app) => async (ctx, next) => {
  console.log('my plugin', options)
  await next()
}