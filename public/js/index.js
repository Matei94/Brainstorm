/*** VARIABLES ***************************************************************/

var username;
var textEditorHash;

/*****************************************************************************/



/*** DOCUMENT READY **********************************************************/

$(document).ready(function() {
  console.log(window.location.href);

  var firepadRef = getExampleRef();
  var codeMirror = CodeMirror(document.getElementById('feature'), { lineWrapping: true });
  var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
  { richTextToolbar: true, richTextShortcuts: true });
  firepad.on('ready', function() {
    if (firepad.isHistoryEmpty()) {
      firepad.setHtml('<span style="font-size: 24px;">Rich-text editing with <span style="color: red">Firepad!</span></span><br/><br/>Collaborative-editing made easy.\n');
    }
  });

  collapseChat();

  $.get("/session", function(data) {
    var messagesRef = new Firebase('https://matei.firebaseio.com/' + data);

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
  });

  /* Get username */
  var username;
  do {
    username = prompt("Enter your name here (at least 4 characters)");
  } while (username == null || username.length < 4);
});

/*****************************************************************************/



/*** FUNCTIONS ***************************************************************/

function getExampleRef() {
  var ref = new Firebase('https://firepad.firebaseio-demo.com');
  var hash = window.location.hash.replace(/#/g, '');
  if (hash) {
      ref = ref.child(hash);
  } else {
      ref = ref.push(); // generate unique location.
      window.location = window.location + '#' + ref.key();
  }
  return ref;
}


function collapseChat() {
  $(".chat-header").click(function() {
    $(".chat-content").slideToggle(500);
  });
}

/*****************************************************************************/
