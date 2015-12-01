/*** VARIABLES ***************************************************************/

var username;

var textEditorReady = false;

/*****************************************************************************/



/*** DOCUMENT READY **********************************************************/

$(document).ready(function() {
  var sessionId = window.location.pathname.substring(1);
  if (sessionId.length > 0) {
    onSessionId(sessionId);
  } else {
    $.get("/session", onSessionId);
  }
});

/*****************************************************************************/



/*** FUNCTIONS ***************************************************************/

function addOnlineUser(username) {
  $('<div>').text(username).prepend($('<em/>').text('')).appendTo($('#online'));
  $('#online')[0].scrollTop = $('#online')[0].scrollHeight;
}


function setUsername() {
  username = prompt("Enter your name here (at least 4 characters)");
}


function collapseChat() {
  $(".chat-header").click(function() {
    $(".chat-content").slideToggle(500);
  });
}


function onSessionId(sessionId) {
  var pathname = window.location.pathname;
  if (pathname == '/') {
    $('#shareLink').attr("href", window.location.href + sessionId);
    $('#shareLink').text(window.location.href + sessionId);
  } else {
    $('#shareLink').attr("href", window.location.href);
    $('#shareLink').text(window.location.href);
  }

  collapseChat();
  setUsername();

  setOnlineUsers(sessionId);
  setTextEditor(sessionId);
  showWhiteboard();
  draw();
  setChat(sessionId);
}
function setOnlineUsers(sessionId) {
  var onlineUsersRef = new Firebase('https://matei.firebaseio.com/' + sessionId + "/users");
  onlineUsersRef.on('child_added', function (snapshot) {
    var data = snapshot.val();
    var username = data.username || "anonymous";

    addOnlineUser(username);
  });

  onlineUsersRef.on('child_removed', function (snapshot) {
    var data = snapshot.val();
    var username = data.username || "anonymous";

    alert(username + " disconnected")
  });

  var userRef = onlineUsersRef.push({username: username});
  userRef.onDisconnect().remove();
}
function setTextEditor(sessionId) {
    
        $("#tab1").click(function() {
            if (textEditorReady == false) {
                textEditorReady = true;
                var firepadRef = new Firebase('https://matei.firebaseio-demo.com/'+ sessionId + "/text");
                var codeMirror = CodeMirror(document.getElementById('feature'),
                { lineWrapping: true });
                var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
                { richTextToolbar: true, richTextShortcuts: true });
            }    
            $("#whiteboard").css("z-index", 0);
            $("#canvas").css("z-index", 0);
            $("#colorPicker").css("z-index", 0);
            $("#feature").css("z-index", 10);
            
            
            $("#canvas").css("opacity", 0.0);
        });
}
function setChat(sessionId) {
  var messagesRef = new Firebase('https://matei.firebaseio.com/' + sessionId + "/chat");

  // REGISTER DOM ELEMENTS
  var messageField = $('#messageInput');
  var messageList = $('#example-messages');

  // LISTEN FOR KEYPRESS EVENT
  messageField.keypress(function (e) {
    if (e.keyCode == 13) {
      //FIELD VALUES
      var message = messageField.val();

      //SAVE DATA TO FIREBASE AND EMPTY FIELD
      messagesRef.push({name:username, text:message});
      messageField.val('');
    }
  });

  // Add a callback that is triggered for each chat message.
  messagesRef.limitToLast(10).on('child_added', function (snapshot) {
    //GET DATA
    var data = snapshot.val();
    var username = data.name || "anonymous";
    var message = data.text;

    //CREATE ELEMENTS MESSAGE & SANITIZE TEXT
    var messageElement = $("<li>");
    var nameElement = $("<strong class='example-chat-username'></strong>")
    nameElement.text(username);
    messageElement.text(message).prepend(nameElement);

    //ADD MESSAGE
    messageList.append(messageElement)

    //SCROLL TO BOTTOM OF MESSAGE LIST
    messageList[0].scrollTop = messageList[0].scrollHeight;
  });
}

function draw() {
    
    //Set up some globals
    var pixSize = 8, lastPoint = null, currentColor = "000", mouseDown = 0;

    //Create a reference to the pixel data for our drawing.
    var pixelDataRef = new Firebase('https://iqlda6d7y3d.firebaseio-demo.com/');

    // Set up our canvas
    var myCanvas = document.getElementById('canvas');
    var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
    if (myContext == null) {
      alert("You must use a browser that supports HTML5 Canvas to run this demo.");
      return;
    }

    //Setup each color palette & add it to the screen
    var colors = ["fff","000","f00","0f0","00f","88f","f8d","f88","f05","f80","0f8","cf0","08f","408","ff8","8ff"];
    for (c in colors) {
      var item = $('<div/>').css("background-color", '#' + colors[c]).addClass("colorbox");
      item.click((function () {
        var col = colors[c];
        return function () {
          currentColor = col;
        };
      })());
      item.appendTo('#colorPicker');
    }

    //Keep track of if the mouse is up or down
    myCanvas.onmousedown = function () {mouseDown = 1;};
    myCanvas.onmouseout = myCanvas.onmouseup = function () {
      mouseDown = 0; lastPoint = null;
    };

    //Draw a line from the mouse's last position to its current position
    var drawLineOnMouseMove = function(e) {
      if (!mouseDown) return;

      e.preventDefault();

      // Bresenham's line algorithm. We use this to ensure smooth lines are drawn
      var offset = $('canvas').offset();
      var x1 = Math.floor((e.pageX - offset.left) / pixSize - 1),
        y1 = Math.floor((e.pageY - offset.top) / pixSize - 1);
      var x0 = (lastPoint == null) ? x1 : lastPoint[0];
      var y0 = (lastPoint == null) ? y1 : lastPoint[1];
      var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, err = dx - dy;
      while (true) {
        //write the pixel into Firebase, or if we are drawing white, remove the pixel
        pixelDataRef.child(x0 + ":" + y0).set(currentColor === "fff" ? null : currentColor);

        if (x0 == x1 && y0 == y1) break;
        var e2 = 2 * err;
        if (e2 > -dy) {
          err = err - dy;
          x0 = x0 + sx;
        }
        if (e2 < dx) {
          err = err + dx;
          y0 = y0 + sy;
        }
      }
      lastPoint = [x1, y1];
    };
    $(myCanvas).mousemove(drawLineOnMouseMove);
    $(myCanvas).mousedown(drawLineOnMouseMove);

    // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
    // Note that child_added events will be fired for initial pixel data as well.
    var drawPixel = function(snapshot) {
      var coords = snapshot.key().split(":");
      myContext.fillStyle = "#" + snapshot.val();
      myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
    };
    var clearPixel = function(snapshot) {
      var coords = snapshot.key().split(":");
      myContext.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
    };
    pixelDataRef.on('child_added', drawPixel);
    pixelDataRef.on('child_changed', drawPixel);
    pixelDataRef.on('child_removed', clearPixel);
}

function showWhiteboard() {
    $("#tab2").click(function() {
        $("#whiteboard").css("z-index", 10);
         $("#canvas").css("z-index", 11);
          $("#colorPicker").css("z-index", 11);
        $("#feature").css("z-index", 0);
        console.log($("#feature").css("z-index"));
    });
}
/*****************************************************************************/
