'use strict';

const mock = require('egg-mock');

describe('test/sequelize-autotrx.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/sequelize-autotrx-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, sequelizeAutotrx')
      .expect(200);
  });
});
