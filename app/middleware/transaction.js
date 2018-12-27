module.exports = (options, app) => async (ctx, next) => {

  console.log('my plugin', options)
  console.log('app.config', app.config)
  
  const { namespace } = app.config.sequelizeAutotrx
  const sequelizeConfig = app.config.sequelize

  if (sequelizeConfig.datasources) { // multiple datasources
    sequelizeConfig.datasources.forEach(datasource => {
      inject(ctx, getDelegate(datasource), namespace)  
    })
  } else { // single datasource
    inject(ctx, getDelegate(sequelizeConfig), namespace)
  }

  await next()
}

// refer: https://github.com/eggjs/egg-sequelize#multiple-datasources
const getDelegate = datasource => datasource.delegate || 'model'

const inject = (ctx, delegate, namespace) => {
  const model = ctx[delegate]
  const { app } = ctx

  if (!model.transaction.__injected) {
    const oldTrx = model.transaction
    model.transaction = async task => {
      let transaction = namespace.get('transaction')
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