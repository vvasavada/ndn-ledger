var os = require('os')

/* Prefix */
multicast_pref = "ledger-multicast";
local_pref = os.hostname();

module.exports = {
  multicast_pref,
  local_pref
}
