var test = require('tap').test
  , fs = require('fs')
  , xmlNodes = require('../index.js')

test('xmlNodes', function(t) {
  var count = 0
  
  t.plan(1)

  fs.createReadStream(__dirname + '/../example/mrss.xml')
    .pipe(xmlNodes('item'))
    .on('data', function(data) {
      ++count
    })
    .on('end', function() {
      t.equal(count, 34, '34 items should have been emitted')
      t.end()
    })
})
  