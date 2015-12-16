/*** VARIABLES ***************************************************************/

var gUsername;
var gChatCollapsed = false;
var gNumConnectedUsers = 0;

/*****************************************************************************/



/*** DOCUMENT READY **********************************************************/

$(document).ready(function() {
  var sessionId = window.location.pathname.substring(1);
  if (sessionId.length > 0 && sessionId != 'start') {
    onSessionId(sessionId);
  } else {
    $.get("/session", onSessionId);
  }
});

/*****************************************************************************/



/*** FUNCTIONS ***************************************************************/

function onSessionId(sessionId) {
  collapseChat();

  /* Set username */
  var dialog = document.getElementById('name-dialog');
  dialog.showModal();

  $('#name').keypress(function(e) {
    if (e.keyCode == 13) {
      var name = $('#name').val();
      if (name.length >= 4) {
        gUsername = name;
        dialog.close();

        setOnlineUsers(sessionId);
        setTextEditor(sessionId);
        setChat(sessionId);
        setWhiteboard(sessionId);
        setCodeEditor(sessionId);
        setShareButtonBehaviour(sessionId);
        setOnCloseBehaviour(sessionId);
      }
    }
  });
}


function setOnCloseBehaviour(sessionId) {
  $(window).on('beforeunload', function() {
    if (gNumConnectedUsers == 1) {
      var sessionRef = new Firebase('https://matei.firebaseio.com/' + sessionId);
      sessionRef.remove(function(err) {});
    }
  });
}


function setOnlineUsers(sessionId) {
  var onlineUsersRef = new Firebase('https://matei.firebaseio.com/' + sessionId + "/users");
  onlineUsersRef.on('child_added', function (snapshot) {
    gNumConnectedUsers += 1;

    var data = snapshot.val();
    var username = data.username || "anonymous";

    addOnlineUser(username);
  });

  onlineUsersRef.on('child_removed', function (snapshot) {
    gNumConnectedUsers -= 1;

    var data = snapshot.val();
    var username = data.username || "anonymous";

    $('#' + username).remove();
  });

  var userRef = onlineUsersRef.push({username: gUsername});
  userRef.onDisconnect().remove();
}


function setTextEditor(sessionId) {
  var firepadRef = new Firebase('https://matei.firebaseio-demo.com/'+ sessionId + "/text");
  var codeMirror = CodeMirror(document.getElementById('feature'),
  { lineWrapping: true });
  var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
  { richTextToolbar: true, richTextShortcuts: true });

  $("#tab1").click(function() {
    $(".CodeMirror").height($("#container").height() - 100);
    $("#tab1").css("backgroundColor", "#0162FB");
    $("#tab2").css("backgroundColor", "#3C87FF");
    $("#tab3").css("backgroundColor", "#3C87FF");

    $("#whiteboard").css("z-index", 0);
    $("#canvas").css("z-index", 0);
    $("#colorPicker").css("z-index", 0);
    $("#codeEditor").css("z-index", 0);
    $("#feature").css("z-index", 1);

    $("#whiteboard").css("opacity", 0.0);
    $("#canvas").css("opacity", 0.0);
    $("#colorPicker").css("opacity", 0.0);
    $("#codeEditor").css("opacity", 0.0);
    $("#feature").css("opacity", 1.0);
  });
}


function setCodeEditor(sessionId) {
  var firepadRef = new Firebase('https://matei.firebaseio-demo.com/'+ sessionId + "/code");
  var codeMirror = CodeMirror(document.getElementById('codeEditor'),
  { lineNumbers: true, mode: 'javascript' });
  var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
  { defaultText: '// Write your JavaScript code here'});

  $("#tab3").click(function() {
    $(".CodeMirror").height($("#container").height());
    $("#tab1").css("backgroundColor", "#3C87FF");
    $("#tab2").css("backgroundColor", "#3C87FF");
    $("#tab3").css("backgroundColor", "#0162FB");

    $("#whiteboard").css("z-index", 0);
    $("#canvas").css("z-index", 0);
    $("#colorPicker").css("z-index", 0);
    $("#codeEditor").css("z-index", 1);
    $("#feature").css("z-index", 0);

    $("#whiteboard").css("opacity", 0.0);
    $("#canvas").css("opacity", 0.0);
    $("#colorPicker").css("opacity", 0.0);
    $("#codeEditor").css("opacity", 1.0);
    $("#feature").css("opacity", 0.0);
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
      messagesRef.push({name:gUsername, text:message});
      messageField.val('');
    }
  });

  // Add a callback that is triggered for each chat message.
  messagesRef.on('child_added', function (snapshot) {
    if (gChatCollapsed) {
      $(".chat-header").css("color", "red");
    }

    //GET DATA
    var data = snapshot.val();
    var username = data.name || "anonymous";
    var message = data.text;

    //CREATE ELEMENTS MESSAGE & SANITIZE TEXT
    var messageElement = $("<li>");
    var nameElement = $("<strong class='example-chat-username'></strong>")
    nameElement.text(username + ": ");
    messageElement.text(message).prepend(nameElement);

    //ADD MESSAGE
    messageList.append(messageElement)

    //SCROLL TO BOTTOM OF MESSAGE LIST
    messageList[0].scrollTop = messageList[0].scrollHeight;
  });
}


function setWhiteboard(sessionId) {
  //Set up some globals
  var pixSize = 8, lastPoint = null, currentColor = "000", mouseDown = 0;

  //Create a reference to the pixel data for our drawing.
  var pixelDataRef = new Firebase('https://matei.firebaseio.com/' + sessionId + "/draw");

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

  $("#tab2").click(function() {
    $("#tab1").css("backgroundColor", "#3C87FF");
    $("#tab2").css("backgroundColor", "#0162FB");
    $("#tab3").css("backgroundColor", "#3C87FF");

    $("#whiteboard").css("z-index", 1);
    $("#canvas").css("z-index", 1);
    $("#colorPicker").css("z-index", 1);
    $("#codeEditor").css("z-index", 0);
    $("#feature").css("z-index", 0);

    $("#whiteboard").css("opacity", 1.0);
    $("#canvas").css("opacity", 1.0);
    $("#colorPicker").css("opacity", 1.0);
    $("#codeEditor").css("opacity", 0.0);
    $("#feature").css("opacity", 0.0);
  });
}


function addOnlineUser(username) {
  $("#users").append('<li id="' + username + '">' + username + '</li>');
}


function setShareButtonBehaviour(sessionId) {
  var dialog = document.getElementById('share-dialog');
  document.getElementById("sessionId").disabled = true;
  $('#sessionId').val(sessionId);

  $("#shareButton").click(function() {
    dialog.showModal();
  });

  $("#share-close").click(function() {
    dialog.close();
  });
}


function collapseChat() {
  $(".chat-header").click(function() {
    $(".chat-content").slideToggle(500);
    if (gChatCollapsed) {
      $(".chat-header").css("color", "#999");
    }
    gChatCollapsed = !gChatCollapsed;
  });
}

/*****************************************************************************/
