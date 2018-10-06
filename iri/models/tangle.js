var Database = require('../..').Database
var Block = require('../..').Block
var Crypto = require('crypto')
var fs = require('fs')


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
  if (!(fs.existsSync('database'))){
    this.db_ = new Database()

    /* Attach genesis */
    var genesis = new Block('iota', 'genesisBlock', genesis=true)
    this.genesisHash_ = genesis.getHash()

    this.db_.putBlock(this.genesisHash_, genesis)
    this.db_.putWeight(this.genesisHash_, 1)
    this.db_.putApprovers(this.genesisHash_, [])
    
    /* Initialize tips */
    this.tips_ = [ this.genesisHash_ ]

    // Startup details are [genesisHash, Tips*]
    startupDetails = [this.genesisHash_, this.genesisHash_]
    this.db_.putStartupDetails(startupDetails)
  } else {
    this.db_ = new Database()

    startupDetailsFunc = this.db_.getStartupDetails()
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
Tangle.prototype.updateApprovers = function(approveeHash, approver)
{
  approversFunc = this.db_.getApprovers(approveeHash)
  approversFunc.then(function(approvers){
    approvers = [...approvers]
    approvers.push(approver)
    tangle.db_.putApprovers(approveeHash, approvers)
  })
}

/**
 * Update weight
 */
Tangle.prototype.updateWeight = function(hash)
{
  weightFunc = this.db_.getWeight(hash)
  weightFunc.then(function(weight){
    weight = weight + 1
    tangle.db_.putWeight(hash, weight)
  })
}

/**
 * Update weights
 * @param {String} hash Hash of first block in the chain
 */
Tangle.prototype.updateWeights = async function(hash, visited)
{
  visited.push(hash)
  if (hash == this.genesisHash_){
    return
  }
 
  branchCurrent = await this.db_.getBranch(hash)
  if (!(branchCurrent in visited)){
    branchHash = branchCurrent.split("/")[2]
    this.updateWeight(branchHash)
    this.updateWeights(branchHash, visited)
  }

  trunkCurrent = await this.db_.getTrunk(hash)
  if (trunkCurrent != branchCurrent && !(trunkCurrent in visited)){
    trunkHash = trunkCurrent.split("/")[2]
    this.updateWeight(trunkHash)
    this.updateWeights(trunkHash, visited)
  }
}

/**
 * Tip Selection Algorithm
 * @return {String} Hash of selected tip
 */
tipSelection = async function(db, genesisHash, tips)
{
  current = genesisHash
  while (!(tips.includes(current))){
    approvers = await db.getApprovers(current)
    approvers = [...approvers.toString().split(',')]
    weights = []
    approvers.forEach(function(approver){
      weights.push(db.getWeight(approver.split("/")[2]))
    });

    selectedApprover = null

    /* Weighted selection of random number */
    cumWeights = []
    cumWeights[0] = weights[0]
    for (i = 1; i < weights.length; i++){
      cumWeights[i] = weights[i-1] + weights[i]
    }

    min = cumWeights[0]
    max = cumWeights[cumWeights.length - 1]
    randInt = Math.floor(Math.random() * (max - min + 1)) + min;

    bisected = false
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

  if (current == genesisHash) {
    current = "/iota/" + genesisHash;
  }

  return current
}

/** Sync the Tangle
 * @param {Array} tips Tips received
 */
Tangle.prototype.sync = function(receivedTips)
{
  var receivedSet = new Set(receivedTips)

}

/**
 * Attach block to the Tangle, that is,
 * write it to leveldb
 * @param {Block} block The block to be attached
 */
Tangle.prototype.attach = async function(block)
{
  hash = block.getHash()

  this.db_.putBlock(hash, block)
  this.db_.putWeight(hash, 1)
  this.db_.putApprovers(hash, [])

  var branch = null
  var trunk = null

  /** If block was produced by this node */
  if (!(block.branch || block.trunk)){
    /**
      * Tip selection
      * We perform MC random walk from genesis to tips
      * Probability of node i being chosen = W_i/W_total
      */
    branch = await tipSelection(this.db_, this.genesisHash_, this.tips_)
    trunk = await tipSelection(this.db_, this.genesisHash_, this.tips_)
  } else {
    branch = block.branch
    trunk = block.trunk
  }

  this.db_.putBranch(hash, branch)
  this.db_.putTrunk(hash, trunk)

  /**
    * Update these branch and trunk
    */
  branchHash = branch.split("/")[2]
  this.updateWeight(branchHash)
  this.updateWeights(branchHash, [])
  this.updateApprovers(branchHash, block.getName())

  trunkHash = trunk.split("/")[2]
  if (branch != trunk){
    this.updateWeight(trunkHash)
    this.updateWeights(trunkHash, [])
    this.updateApprovers(trunkHash, block.getName())
  }

  this.tips_.push(hash)
  if (this.tips_.includes(branchHash)){
    this.tips_.splice(this.tips_.indexOf(branchHash), 1);
  }

  if (this.tips_.includes(trunkHash)){
    this.tips_.splice(this.tips_.indexOf(trunkHash), 1);
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
