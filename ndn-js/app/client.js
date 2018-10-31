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
var Blob = require('..').Blob;
var HmacWithSha256Signature = require('..').HmacWithSha256Signature;
var KeyLocatorType = require('..').KeyLocatorType;
var KeyChain = require('..').KeyChain;
var Face = require('..').Face;
var Name = require('..').Name;
var Interest = require('..').Interest;
var Data = require('..').Data;
var UnixTransport = require('..').UnixTransport;
var config = require('..').Config;
var DataContent = require('../..').DataContent;
var tangle = require('../..').tangle;
var Crypto = require('crypto');

retryDict = {}
pendingAttaches = []
getCounter = 0

var onData = async function(interest, data) {
  name = data.getName().toUri();
  console.log("Got data packet with name " + name);
  var nameComponents = name.split("/");
  if (nameComponents[2] != 'notif' && nameComponents[2] != 'sync'){
    var key = data.getSignature().getKeyLocator().getKeyData();
    if (!(KeyChain.verifyDataWithHmacWithSha256(data, key))){
      console.log("Signature verification failed");
      tangle.close();
      face.close();
      return
    }

    getCounter -= 1;
    delete retryDict[name];

    dataContent = new DataContent();
    dataContent.populateFromJson(data.getContent().toString());

    if (await tangle.inTangle(nameComponents[3])){
      console.log("Block already exists in ledger. Discarding...");
      tangle.close();
      face.close();
      return
    }

    /* Add block to list of pending attaches */
    pendingAttaches.unshift(data);

    /* Check if branch and trunk are in Tangle or retrieve them */
    var branch = dataContent.getBranch();
    var branchPref = branch.split("/")[2];
    var branchHash = branch.split("/")[3];

    var trunk = dataContent.getTrunk();
    var trunkPref = trunk.split("/")[2];
    var trunkHash = trunk.split("/")[3];

    if (!(await tangle.inTangle(branchHash))){
      get(branchPref, branchHash)
      getCounter += 1
    }

    if (branch != trunk && !(await tangle.inTangle(trunkHash))){
      get(trunkPref, trunkHash)
      getCounter += 1
    }

    if (!(getCounter)){
      for (attachment of pendingAttaches){
        await tangle.attach(attachment)
      };

      pendingAttaches = [];
      tangle.close();
      face.close();  // This will cause the script to quit
    }
  } else {
    if (nameComponents[2] != 'sync'){
      tangle.close();
      face.close();  // This will cause the script to quit.
    }
  }
};

var onTimeout = function(interest) {
  var nameUri = interest.getName().toUri();
  console.log("Time out for interest " + nameUri);
  remainingTries = retryDict[nameUri]
  if (!(remainingTries)){
    delete retryDict[nameUri];
    if (!(Object.keys(retryDict).length)){
      tangle.close();
      face.close();
    }
    return -1;
  }
  console.log("Retrying...");
  face.expressInterest(interest, onData, onTimeout);
  retryDict[nameUri] = remainingTries - 1;
};

var retrieveMissing = function(tipsString) {
  tips = tipsString.match(/\/[^\/]+\/[^\/]+\/[^\/]+/g);
  if (tips){
    missingTips = tangle.getMissingTips(tips)
    missingTips.splice(missingTips.indexOf(block.getName()), 1)

    missingTips.forEach(function(tip){
      pref = tip.split('/')[2]
      hash = tip.split('/')[3]
      get(pref, hash)
      getCounter += 1
    });
  }
};

// Connect to the local forwarder with a Unix socket.
var face = new Face(new UnixTransport());

var sync = async function(blockHash){
  name = new Name(config.multicast_pref);
  name.append("sync");
  name.append(config.local_pref);
  name.append(blockHash);

  tips = await tangle.getTips();
  tips.forEach(function(tip){
    name.append(tip);
  });
  console.log("Sync Interest " + name.toUri());
  face.expressInterest(name, onData, onTimeout);
}

var notify = function(blockHash) {
  name = new Name(config.multicast_pref);
  name.append("notif");
  name.append(config.local_pref);
  name.append(blockHash);
  console.log("Notification Interest " + name.toUri());
  face.expressInterest(name, onData, onTimeout);
}

var get = function(notifier_pref, hash) {
  name = new Name(config.multicast_pref);
  name.append(notifier_pref);
  name.append(hash);
  console.log("Interest " + name.toUri());
  console.log("Get Block: " + hash);
  interest = new Interest(name);
  interest.setInterestLifetimeMilliseconds(config.interest_timeout);
  face.expressInterest(interest, onData, onTimeout);
  retryDict[interest.getName().toUri()] = config.num_retries;
}

var ensureTangleIsReady = function(){
  return new Promise(function(resolve, reject) {
    (function waitForTangle(){
      if (tangle.genesisHash_) return resolve();
      setTimeout(waitForTangle, 30);
    })();
  });
}

var generateBlock = async function() {
  // Generate some random block content
  let content = Math.random().toString(36).substring(7);
  let hash_ = Crypto.createHash('sha256').update(content + 
     new Date().toISOString()).digest('hex');

  var name = new Name(config.multicast_pref);
  name.append(config.local_pref);
  name.append(hash_);

  var key = new Blob(config.key);
  var block = new Data(name);
  var signature = new HmacWithSha256Signature();
  signature.getKeyLocator().setType(KeyLocatorType.KEY_LOCATOR_DIGEST);
  signature.getKeyLocator().setKeyName(new Name(config.keylocator));
  signature.getKeyLocator().setKeyData(key);

  block.setSignature(signature);
  console.log("Created block: " + name.toUri());

  var dataContent = new DataContent(content);
  block.setContent(JSON.stringify(dataContent));

  KeyChain.signWithHmacWithSha256(block, key);

  await ensureTangleIsReady();
  await sync(hash_);
  await tangle.attach(block)
  return hash_;
}

function main(){
  var arg = process.argv[2]
  if (arg == "NOTIF"){
    generateBlock().then(function(blockHash){
      notify(blockHash);
    });
  } else if (arg == "GET_BLOCK") {
    console.log(process.argv[4]);
    get(process.argv[3], process.argv[4]);
    getCounter += 1
  } else if (arg == "SYNC") {
    // Convert %2F encoding to forward slash
    // retrieve all the missing blocks recursively
    retrieveMissing(process.argv[3].replace(/%2F/g, '/'));
  }
}

main();
