var os = require('os')

var config = {}

/* Prefix */
config.multicast_pref = "ledger";
config.local_pref = os.hostname();

/* Timeouts */
config.interest_timeout = 4000;
config.num_retries = 5;

/* Security */
config.key = "testkey"
config.keylocator = "testkey1"

module.exports = config;
