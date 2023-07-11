var dotenv = require('dotenv').config();

var { Channel } = require('./objects/channel');
var { Listener } = require('./objects/channel');

var ch1 = Object.create(Channel);
ch1.init('tester');
console.log('here')