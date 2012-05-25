// Utility function to log messages
var log_console = function(msg) {
  $('#console').append('<p>' + msg + '</p>');
};
// After page load
$(function() {
  var myCodeMirror = CodeMirror.fromTextArea(document.getElementById('input'), {
    mode:  "javascript",
    theme: "monokai"
  });
  Tortoise.interpreter.init(680, 100, 400, 400);
  $('#check').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    log_console('Your input was: "' + user_text + '"');
    try {
      var parsed = Tortoise.parser.parse(user_text);
      log_console('Parsed: ' + JSON.stringify(parsed));
      log_console('Program is correct');
    }
    catch(e) {
      log_console('Parse Error: ' + e);
    }
  });
  $('#run').click(function() {
    Tortoise.interpreter.myTortoise.clear();
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    log_console('Your input was: "' + user_text + '"');
    try {
      var parsed = Tortoise.parser.parse(user_text);
      log_console('Parsed: ' + JSON.stringify(parsed));
      try {
        var result = Tortoise.interpreter.evalTortoise(parsed, {});
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
