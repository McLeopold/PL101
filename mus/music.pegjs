{
  var default_octave = "4"
    , default_dur = 250
  ;
  function flatten (a) {
    var result = [];
    for (var i = 0, ilen = a.length; i < ilen; ++i) {
        result = result.concat(a[i]);
    }
    return result;
  }
  function int(sa) {
    return parseInt(sa.join(''), 10);
  }
}

sequence = ns:(repeat / parallel / notes)+
  { return { tag: 'seq', sections: flatten(ns) }; }

parallel = '{' S? n:(repeat / notes) ns:(S? '&&' S? (repeat / notes))+ S? '}'
  { return { tag: 'par', section: n }; }

repeat = S? '|:' ns:notes+ ':|' S? c:(integer S? '|')?
  { return { tag: 'repeat',
             count: c[0] || 2,
             section: flatten(ns) }; }

notes = S? d:noteduration? S? o:noteoctave? S? h:notehold* S? s:noteshorten* n:(note / rest)+ S?
  {
    var dur_mod = (h.length + 1) / (s.length + 1);
    for (var i = 0, ilen = n.length; i < ilen; i++) {
      if (n[i].tag === 'note') {
        n[i].pitch += o || default_octave;
      }
      n[i].dur *= dur_mod * (d || default_dur);
    };
    return n;
  }

rest           = r:'_'+ s:noteshorten*
  { return { tag: 'rest',
             dur: r.length / (s.length + 1) }; }

note           = n:(noteletter noteaccidental?) h:notehold* s:noteshorten*
  { return { tag: 'note',
             pitch: n.join(''),
             dur: (h.length + 1) / (s.length + 1) }; }

noteoctave     = o:[0-7]
noteduration   = '[' S? d:[0-9]+ S? ']'
  { return int(d); }

noteletter     = [A-G]
noteaccidental = [#nb]
notehold       = '+'
noteshorten    = '/'

integer = d:[0-9]+
  { return int(d); }

S = [ \t\r\n\f]+