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
    , closeIndex = !!~(closeIndex = node.indexOf('</'+this.nodeName+'>')) ? closeIndex + this.nodeName.length + 3 : 0

  nodes = nodes || []

  if (!closeIndex)
    return nodes

  nodes.push(node.slice(0, closeIndex))
  this.soFar = node.slice(closeIndex)
  return this.getNodes(nodes)
}
