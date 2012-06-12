if (typeof module !== 'undefined') {
  var chai = require('chai');
  var Hare = {
    interpreter: require('../hare_interpreter.js'),
    samples: require('../hare_samples.js')
  };
}
var assert = chai.assert;
var expect = chai.expect;
var evalHare = Hare.interpreter.evalHare;
var evalHareString = Hare.interpreter.evalHareString;
var myHare = Hare.interpreter.myHare;

/*
suite('Hare Errors', function () {
});

suite('Hare Run', function () {
  suite('parse and eval', function () {
    for (var name in Hare.samples) { if (Hare.samples.hasOwnProperty(name)){
      test(name, function (name) {
        return function () {
          console.log(myHare);
          assert.deepEqual(
            evalHareString(Hare.samples[name][0]),
            Hare.samples[name][1]
          );
          console.log(myHare);
        };
      }(name));
    }}
  });
});
*/