// Utility function to log messages
var log_console = function(msg) {
  $('#console').append('<pre>' + msg + '</pre>');
};
var INDENT = '   ';
var nice_list = function (data, indent) {
  if (indent === undefined) indent = 2;
  if (!(data instanceof Array)) {
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
var nice_env = function (data) {
  for (var prop in data) {
    if (typeof data[prop] === 'function') {
      data[prop] = 'function';
    } else if (typeof data[prop] === 'object') {
      nice_env(data[prop]);
    }
  }
  return data;
}
// After page load
$(function() {
  var myCodeMirror = CodeMirror.fromTextArea(document.getElementById('input'), {
    mode:  "scheme",
    //theme: "monokai"
  });
  $('#parse').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    try {
      var parsed = TScheem.parser.parse(user_text);
      log_console(nice_list(parsed));
    }
    catch(e) {
      log_console('Parse Error: ' + e);
    }
  });
  $('#typecheck').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    var type = TScheem.interpreter.typeTScheemString(user_text);
    log_console(TScheem.interpreter.prettyType(type));
  });
  $('#run').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    try {
      var parsed = TScheem.parser.parse(user_text);
    }
    catch(e) {
      log_console('Parse Error: ' + e);
    }
    var env = {};
    var result = TScheem.interpreter.evalTScheem(parsed, env);
    log_console(JSON.stringify(result));
    log_console(JSON.stringify(nice_env(env)));
  });
});
