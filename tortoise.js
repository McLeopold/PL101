// Utility function to log messages
var log_console = function(msg) {
  $('#console').append('<p>' + msg + '</p>');
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
    mode:  "javascript",
    //theme: "neat"
  });
  // load sample buttons
  var sample_div = $('#samples');
  for (sample_name in Tortoise.samples) {
    (function (sample_name) {
      sample_div.append(
        $('<input type="button" id="' + sample_name + '" value="' + sample_name +'" />')
          .click(function () {
            myCodeMirror.setValue(Tortoise.samples[sample_name][0]);
          })
      );
    }(sample_name));
  };
  myCodeMirror.setValue(Tortoise.samples['maze'][0]);
  Tortoise.interpreter.init(680, 100, 400, 400);
  $('#check').click(function() {
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html(''); // clear console
    try {
      var parsed = Tortoise.parser.parse(user_text);
      log_console(nice_list(parsed));
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
//    try {
      var parsed = Tortoise.parser.parse(user_text);
//      try {
        var env = {};
        var result = Tortoise.interpreter.evalTortoise(parsed, env);
        log_console(JSON.stringify(result));
        //log_console(JSON.stringify(env));
//      }
//      catch(e) {
//        log_console('Eval Error: ' + e);
//      }
//    }
//    catch(e) {
//      log_console('Parse Error: ' + e);
//    }
  });
  var state;
  var draw_start = function() {
    Tortoise.interpreter.myTortoise.clear();
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html('');
    var parsed = Tortoise.parser.parse(user_text);
    var env = {};
    state = Tortoise.interpreter.startStatements(parsed, env);
    //$('#console').html(JSON.stringify(state));
  }
  var draw_step = function() {
    Tortoise.interpreter.step(state);
    while (!state.done && !(state.data.args &&
                            state.data.args[0] &&
                            state.data.args[0].tag === 'call' &&
                            state.data.args[0].name in {'forward': true,
                                                        'backward': true,
                                                        'left': true,
                                                        'right': true})) {
      Tortoise.interpreter.step(state);
    }
  };
  $('#start').click(draw_start);
  $('#step').click(draw_step);
  $('#play').click(function () {
    draw_start();
    setTimeout(function nextDrawStep () {
      draw_step();
      if (!state.done) {
        setTimeout(nextDrawStep, parseInt($('#speed').val(), 10));
      } else {
        console.log('done');
      }
    }, parseInt($('#speed').val(), 10));
  });
});
