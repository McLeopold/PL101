var compile = function (musexpr) {
    var result = [];
    helper(0, result, musexpr);
    return result;
};

/*
  This helper function does two things at a time
   - it appends the NOTE bytecode to the end of result
   - it returns the ending time
*/
var helper = function (time, result, expr) {
    switch(expr.tag){
    
      case 'seq':
        //Take endtime as new start time
        time = helper(time, result, expr.left);
        return helper(time, result, expr.right);
        
      case 'par':
        var t0 = helper(time, result, expr.left);
        var t1 = helper(time, result, expr.right);
        // Take maximum of two parrelel pieces
        return Math.max(t0, t1);  
      
      case 'repeat':
        for(var i=expr.count-1; 0<=i; i--){
          time = helper(time, result, expr.section);
        }
        return time;
        
      case 'rest':
        return time + expr.dur;
        
      case 'note':
        result.push(
          { tag: 'note', pitch: convertPitch(expr.pitch), start: time, dur: expr.dur}
        );
        return time + expr.dur;
      
      default:
        return time;
    }
};

/*
  Converter for pitches
*/
var convertPitch = function(pitch) {
    var letterPitches = { c: 12, d: 14, e: 18, f: 17, g: 19, a: 21, b: 23 };
    return letterPitches[pitch[0]] +
           12 * parseInt(pitch[1]);
}

module.exports = compile;