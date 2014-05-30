var Transform = require('stream').Transform
  , util = require('util')

module.exports = function(nodeName) {
  return new XmlNodes(nodeName)
}

function XmlNodes(nodeName) {
  this.nodeName = nodeName
  this.soFar = ''
  this.openBracketRegex = new RegExp('<(?=' + this.nodeName + ')')
  this.startsWithNodeName = new RegExp('^' + this.nodeName)
  Transform.call(this)
}

util.inherits(XmlNodes, Transform)

XmlNodes.prototype._transform = function(chunk, encoding, done) {
  var nodes

  this.soFar += String(chunk)
  nodes = this.getNodes()

  for (var i = nodes.length - 1; i >= 0; i--) {
    this.push(nodes[i])
  }

  done()
}

XmlNodes.prototype.getNodes = function(nodes) {
  var node = this.soFar.slice(this.soFar.indexOf('<'+this.nodeName))
    , nestedCount = this.getNestedCount(node)
    , closeIndex = this.getClosingIndex(node, nestedCount)

  nodes = nodes || []

  if (!~closeIndex)
    return nodes

  nodes.push(node.slice(0, closeIndex))
  this.soFar = node.slice(closeIndex)
  return this.getNodes(nodes)
}

XmlNodes.prototype.getNestedCount = function(node) {
  var closingIndex = node.indexOf('</'+this.nodeName+'>')
    , currentIndex = 1
    , count = 0

  while (currentIndex < closingIndex) {
    currentIndex = node.indexOf('<'+this.nodeName, currentIndex + 1)

    if (currentIndex === -1) break
    if (currentIndex < closingIndex) count++
  }

  return count
}

XmlNodes.prototype.getClosingIndex = function(node, nestedCount) {
  var currentIndex = node.indexOf('</'+this.nodeName+'>')
    , currentCount = 0

  while (currentCount !== nestedCount) {
    currentIndex = node.indexOf('</'+this.nodeName+'>', currentIndex + 1)

    if (currentIndex === -1) break
    currentCount++
  }

  if (currentIndex === -1) return currentIndex

  return currentIndex + this.nodeName.length + 3
}
