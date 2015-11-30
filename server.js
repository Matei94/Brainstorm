/*** REQUIRES ****************************************************************/

var express = require('express');
var Firebase = require("firebase");

/*****************************************************************************/



/*** VARIABLES ***************************************************************/

var firebaseURL = "https://matei.firebaseio.com/";
var firebaseRef = new Firebase(firebaseURL);

/*****************************************************************************/



/*** SERVER BEHAVIOUR ********************************************************/

var app = express();
app.use(express.static('public'));

app.set('port', (process.env.PORT || 5000));

/* Main page */
app.get('/', function(req, res) {
  res.sendFile(__dirname + "/" + "index.html" );
});

/* Clear database */
firebaseRef.remove(function(err) {
  if (err) {
    console.log("error: " + err);
  } else {
    console.log("Success");
  }
});

/* Start server */
var server = app.listen(app.get('port'), function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Server is up and running at http://%s:%s", host, port);
})

/*****************************************************************************/
