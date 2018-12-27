module.exports = app => {
  app.config.coreMiddleware.push('transaction')
  app.loggers.coreLogger.info(`[egg-sequelize-autotrx] app.js`)
}