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
  var state;
  var myCodeMirror = CodeMirror.fromTextArea(document.getElementById('input'), {
    mode:  "javascript",
    theme: "neat",
    lineNumbers: true
  });
  // load sample buttons
  var sample_div = $('#samples');
  for (sample_name in Hare.samples) {
    (function (sample_name) {
      sample_div.append(
        $('<input type="button" id="' + sample_name + '" value="' + sample_name +'" />')
          .click(function () {
            myCodeMirror.setValue(Hare.samples[sample_name][0]);
          })
      );
    }(sample_name));
  };
  myCodeMirror.setValue(Hare.samples['fibonacci'][0]);
  Hare.gfx.init(8, 84, 400, 400);
  $('#parse').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    try {
      var parsed = Hare.parser.parse(user_text);
      log_console(nice_list(parsed));
    }
    catch(e) {
      log_console('Parse Error: ' + e);
    }
  });
  $('#interpret').click(function() {
    var myTurtle = Hare.gfx.getTurtle();
    myTurtle.clear();
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    var env = {};
    var start = new Date().getTime();
    var result = Hare.interpreter.evalHare(user_text, env);
    var end = new Date().getTime();
    var time = end - start;
    log_console('Execution time: ' + time);
    log_console(result);
  });
  $('#compile').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    var env = {};
    var result = Hare.compiler.compileHare(user_text, env);
    log_console(result);
  });
  $('#run').click(function () {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html('');
    var myTurtle = Hare.gfx.getTurtle();
    myTurtle.clear();
    var positions = Hare.gfx.positions;
    var repeat = Hare.compiler.repeat;
    var result = Hare.compiler.compileHare(user_text);
    var start = new Date().getTime();
    eval(result);  // evil!
    var end = new Date().getTime();
    var time = end - start;
    log_console('Execution time: ' + time);
    log_console(_res);
  })
  $(window).resize(function () {
    $(myCodeMirror.getScrollerElement()).height($('.CodeMirror').height());
    myCodeMirror.refresh();
  })
  $('.CodeMirror').resize();
});
