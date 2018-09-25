/*
 * Copyright (C) 2014-2018 Regents of the University of California.
 * @author: Jeff Thompson <jefft0@remap.ucla.edu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * A copy of the GNU Lesser General Public License is in the file COPYING.
 */

var readline = require('readline');
var Face = require('..').Face;
var Name = require('..').Name;
var Interest = require('..').Interest;
var Data = require('..').Data;
var UnixTransport = require('..').UnixTransport;
var common = require('..').Common
var Block = require('../..').Block

var onData = function(interest, data, close=false) {
  console.log("Got data packet with name " + data.getName().toUri());
  //console.log(data.getContent().buf().toString('binary'));

  face.close();  // This will cause the script to quit.
};

var onTimeout = function(interest) {
  console.log("Time out for interest " + interest.getName().toUri());
  face.close();  // This will cause the script to quit.
};

// Connect to the local forwarder with a Unix socket.
var face = new Face(new UnixTransport());

var notify = function(blockHash) {
  name = new Name(common.multicast_pref);
  name.append(common.local_pref);
  name.append(common.type_notif.toString());
  name.append(blockHash.digest('hex'));
  console.log("Notification Interest " + name.toUri());
  face.expressInterest(name, onData, onTimeout);
}

var get = function(notifier_pref, hash) {
  name = new Name(notifier_pref);
  name.append(hash)
  console.log("Interest " + name.toUri());
  console.log("Get Block: " + hash);
  face.expressInterest(name, onData, onTimeout);
}

var generateBlock = function() {
  
  /* create random interest and data pair */
  let r = Math.random().toString(36).substring(7)
  name = new Name(common.local_pref)
  name.append(r)
  interest = new Interest(name)
  data = new Data(name, r)

  block = new Block( interest, data )
  return block.getHash();
}

var arg = process.argv[2]
if (arg == "NOTIF"){
  blockHash = generateBlock();
  notify(blockHash);
} else if (arg == "GET_BUNDLE") {
  get(process.argv[3], process.argv[4]);
}
