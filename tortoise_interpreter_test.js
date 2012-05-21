if (typeof module !== 'undefined') {
  var chai = require('chai');
  var Tortoise = {
    interpreter: require('../tortoise_interpreter.js'),
    samples: require('../tortoise_samples.js')
  };
}
var assert = chai.assert;
var expect = chai.expect;
var evalTortoise = Tortoise.interpreter.evalTortoise;
var evalTortoiseString = Tortoise.interpreter.evalTortoiseString;
var myTortoise = Tortoise.interpreter.myTortoise;

/*
suite('Tortoise Errors', function () {
});

suite('Tortoise Run', function () {
  suite('parse and eval', function () {
    for (var name in Tortoise.samples) { if (Tortoise.samples.hasOwnProperty(name)){
      test(name, function (name) {
        return function () {
          console.log(myTortoise);
          assert.deepEqual(
            evalTortoiseString(Tortoise.samples[name][0]),
            Tortoise.samples[name][1]
          );
          console.log(myTortoise);
        };
      }(name));
    }}
  });
});
*/