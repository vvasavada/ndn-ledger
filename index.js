exports.ndnjs = require('./ndn-js/index.js');
exports.DataContent = require('./ledger/models/datacontent.js').DataContent;
exports.Database = require('./ledger/storage/db-client.js').Database;
exports.dbExists = require('./ledger/storage/db-server.js').dbExists;
exports.tangle = require('./ledger/models/tangle.js').tangle;
