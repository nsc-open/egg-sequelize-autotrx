# egg-sequelize-autotrx

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-sequelize-autotrx.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-sequelize-autotrx
[travis-image]: https://img.shields.io/travis/eggjs/egg-sequelize-autotrx.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-sequelize-autotrx
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-sequelize-autotrx.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-sequelize-autotrx?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-sequelize-autotrx.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-sequelize-autotrx
[snyk-image]: https://snyk.io/test/npm/egg-sequelize-autotrx/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-sequelize-autotrx
[download-image]: https://img.shields.io/npm/dm/egg-sequelize-autotrx.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-sequelize-autotrx

This plugin helps to do transaction auto pass down and solve the nested transaction issue.

## Problems

After CLS enabled, nested transaction will have unexpected result:

```js
async nestedTrx () {
  await this.ctx.model.transaction(async () => {
    await this.ctx.model.M1.create()
    await this.ctx.model.transaction(async () => {
      await this.ctx.model.M2.create()
      await this.ctx.model.M3.create()
    })
    await this.ctx.model.M4.create()
  })
}
```

If error throw out from M4 creation, transaction will rollback creation for M1 and M4. M2 and M3 will be committed. To make all the operations commit and rollback together through out all the transactions, you need help from this plugin.

Internally, this plugin solves the problem by passing parent transaction down to the child transaction:

```js
async nestedTrx () {
  await this.ctx.model.transaction(async parentTrx => {
    await this.ctx.model.M1.create()
    await this.ctx.model.transaction({ transaction: parentTrx }, async () => {
      await this.ctx.model.M2.create()
      await this.ctx.model.M3.create()
    })
    await this.ctx.model.M4.create()
  })
}
```

## Install

```bash
$ npm i egg-sequelize-autotrx --save
```

## Usage

You need to use egg-sequelize plugin first, and have it CLS enabled with cls-hooked:

### single datasource

```js
// config.xx.js
const mySequelize = require('sequelize')
const clsNamespace = require('cls-hooked').createNamespace('your-namespace')
mySequelize.useCLS(clsNamespace)

module.exports = appInfo => {
  const config = exports = {}

  // use customized sequelize. https://github.com/eggjs/egg-sequelize#customize-sequelize
  config.sequelize = {
    Sequelize: mySequelize, 
    dialect: 'mysql',
    // ...
  }
}
```

### multiple datasource

```js
// config.xx.js
const mySequelize = require('sequelize')
const clsNamespace = require('cls-hooked').createNamespace('your-namespace')

// create multiple namespaces for multiple customized sequelize
mySequelize.useCLS(clsNamespace)

module.exports = appInfo => {
  const config = exports = {}

  // for multiple datasource, you need setup CLS of each your specific sequelize with different namespaces. https://github.com/eggjs/egg-sequelize#multiple-datasources
  config.sequelize = {
    Sequelize: mySequelize,
    datasources: [{
      delegate: 'model1',
      dialect: 'mysql'
      // ...
    }, {
      delegate: 'model2',
      dialect: 'mysql'
      // ...
    }]
  }
```

enable sequelize-autotrx plugin:

```js
// {app_root}/config/plugin.js
exports.sequelizeAutotrx = {
  enable: true,
  package: 'egg-sequelize-autotrx',
}
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.sequelizeAutotrx = {
  // no config required here
}
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

Let's see a real case:

```js
// controller.js
async nestedTransactionTest () {
  await this.ctx.model.transaction(async () => {
    await this.ctx.model.Project.create()
    await this.innerTrx()
    await this.ctx.model.User.create()
  })
}

async innerTrxCanBeExecAlone () {
  await this.nestedTrx()
}

// this transaction can be execute alone, and also can be nested into another transaction
async innerTrx () {
  await this.ctx.model.transaction(async () => {
    // other model operations
  })
}
```

If you need your nested transaction commit by itself, you can do:

```js
async innerTrx () {
  await this.ctx.model.transaction({ transaction: null }, async () => {
    // specify the transaction as null, so it will not populated from parent transaction from cls
  })
}
```

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
