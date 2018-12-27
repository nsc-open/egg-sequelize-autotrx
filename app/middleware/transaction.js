module.exports = (options, app) => async (ctx, next) => {
  const sequelizeConfig = app.config.sequelize

  if (sequelizeConfig.datasources) { // multiple datasources
    app.loggers.coreLogger.info(`[egg-sequelize-autotrx] multiple database case`)
    sequelizeConfig.datasources.forEach(datasource => {
      inject(ctx, getDelegate(datasource))  
    })
  } else { // single datasource
    app.loggers.coreLogger.info(`[egg-sequelize-autotrx] single database case`)
    inject(ctx, getDelegate(sequelizeConfig))
  }

  await next()
}

// refer: https://github.com/eggjs/egg-sequelize#multiple-datasources
const getDelegate = datasource => datasource.delegate || 'model'

const inject = (ctx, delegate) => {
  const { app } = ctx
  const model = ctx[delegate]

  // https://github.com/sequelize/sequelize/blob/master/lib/sequelize.js#L1044
  // namespace has to get from _cls, otherwise it will have issue for multiple datasources case
  const namespace = model.constructor._cls
  
  if (!model.transaction.__injected) {
    const oldTrx = model.transaction
    model.transaction = async task => {
      const transaction = namespace.get('transaction')
      if (transaction) {
        app.loggers.coreLogger.info(`[egg-sequelize-autotrx] ctx.[${delegate}].transaction call injected transaction method`)
        return oldTrx.call(model, { transaction }, task)
      } else {
        app.loggers.coreLogger.info(`[egg-sequelize-autotrx] ctx.[${delegate}].transaction call original transaction method`)
        return oldTrx.call(model, task)
      }
    }
    model.transaction.__injected = true
    app.loggers.coreLogger.info(`[egg-sequelize-autotrx] ctx.[${delegate}].transaction is injected`)
  }
}