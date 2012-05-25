// Utility function to log messages
var log_console = function(msg) {
  $('#console').append('<pre>' + msg + '</pre>');
};
var INDENT = '   ';
var nice_list = function (data, indent) {
  if (indent === undefined) indent = 2;
  if (typeof data !== 'object') {
    return JSON.stringify(data)
  } else {
    // assume list
    return '[\n' +
           Array(indent).join(INDENT) +
           data.map(function (data) {
             return nice_list(data, indent + 1);
           }).join(',\n' + Array(indent).join(INDENT)) +
           '\n' + Array(indent-1).join(INDENT) + ']'
           ;
  }
}
// After page load
$(function() {
  var myCodeMirror = CodeMirror.fromTextArea(document.getElementById('input'), {
    value: "(begin\n     ;; accumulator maker function\n      (define foo (lambda (n)\n                                  (lambda (i) (begin\n                                                                           (set! n (+ n i))\n                                                                                                       n))))\n      \n       ;; make accumulator starting at 7\n        (define bar (foo 7))\n         \n         (alert (bar 5)) ;; returns 12\n          (alert (bar 3)) ;; return 15\n          )",
    mode:  "scheme",
    //theme: "monokai"
  });
  $('#check').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    //log_console('Your input was: "' + user_text + '"');
    try {
      var parsed = Scheem.parser.parse(user_text);
      log_console(nice_list(parsed));
    }
    catch(e) {
      log_console('Parse Error: ' + e);
    }
  });
  $('#run').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    //log_console('Your input was: "' + user_text + '"');
    try {
      var parsed = Scheem.parser.parse(user_text);
      try {
        var result = Scheem.interpreter.evalScheem(parsed, {});
        log_console(JSON.stringify(result));
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
