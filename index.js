const server = require('./lib')
const name = require('./package.json').name
require('productionize')(name)

const port = process.env.PORT || 7000
server().listen(port)
console.log(name, process.env.NODE_ENV + ' server listening on port', port)
