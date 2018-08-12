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
var UnixTransport = require('..').UnixTransport;

var common = require('..').Common

var onData = function(interest, data) {
  console.log("Got data packet with name " + data.getName().toUri());
  console.log(data.getContent().buf().toString('binary'));

  face.close();  // This will cause the script to quit.
};

var onTimeout = function(interest) {
  console.log("Time out for interest " + interest.getName().toUri());
  face.close();  // This will cause the script to quit.
};

// Connect to the local forwarder with a Unix socket.
var face = new Face(new UnixTransport());

var notify = function() {
  name = new Name(common.multicast_pref);
  name.append(common.local_pref);
  name.append(common.type_notif);
  name.append("1");
  console.log("Interest " + name.toUri());
  console.log("Notifying transaction: 1");
  face.expressInterest(name, onData, onTimeout);
}


notify();
