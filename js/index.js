// Utility function to log messages
var log_console = function(msg) {
  $('#console').append('<p>' + msg + '</p>');
};
// After page load
$(function() {
  var myCodeMirror = CodeMirror.fromTextArea(document.getElementById('input'), {
    value: "(begin\n     ;; accumulator maker function\n      (define foo (lambda (n)\n                                  (lambda (i) (begin\n                                                                           (set! n (+ n i))\n                                                                                                       n))))\n      \n       ;; make accumulator starting at 7\n        (define bar (foo 7))\n         \n         (alert (bar 5)) ;; returns 12\n          (alert (bar 3)) ;; return 15\n          )",
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
