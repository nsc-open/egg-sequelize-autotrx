const assert = require('assert')

module.exports = app => {
  const index = app.config.coreMiddleware.indexOf('sequelize')

  // egg-sequelize is required
  assert(index >= 0, 'sequelize plugin is required')

  // put this plugin after egg-sequelize
  app.config.coreMiddleware.splice(index + 1, 0, 'sequelizeAutotrx')
}