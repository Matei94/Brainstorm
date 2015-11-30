/*** REQUIRES ****************************************************************/

var express = require('express');
var Firebase = require("firebase");
var randomstring = require("randomstring");

/*****************************************************************************/



/*** VARIABLES ***************************************************************/

var firebaseURL = "https://matei.firebaseio.com/";
var firebaseRef = new Firebase(firebaseURL);
var sessions = [];

/*****************************************************************************/



/*** SERVER BEHAVIOUR ********************************************************/

var app = express();
app.use(express.static('public'));

app.set('port', (process.env.PORT || 5000));

/* Main page */
app.get('/', function(req, res) {
  res.sendFile(__dirname + "/" + "brainPage.html" );
});

app.get('/:id', function(req, res) {
  /* Get new session */
  if (req.params.id == "session") {
    var sessionId = randomstring.generate({
      length: 12,
      charset: 'alphabetic'
    });
    sessions.push(sessionId);
    res.send(sessionId);
  }

  /* Join session */
  else {
    if (sessions.indexOf(req.params.id) != -1) {
      res.sendFile(__dirname + "/" + "brainPage.html" );
    } else {
      res.send("404 Not found");
    }
  }
});

/* Database cleaning */
firebaseRef.remove(function(err) {
  if (err) {
    console.log("Database cleaning error: " + err);
  } else {
    console.log("Database cleaning success");
  }
});

/* Start server */
var server = app.listen(app.get('port'), function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Server is up and running at http://%s:%s", host, port);
})

/*****************************************************************************/
