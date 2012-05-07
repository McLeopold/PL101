// Utility function to log messages
var log_console = function(msg) {
  $('#console').append('<p>' + msg + '</p>');
};
// After page load
$(function() {
  var myCodeMirror = CodeMirror.fromTextArea(document.getElementById('input'), {
    value: "(+ 1 1)\n",
    mode:  "scheme",
    theme: "monokai"
  });
  $('#check').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    log_console('Your input was: "' + user_text + '"');
    try {
      var parsed = Scheem.parser.parse(user_text);
      log_console('Parsed: ' + JSON.stringify(parsed));
      log_console('Program is correct');
    }
    catch(e) {
      log_console('Parse Error: ' + e);
    }
  });
  $('#run').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    log_console('Your input was: "' + user_text + '"');
    try {
      var parsed = Scheem.parser.parse(user_text);
      log_console('Parsed: ' + JSON.stringify(parsed));
      try {
        var result = Scheem.interpreter.evalScheem(parsed, {});
        log_console('Result: ' + JSON.stringify(result));
      }
      catch(e) {
        log_console('Eval Error: ' + e);
      }
    }
    catch(e) {
      log_console('Parse Error: ' + e);
    }
  });
});
