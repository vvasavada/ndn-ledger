var Database = require('../..').Database
var DataContent = require('../..').DataContent
var Crypto = require('crypto')
var dbExists = require('../..').dbExists
var Data = require('../..').ndnjs.Data
var Name = require('../..').ndnjs.Name;
var EncodingUtils = require('../..').ndnjs.EncodingUtils;

/**
 * This class represents Tangle. 
 */

var Tangle = function Tangle()
{
  this.db_ =  null
  this.tips_ = null
  this.genesisHash_ = null
}

Tangle.prototype.populate = function(){
  this.db_ = new Database()
  if (!(dbExists)){
    /* Attach genesis */

    var genesisContent = new DataContent('genesisBlock');
    this.genesisHash_ = Crypto.createHash('sha256').update('genesisBlock').digest('hex');
    
    var name = new Name('ledger');
    name.append('ledger');
    name.append(this.genesisHash_);

    var genesis = new Data(name)
    console.log('Created Block: ' + name.toUri());
    genesis.setContent(JSON.stringify(genesisContent));

    this.db_.putBlock(this.genesisHash_, EncodingUtils.encodeToHexData(genesis));
    this.db_.putWeight(this.genesisHash_, 1)
    this.db_.putApprovers(this.genesisHash_, [])
    
    /* Initialize tips */
    let genesisName = name.toUri();
    this.tips_ = [ genesisName ]

    // Startup details are [genesisHash, Tips*]
    var startupDetails = [this.genesisHash_, genesisName ]
    this.db_.putStartupDetails(startupDetails)
  } else {
    var startupDetailsFunc = this.db_.getStartupDetails()
    startupDetailsFunc.then(function(startupDetails){
      startupDetails = [...startupDetails.toString().split(',')]
      tangle.genesisHash_ = startupDetails[0]
      tangle.tips_ = startupDetails.slice(1)
    })
  }
}

/**
 * Update Approvers
 */
Tangle.prototype.updateApprovers = async function(approveeHash, approver)
{
  var approvers = await this.db_.getApprovers(approveeHash);
  approvers = [...approvers.toString().split(',').filter((val)=>val)]
  approvers.push(approver)
  tangle.db_.putApprovers(approveeHash, approvers)
}

/**
 * Update weight
 */
Tangle.prototype.updateWeight = async function(hash)
{
  var weight = await this.db_.getWeight(hash)
  weight = parseInt(weight, 10);
  weight += 1;
  tangle.db_.putWeight(hash, weight)
}

/**
 * Update weights
 * @param {String} hash Hash of first block in the chain
 */
Tangle.prototype.updateWeights = async function(hash, visited)
{
  visited.add(hash)
  if (hash == this.genesisHash_){
    return
  }
 
  var branchCurrent = await this.db_.getBranch(hash)
  var branchHash = branchCurrent.split("/")[3]
  if (!(visited.has(branchHash))){
    await this.updateWeight(branchHash)
    await this.updateWeights(branchHash, visited)
  }

  var trunkCurrent = await this.db_.getTrunk(hash)
  var trunkHash = trunkCurrent.split("/")[3]
  if (trunkHash != branchHash && !(visited.has(trunkHash))){
    await this.updateWeight(trunkHash)
    await this.updateWeights(trunkHash, visited)
  }
}

/**
 * Tip Selection Algorithm
 * @return {String} Hash of selected tip
 */
tipSelection = async function(db, genesis, tips)
{
  var current = genesis
  while (!(tips.includes(current))){
    current = current.split("/")[3];
    var approvers = await db.getApprovers(current)
    approvers = [...approvers.toString().split(',')]
    var weights = []
    for (approver of approvers){
      var weight = await db.getWeight(approver.split("/")[3]);
      weight = parseInt(weight, 10);
      weights.push(weight);
    }
    
    selectedApprover = null

    /* Weighted selection of random number */
    var cumWeights = []
    cumWeights[0] = weights[0]
    for (i = 1; i < weights.length; i++){
      cumWeights[i] = weights[i-1] + weights[i]
    }
    
    var min = cumWeights[0]
    var max = cumWeights[cumWeights.length - 1]
    randInt = Math.floor(Math.random() * (max - min + 1)) + min;

    var bisected = false
    for (i = 0; i < cumWeights.length; i++){
      if (randInt < cumWeights[i]){
        selectedApprover = approvers[i]
        bisected = true
        break;
      }
    }

    if (!(bisected)) {
      selectedApprover = approvers[approvers.length - 1]
    }

    current = selectedApprover
  }

  return current
}

/** Check if block in Tangle
 * param {String} hash Check if hash is in tangle
 * return {Boolean} return True if block is in Tangle
 */
Tangle.prototype.inTangle = async function(hash)
{
  try{
    await this.db_.getBlock(hash);
  } catch (error) {
      if (error.notFound) {
        return false
      }
    throw error
  }

  return true
}

/** Sync the Tangle
 * @param {Array} tips Tips received
 */
Tangle.prototype.getMissingTips = function(receivedTips)
{
  return receivedTips.filter(function(x) { return tangle.tips_.indexOf(x) < 0 })
}

/**
 * Attach block to the Tangle, that is,
 * write it to leveldb
 * @param {Data} block The block to be attached
 */
Tangle.prototype.attach = async function(block)
{
  let blockName = block.getName().toUri();
  hash = blockName.split('/')[3]; 
  dataContent = new DataContent();
  dataContent.populateFromJson(block.getContent().toString());

  console.log("Attaching " + hash + " to the tangle");

  this.db_.putWeight(hash, 1)
  this.db_.putApprovers(hash, [])

  var branch = null
  var trunk = null

  /** If block was produced by this node */
  if (!(dataContent.getBranch() || dataContent.getTrunk())){
    /**
      * Tip selection
      * We perform MC random walk from genesis to tips
      * Probability of node i being chosen = W_i/W_total
      */
    genesis = "/ledger/ledger/" + this.genesisHash_
    branch = await tipSelection(this.db_, genesis, this.tips_)
    trunk = await tipSelection(this.db_, genesis, this.tips_)

    dataContent.setBranch(branch)
    dataContent.setTrunk(trunk)

    block.setContent(JSON.stringify(dataContent));
  } else {
    branch = dataContent.getBranch()
    trunk = dataContent.getTrunk()
  }

  this.db_.putBlock(hash, EncodingUtils.encodeToHexData(block))


  this.db_.putBranch(hash, branch)
  this.db_.putTrunk(hash, trunk)
  
  /**
    * Update these branch and trunk
    */
  var branchHash = branch.split("/")[3]
  await this.updateWeight(branchHash)
  await this.updateWeights(branchHash, new Set([]))
  await this.updateApprovers(branchHash, blockName)

  var trunkHash = trunk.split("/")[3]
  if (branch != trunk){
    await this.updateWeight(trunkHash)
    await this.updateWeights(trunkHash, new Set([]))
    await this.updateApprovers(trunkHash, blockName)
  }

  this.tips_.push(blockName)
  if (this.tips_.includes(branch)){
    this.tips_.splice(this.tips_.indexOf(branch), 1);
  }

  if (this.tips_.includes(trunk)){
    this.tips_.splice(this.tips_.indexOf(trunk), 1);
  }

  details = [this.genesisHash_].concat(this.tips_)
  this.db_.putStartupDetails(details)
}

/**
 * Get block from the Tangle, that is,
 * read it from leveldb
 * @param {String} hash Hash of the block to be fetched
 * @return {Block} The block fetched
 */
Tangle.prototype.fetch = async function(hash)
{
  block = await this.db_.getBlock(hash)

  return block
}

/**
 * Get Tangle tips
 * @return {Array} Tips
 */
Tangle.prototype.getTips = async function()
{
  tips = await this.db_.getStartupDetails()
  tips = [...tips.toString().split(',')].slice(1)
  this.tips_ = tips
  return tips
}

/**
 * Close Database connection
 */
Tangle.prototype.close = function()
{
  this.db_.close();
}

tangle = new Tangle()
tangle.populate()
exports.tangle = tangle
