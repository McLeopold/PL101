/*
 * Classic example grammar, which recognizes simple arithmetic expressions like
 * "2*(3+4)". The parser generated from this grammar then computes their value.
 */

start
  = first

additive
  = left:multiplicative "+" right:additive { return { op: 'add', left: left, right: right }; }
  / multiplicative

multiplicative
  = left:primary "*" right:multiplicative { return { op: 'mul', left: left, right: right }; }
  / primary

primary
  = i:integer { return { type: 'int', value: i}; }
  / "(" additive:additive ")" { return {type: 'expr', value: additive}; }

first = par_durs

par_durs
  = left:par_dur right:par_durs { return { tag: 'par_durs', left: left, right: right }; }
  / par_dur

par_dur
  = S? '[' S? i:integer S? ']' s:par_octs { return { tag: 'par_dur', value: i, section: s }; }
  / par_octs

par_octs
  = left:par_oct right:par_octs { return { tag: 'par_octs', left: left, right: right }; }
  / par_oct

par_oct
  = o:noteoctave s:par { return { tag: 'par_oct', value: o, section: s }; }
  / par

par
  = left:seq_durs "&" right:par { return { tag: 'par', left: left, right: right }; }
  / seq_durs

seq_durs
  = left:seq_dur right:seq_durs { return { tag: 'seq_durs', left: left, right: right }; }
  / seq_dur

seq_dur
  = '[' i:integer ']' s:seq_octs { return { tag: 'seq_dur', value: i, section: s }; }
  / seq_octs

seq_octs
  = left:seq_oct right:seq_octs { return { tag: 'seq_octs', left: left, right: right }; }
  / seq_oct

seq_oct
  = S? o:noteoctave s:seq { return { tag: 'seq_oct', value: o, section: s }; }
  / seq

seq
  = left:mus_expr right:seq { return { tag: 'seq', left: left, right: right }; }
  / mus_expr

mus_expr = S? e:(note / paren / repeat) S? { return e; }

repeat = '|:' s:first ':|' c:(integer '|')? { return { tag: 'repeat', count: c[0] || 2, section: s }; }

paren = '(' s:first ')' d:notedot? h:notehold* c:notecut* m:notemult? t:notenumlet? { return (d||h||c||m||t)?{tag:'mul',mul:(d?1.5:1) * ((h.length + 1) / Math.pow(2, c.length) / (t||1) * (m||1)),section:s}:s; }

note = l:noteletter a:noteaccidental? d:notedot? h:notehold* c:notecut* m:notemult? t:notenumlet? { return { tag: 'note', pitch: l.toUpperCase() + a, mul: (d?1.5:1) * (h.length + 1) / Math.pow(2, c.length) / (t||1) * (m||1) }; }

noteletter = [a-gA-G]
noteaccidental = [#nb]
noteoctave = [0-7]
notedot = '.'
notehold = '+'
notecut = '\\'
notemult = '*' i:integer { return i; }
notenumlet = '/' i:integer { return i; }

integer "integer"
  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

S = ([ \t\n\r\f] / Comment)+
CommentBegin = '/*'
CommentEnd = '*/'
Comment = CommentBegin N* CommentEnd
N = Comment / (!CommentBegin !CommentEnd Z)
Z = .