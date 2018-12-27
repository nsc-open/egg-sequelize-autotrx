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

TODO desc the case with code ...

## Install

```bash
$ npm i egg-sequelize-autotrx --save
```

## Usage

enable CLS of sequelize:

```js
// config.xx.js
const mySequelize = require('sequelize')
const clsNamespace = require('cls-hooked').createNamespace('your-namespace')
mySequelize.useCLS(clsNamespace)

module.exports = appInfo => {
  const config = exports = {}

  // single datasource case
  config.sequelize = {
    Sequelize: mySequelize, // use customized sequelize. https://github.com/eggjs/egg-sequelize#customize-sequelize
    dialect: '',
    // ...
  }

  // for multiple datasource, you need setup CLS of each your specific sequelize with different namespaces. https://github.com/eggjs/egg-sequelize#multiple-datasources
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

No configuration required:

```js
// {app_root}/config/config.default.js
exports.sequelizeAutotrx = {
}
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

### single datasource

```js
// controller.js
async nestedTransactionTest () {
  await this.ctx.model.transaction(async () => {
    // if any of below operations failed, will rollback all
    await this.createProject()
    await this.nestedTrx()
    await this.createUser()
  })
}

async nestedTrxCanBeExecAlone () {
  await this.nestedTrx()
}

async createProject () {
  await this.ctx.model.Project.create()
}

async createUser () {
  await this.ctx.model.User.create()
}

async nestedTrx () {
  await this.ctx.model.transaction(async () => {
    // other model operations
  })
}
```

### multiple datasource

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
