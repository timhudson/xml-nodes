var Transform = require('stream').Transform
  , util = require('util')
  , buffertools = require('buffertools')

var selfClose = new Buffer('/>')
var open = new Buffer('<')

module.exports = function(nodeName) {
  return new XmlNodes(nodeName)
}

function XmlNodes(nodeName) {
  this.nodeName = nodeName
  this.openNodeBuffer = new Buffer('<'+this.nodeName+'>')
  this.openEndedNodeBuffer = new Buffer('<'+this.nodeName+' ')
  this.closeNodeBuffer = new Buffer('</'+this.nodeName+'>')
  this.buffer = new Buffer('')
  Transform.call(this)
}

util.inherits(XmlNodes, Transform)

XmlNodes.prototype._transform = function(chunk, encoding, done) {
  var nodes

  this.buffer = Buffer.concat([this.buffer, chunk])
  nodes = this.getNodes()

  for (var i = 0; i < nodes.length; i++) {
    this.push(nodes[i])
  }

  done()
}

XmlNodes.prototype.getNodes = function(nodes) {
  nodes = nodes || []

  var openingIndex = this.getOpeningIndex(this.buffer)

  if (openingIndex === -1) return nodes

  var buf = this.buffer.slice(openingIndex)
    , nestedCount = this.getNestedCount(buf)
    , closingIndex = this.getClosingIndex(buf, nestedCount)

  if (closingIndex === -1) return nodes

  nodes.push(buf.slice(0, closingIndex))
  this.buffer = buf.slice(closingIndex)

  return this.getNodes(nodes)
}

XmlNodes.prototype.getNestedCount = function(buf) {
  var openingIndex = this.getOpeningIndex(buf)
    , firstClosingIndex = buffertools.indexOf(buf, this.closeNodeBuffer)
    , currentIndex = openingIndex + 1
    , count = 0

  if (!firstClosingIndex) return false

  while (currentIndex < firstClosingIndex) {
    currentIndex = this.getOpeningIndex(buf, currentIndex + 1)

    if (currentIndex === -1) break
    if (currentIndex < firstClosingIndex) count++
  }

  return count
}

XmlNodes.prototype.getOpeningIndex = function(buf, i) {
  var withoutAttr = buffertools.indexOf(buf, this.openNodeBuffer, i)
    , withAttr = buffertools.indexOf(buf, this.openEndedNodeBuffer, i)

  if (withoutAttr > -1 && withAttr === -1) return withoutAttr
  if (withAttr > -1 && withoutAttr === -1) return withAttr
  if (withAttr === -1 && withoutAttr === -1) return -1

  return withAttr > withoutAttr ? withAttr : withoutAttr
}

XmlNodes.prototype.getClosingIndex = function(buf, nestedCount) {
  var selfCloseIndex = buffertools.indexOf(buf, selfClose)
  var isSelfClosing = selfCloseIndex >= 0 && buf[0] === 60 && selfCloseIndex < buffertools.indexOf(buf, open, 1)
  if (isSelfClosing) return selfCloseIndex + 2

  var currentIndex = buffertools.indexOf(buf, this.closeNodeBuffer)
    , currentCount = 0

  while (currentCount !== nestedCount) {
    currentIndex = buffertools.indexOf(buf, this.closeNodeBuffer, currentIndex + 1)

    if (currentIndex === -1) break
    currentCount++
  }

  if (currentIndex === -1) return currentIndex

  return currentIndex + this.nodeName.length + 3
}
