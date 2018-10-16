var Database = require('../..').Database
var Block = require('../..').Block
var Crypto = require('crypto')
var dbExists = require('../..').dbExists

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
    var genesis = new Block('ledger', 'genesisBlock', genesis=true)
    this.genesisHash_ = genesis.getHash()

    this.db_.putBlock(this.genesisHash_, JSON.stringify(genesis))
    this.db_.putWeight(this.genesisHash_, 1)
    this.db_.putApprovers(this.genesisHash_, [])
    
    /* Initialize tips */
    this.tips_ = [ genesis.getName() ]

    // Startup details are [genesisHash, Tips*]
    startupDetails = [this.genesisHash_, genesis.getName() ]
    this.db_.putStartupDetails(startupDetails)
  } else {
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
Tangle.prototype.updateApprovers = async function(approveeHash, approver)
{
  approvers = await this.db_.getApprovers(approveeHash);
  approvers = [...approvers]
  approvers.push(approver)
  tangle.db_.putApprovers(approveeHash, approvers)
}

/**
 * Update weight
 */
Tangle.prototype.updateWeight = function(hash)
{
  weightFunc = this.db_.getWeight(hash)
  weightFunc.then(function(weight){
    weight += 1
    tangle.db_.putWeight(hash, weight)
  });
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
tipSelection = async function(db, genesis, tips)
{
  current = genesis
  while (!(tips.includes(current))){
    current = current.split("/")[2]
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
 * @param {Block} block The block to be attached
 */
Tangle.prototype.attach = async function(block)
{
  hash = block.getHash()

  console.log("Attaching " + hash + " to the tangle");

  this.db_.putWeight(hash, 1)
  this.db_.putApprovers(hash, [])

  var branch = null
  var trunk = null

  /** If block was produced by this node */
  if (!(block.getBranch() || block.getTrunk())){
    /**
      * Tip selection
      * We perform MC random walk from genesis to tips
      * Probability of node i being chosen = W_i/W_total
      */
    genesis = "/ledger-multicast/" + this.genesisHash_
    branch = await tipSelection(this.db_, genesis, this.tips_)
    trunk = await tipSelection(this.db_, genesis, this.tips_)

    block.setBranch(branch)
    block.setTrunk(trunk)
  } else {
    branch = block.getBranch()
    trunk = block.getTrunk()
  }

  this.db_.putBlock(hash, JSON.stringify(block))


  this.db_.putBranch(hash, branch)
  this.db_.putTrunk(hash, trunk)
  
  /**
    * Update these branch and trunk
    */
  branchHash = branch.split("/")[2]
  this.updateWeight(branchHash)
  this.updateWeights(branchHash, [])
  await this.updateApprovers(branchHash, block.getName())

  trunkHash = trunk.split("/")[2]
  if (branch != trunk){
    this.updateWeight(trunkHash)
    this.updateWeights(trunkHash, [])
    await this.updateApprovers(trunkHash, block.getName())
  }

  this.tips_.push(block.getName())
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
