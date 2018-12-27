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

  if (!namespace) {
    throw new Error(`[egg-sequelize-autotrx] needs CLS enabled in sequelize, but CLS namespace is not found under ctx.${delegate} datasource`)
  }
  
  if (!model.transaction.__injected) {
    const oldTrx = model.transaction
    model.transaction = async (...args) => {
      if (args.length === 1) { // transaction(asyncTask)
        const task = args[0]
        const transaction = namespace.get('transaction')
        if (transaction) {
          app.loggers.coreLogger.info(`[egg-sequelize-autotrx] ctx.${delegate}.transaction specified transaction`)
          return oldTrx.call(model, { transaction }, task)
        } else {
          app.loggers.coreLogger.info(`[egg-sequelize-autotrx] ctx.${delegate}.transaction no specified transaction`)
          return oldTrx.call(model, task)
        }
      } else {
        // for example: transaction({ transaction }, asyncTask)
        // will call original transaction function directly, without inject transaction in cls
        app.loggers.coreLogger.info(`[egg-sequelize-autotrx] ctx.${delegate}.transaction call original method`)
        return oldTrx.call(model, ...args)
      }
    }
    model.transaction.__injected = true
    app.loggers.coreLogger.info(`[egg-sequelize-autotrx] ctx.${delegate}.transaction is injected`)
  }
}