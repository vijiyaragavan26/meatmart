const path = require('path');
let app;
try {
  app = require('../server/dist/index.js');
} catch (e) {
  try {
    app = require('./server/dist/index.js');
  } catch (e2) {
    app = require(path.join(process.cwd(), 'server', 'dist', 'index.js'));
  }
}
module.exports = app.default || app;
