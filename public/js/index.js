/*** VARIABLES ***************************************************************/

var username;
var onlineUsersRef;

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
  $('#online')[0].scrollTop = $('#highscore')[0].scrollHeight;
}


function setUsername() {
  do {
    username = prompt("Enter your name here (at least 4 characters)");
  } while (username == null || username.length < 4);
}


function collapseChat() {
  $(".chat-header").click(function() {
    $(".chat-content").slideToggle(500);
  });
}


function onSessionId(sessionId) {
  var sessionId = window.location.pathname.substring(1);
  if (sessionId.length > 0) {
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
  setChat(sessionId);
}


function setOnlineUsers(sessionId) {
  var onlineUsersRef = new Firebase('https://matei.firebaseio.com/' + sessionId + "/users");
  onlineUsersRef.on('child_added', function (snapshot) {
    var data = snapshot.val();
    var username = data.username || "anonymous";

    addOnlineUser(username);
  });

  onlineUsersRef.push({username: username});
}


function setTextEditor(sessionId) {
  $("#tab1").click(function() {
    var firepadRef = new Firebase('https://matei.firebaseio-demo.com/'+ sessionId + "/text");
    var codeMirror = CodeMirror(document.getElementById('feature'),
      { lineWrapping: true });
    var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
      { richTextToolbar: true, richTextShortcuts: true });
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

/*****************************************************************************/
