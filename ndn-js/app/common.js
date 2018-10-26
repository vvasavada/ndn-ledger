var os = require('os')

/* Prefix */
multicast_pref = "ledger";
local_pref = os.hostname();

module.exports = {
  multicast_pref,
  local_pref
}
