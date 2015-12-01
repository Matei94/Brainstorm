/*** DOCUMENT READY **********************************************************/

$(document).ready(function() {
  $("#startNew").click(function() {
    window.location.href = window.location.href + "start";
  });

  $("#joinButton").click(function() {
    var sessionId = $('#linkSession').val();
    if (sessionId.length == 12) {
      window.location.href = window.location.href + sessionId;
    } else {
      alert("Invalid session");
    }
  });
});

/*****************************************************************************/

