var Database = require('../..').Database
var Common = require('../..').Common

/**
 * This class represents Tangle. 
 */

var Tangle = function Tangle()
{
  this.db_ =  new Database()

  /* Attach genesis */
  genesisHash = Common.genesisHash

  this.db_.putContent(genesisHash, '')
  this.db_.putWeight(genesisHash, 1)
  this.db_.putApprovers(genesisHash, [1])

  Common.tips.push(genesisHash)
}

/**
 * Tip Selection Algorithm
 * @return {String} Hash of selected tip
 */
tipSelection = function(db)
{
  current = Common.genesisHash
  while (!(Common.tips.includes(current))){
    approvers = db.getApprovers(current)
    weights = []
    for (approver in approvers){
      weights.push(db.getWeight(approver))
    }

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

/**
 * Attach block to the Tangle, that is,
 * write it to leveldb
 * @param {Block} block The block to be attached
 */
Tangle.prototype.attach = function(block)
{
  return
  hash = block.getHash().digest('hex')

  this.db_.putContent(hash, block.getContent().buf().toString())
  this.db_.putWeight(hash, 1)
  this.db_.putApprovers(hash, [])

  var branchHash = null
  var trunkHash = null

  /** If block was produced by this node */
  if (!(block.branchHash || block.trunkHash)){
    /**
      * Tip selection
      * We perform MC random walk from genesis to tips
      * Probability of node i being chosen = W_i/W_total
      */
    branchHash = tipSelection(this.db_)
    trunkHash = tipSelection(this.db_)
  } else {
    branchHash = block.branchHash.read().toString('hex')
    trunkHash = block.trunkHash.read().toString('hex')
  }

  /**
    * Update these branch and trunk
    */
  this.db_.putWeight(branchHash, this.db_.getWeight(branchHash) + 1)

  approvers = this.db_.getApprovers(branchHash)
  approvers.push(hash)
  this.db_.putApprovers(branchHash, approvers)

  if (branchHash != trunkHash){
    this.db_.putWeight(trunkHash, this.db_.getWeight(trunkHash) + 1)

    approvers = this.db_.getApprovers(trunkHash)
    approvers.push(hash)
    this.db_.putApprovers(trunkHash, approvers)
  }

}

tangle = new Tangle()
exports.tangle = tangle
