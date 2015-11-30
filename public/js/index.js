/*** VARIABLES ***************************************************************/

var username;
var textEditorHash;

/*****************************************************************************/



/*** DOCUMENT READY **********************************************************/

$(document).ready(function() {
  console.log("URL = " + window.location.href);

  collapseChat();

  $.get("/session", setChat);

  /* Get username */
  do {
    username = prompt("Enter your name here (at least 4 characters)");
  } while (username == null || username.length < 4);
});

/*****************************************************************************/



/*** FUNCTIONS ***************************************************************/

function collapseChat() {
  $(".chat-header").click(function() {
    $(".chat-content").slideToggle(500);
  });
}


function setChat(sessionId) {
  var firepadRef = new Firebase('https://matei.firebaseio-demo.com/'+ sessionId + "/text");
  var codeMirror = CodeMirror(document.getElementById('firepad-container'),
    { lineWrapping: true });
  var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
    { richTextToolbar: true, richTextShortcuts: true });

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
