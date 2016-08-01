var express = require('express');
var fs = require('fs');
var path = require('path');

var config = require('./config.js').load();

var app = express();


app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(config.port, function () {
  console.log(`Serving on port ${config.port}`);
});