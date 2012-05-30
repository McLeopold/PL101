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
  var state;
  var myCodeMirror = CodeMirror.fromTextArea(document.getElementById('input'), {
    mode:  "javascript",
    theme: "neat",
    lineNumbers: true
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
  Tortoise.interpreter.init(8, 84, 400, 400);
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
    state = {data: null, done: true};
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
  var draw_start = function() {
    Tortoise.interpreter.myTortoise.clear();
    myCodeMirror.save();
    var user_text = $('#input').val();
    $('#console').html('');
    var parsed = Tortoise.parser.parse(user_text);
    var env = {};
    state = Tortoise.interpreter.startStatements(parsed, env);
  }
  var is_drawing = function (state) {
    return (state.data.args &&
            state.data.args[0] &&
            state.data.args[0].tag === 'call' &&
            state.data.args[0].name in {'forward': true,
                                        'backward': true,
                                        'left': true,
                                        'right': true,
                                        'pop': true});
  };
  var draw_step = function() {
    if (state && !state.done) {
      Tortoise.interpreter.step(state);
      while (!state.done && !is_drawing(state)) {
        Tortoise.interpreter.step(state);        
      }
    }
  };
  $('#start').click(draw_start);
  $('#step').click(draw_step);
  $('#play').click(function () {
    draw_start();
    setTimeout(function nextDrawStep () {
      var speed = parseInt($('#speed').val(), 10);
      Tortoise.interpreter.myTortoise.setSpeed(speed);
      draw_step();
      if (!state.done) {
        setTimeout(nextDrawStep, speed);
      } else {
        Tortoise.interpreter.myTortoise.hideTurtle();
      }
    }, parseInt($('#speed').val(), 10));
  });
  $(window).resize(function () {
    $(myCodeMirror.getScrollerElement()).height($('.CodeMirror').height());
    myCodeMirror.refresh();
  })
  $('.CodeMirror').resize();
});
