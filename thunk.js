var gcd = function (a, b) {
  if (b === 0) {
    return a;
  } else {
    return gcd(b, a % b);
  }
}

var gcdCPS = function (a, b, cont) {
  console.log('gcdCPS', a, b);
  if (b === 0) {
    console.log('final', a, b);
    return cont(a);
  } else {
    var new_cont = function (v) {
       console.log('cont', a, b, v);
       return cont(v);
    }
    return gcdCPS(b, a % b, new_cont);
  }
}

/*
console.log(gcdCPS(259, 111, function (v) {
  console.log('answer', v);
  return v;
}));
*/

var thunk = function (f, lst) {
  return {
    tag: 'thunk',
    func: f,
    args: lst
  };
};

var thunkValue = function (x) {
  console.log('value', x);
  return {
    tag: 'value',
    val: x
  };
};

var gcdThunk = function (a, b, cont) {
  console.log('gcdThunk', a, b);
  if (b === 0) {
    console.log('final', a, b);
    return thunk(cont, [a]);
  } else {
    var new_cont = function (v) {
       console.log('cont', a, b, v);
       return thunk(cont, [v]);
    }
    return thunk(gcdThunk, [b, a % b, new_cont]);
  }
}

var trampoline = function (thk) {
  while (true) {
    if (thk.tag === 'value') {
      return thk.val;
    }
    if (thk.tag === 'thunk') {
      thk = thk.func.apply(null, thk.args);
    }
  }
};
console.log(trampoline(gcdThunk(259, 111, thunkValue)));