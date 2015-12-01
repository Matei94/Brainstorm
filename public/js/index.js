/*** VARIABLES ***************************************************************/

var gUsername;

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
  $("#users").append('<li id="' + username + '">' + username + '</li>');
}


function collapseChat() {
  $(".chat-header").click(function() {
    $(".chat-content").slideToggle(500);
  });
}


function onSessionId(sessionId) {
  /* Set share link */
  var pathname = window.location.pathname;
  if (pathname == '/') {
    $('#shareLink').attr("href", window.location.href + sessionId);
    $('#shareLink').text(window.location.href + sessionId);
  } else {
    $('#shareLink').attr("href", window.location.href);
    $('#shareLink').text(window.location.href);
  }

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
      }
    }
  });

  collapseChat();
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

    $('#' + username).remove();
  });

  var userRef = onlineUsersRef.push({username: gUsername});
  userRef.onDisconnect().remove();
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
      messagesRef.push({name:gUsername, text:message});
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
