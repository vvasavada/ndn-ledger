/* Prefix */
multicast_pref = "iota";
local_pref = "local";

/* Message types */
type_notif = 1;
type_notif_reply = 2;
type_get = 3;
type_get_reply = 4;

module.exports = {
  multicast_pref,
  local_pref,

  type_notif,
  type_notif_reply,
  type_get,
  type_get_reply
}
