// server.js
// set up express and starting point server
var http = require('http');
var express = require('express');
var app = express();

var bodyParser = require('body-parser');

var config = require('./app/config/pushconfig'); // get our config file
var port = process.env.PORT || config.port;
var renv = process.env.NODE_ENV || config.env;

//var logger = require('./app/config/logger').logger;

console.log("Rutime env =" + renv);

// set your payload limit to 50mb

app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));


app.use(bodyParser.json({ limit: '50mb' }));

// use morgan to log requests to the console
//app.use(logger);
//app.use(require("morgan")("combined", { stream: logger.stream }));

// CORS

// Cross Domain Origin Setup
var methodOverride = require('method-override')
app.use(methodOverride());
var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

app.use(allowCrossDomain);

//scoket io server


var server = http.createServer(app);
//var socketio = require('socket.io');
//var io = socketio.listen(server);




// routes ======================================================================

//require('./app/signup.js')(app,io,signuppassport);
require('./app/routes.js')(app); // load our routes and pass in our app and fully configured passport


app.use(function (err, req, res, next) {

 console.log("error", "ROUTERROR", " routeinvocation errored " + JSON.stringify(err));
  res.status(err.status || 500);
  res.status(err.status || 500).json({
    message: err.message,
    error: err
  });
});


// launch ======================================================================
//app.listen(port);

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
  var addr = server.address();
  console.log("** **** ****** WIZE Notification Gateway Server Started. Serving at " + addr.address + ":" + addr.port + " Env : " + renv);

});



function graceful() {
  var now = new Date();
  console.log("!!!!!!!!!!!!!!!!WIZE Notification Gateway Server going down. Shutting down at " + now.toString() + " Env : " + renv);


  process.exit(0);

}

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);
process.on('unhandledRejection', function (reason, promise) {
  console.log('Unhandled rejection', { reason: reason, promise: promise });
});
//console.log('The magic happens on port ' + port);
