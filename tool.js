var util = require('util')
  , exec = require('child_process').exec
  , fs = require('fs')
  , path = require('path')
;

// TODO: properly terminate cp and rm by counting calls

// TODO: make object and use prototype
// http://wiki.pageforest.com/#js-patterns/factory-function
Exec = function (seq) {
  var name
    , cmds = {}
  ;
  if (!seq) {
    seq = [];
    process.nextTick(function next (err) {
      if (!err) {
        if (seq.length > 0) {
          seq.shift()(next);
        }
      } else {
        console.error('aborting... ', err);
      }
    });
  }
  for (name in Exec.cmds) { if (Exec.cmds.hasOwnProperty(name)) {
    cmds[name] = (function (cmd) {
      return function () {
        cmd.apply(seq, arguments);
        return cmds;
      }
    }(Exec.cmds[name]));
  }}
  return cmds;
}

Exec.cmds = {}

Exec.extend = function (name, fn) {
  var thunk = function () {
    this.push(fn.apply(null, arguments));
  }
  if (typeof name === 'string') {
    Exec.cmds[name] = thunk;
  } else {
    name.forEach(function (n) {
      Exec.cmds[n] = thunk;
    })
  }
}

Exec.extend(
  ['exec', 'run'],
  function (cmd) {
    return function (callback) {
      console.log(cmd);
      exec(cmd, function (err, stdout, stderr) {
        util.puts(err ? stderr : stdout);
        callback(err);
      });
    };
  }
);

Exec.extend(
  ['cp', 'copy'],
  function (src, dst) {
    return function (callback) {
      console.log('copy ' + src + ' -> ' + dst);
      fs.stat(dst, function (err, stats) {
        if (err) {
          console.error('destination ' + dst + ' does not exist');
          callback(err);
        } else if (!stats.isDirectory()) {
          console.error('destination ' + dst + ' is not a directory');
          callback(new Error('not a directory'));
        } else {
          finddir(src, {callback: callback},
            function (root, file) {
              console.log('.... ' + path.join(root, file) + ' -> ' + path.join(dst, file));
              fs.stat(path.join(root, file), function (err) {
                if (err) {
                  callback(err);
                } else {
                  util.pump(fs.createReadStream(path.join(root, file)),
                            fs.createWriteStream(path.join(dst, file)),
                            callback);
                }
              });
            }
          )
        }
      })
    };
  }
);

Exec.extend(
  ['rm', 'del'],
  function (name, recursive) {
    return function (callback) {
      var dir_list = [];
      var cb = function () {
        var cb = callback_counter(dir_list.length, callback);
        dir_list.forEach(function (dir) {
          console.log('rmdir  ' + dir);
          fs.rmdir(dir, cb);
        })
      };
      finddir(name, {recursive: recursive,
                     callback: cb,
                     include_dirs: recursive},
        function (file) {
          console.log('delete ' + file);
          fs.unlink(file);
        },
        function (dir) {
          console.log('adddir ' + dir);
          dir_list.unshift(dir)
        }
      )
    }
  }
);

Exec.extend(
  ['ls', 'dir'],
  function (name, recursive) {
    return function (callback) {
      console.log('listing ' + name);
      finddir(name, {recursive: recursive, callback: callback},
        function (root, file) {
          console.log(file);
        }
      );
    }
  }
);

Exec.extend(
  'mkdir',
  function (name, mode) {
    return function (callback) {
      console.log('mkdir ' + name, mode);
      fs.mkdir(name, mode, function (err) {
        callback(); // ignore errors
      });
    };
  }
);

finddir = function (name, options, file_fn, dir_fn) {
  // reorder parameters if there are no options
  if (typeof options === 'function') {
    dir_fn = file_fn;
    file_fn = options;
    options = {};
  }
  // wrap functions that only take 1 argument
  if (file_fn.length === 1) {
    file_fn = (function (fn) {
      return function (root, file) {
        fn(path.join(root, file));
      }
    }(file_fn));
  }
  // set dir_fn equal to file_fn if not specified
  if (dir_fn === undefined) {
    dir_fn = file_fn;
  } else {
    if (dir_fn.length === 1) {
      dir_fn = (function (fn) {
        return function (root, file) {
          fn(path.join(root, file));
        }
      }(dir_fn));
    }
  }
  // setup default options and variables
  var parts = name.split(/\\|\//)
    , include_dirs = options.include_dirs === undefined ? false : options.include_dirs
    , include_files = options.include_files === undefined ? true : options.include_files
    , include_all = options.include_all === undefined ? false : options.include_all
    , recursive = options.recursive === undefined ? false : options.recursive
    , callback = options.callback || function () { console.log('done with finddir')}
    , root
  ;
  // set root path to filesystem root or current directory
  // or first stable part of search path
  if (parts[0] === '') {
    parts.shift();
    root = '/';
  } else {
    root = '.';
  }
  while (parts.length > 0 && !(/[\*\?\[\]]/.test(parts[0]))) {
    root = path.join(root, parts.shift());
  }
  //console.log('matching:', root, parts);
  // ensure root path exists
  fs.stat(root, function (err, stats) {
    if (err) throw err;
    if (parts.length > 0) {
      match_files('', parts, callback);
    } else if (recursive) {
      list_files('', callback);
    } else {
      // return early if there is no wildcards to match
      if (stats.isDirectory()) {
        include_dirs && dir_fn('', root);
      }
      if (stats.isFile()) {
        include_files && file_fn(root.slice(0, -path.basename(root).length), path.basename(root));
      }
      callback();
    }
  })
  // function to recursively search wildcard paths
  function match_files (dir, patterns, callback) {
    //console.log('find:', root, dir, patterns);
    // translate file matching patterns to regexp
    var pattern = RegExp('^' +
                         patterns[0]
                           .replace(/\./g, '\\.')
                           .replace(/\*/g, '.*')
                           .replace(/\?/g, '.')
                         + '$');
    //console.log('reading from ', path.join(root, dir));
    fs.readdir(path.join(root, dir), function (err, files) {
      if (err) {
        console.error('error reading directory ' + path.join(root, dir));
        callback(err);
      }
      cb = callback_counter(files.length, function () {
        //console.log('done with match_files' + dir);
        callback();
      }, 'match_files:'+dir);
      files.forEach(function (file) {
        //console.log('match_file:', root, dir, file);
        if (pattern.test(file)) {
          if (include_all || file[0] !== '.' || patterns[0][0] === '.') {
            file = path.join(dir, file);
            fs.stat(path.join(root, file), function (err, stats) {
              if (patterns.length > 1) {
                if (patterns[1] === '') {
                  if (stats.isDirectory()) {
                    include_dirs && dir_fn(root, file);
                    recursive ? list_files(file, cb) : cb('skip directory:'+file);
                  } else {
                    cb('skip non directory:'+file);
                  }
                } else {
                  if (stats.isDirectory()) {
                    match_files(file, patterns.slice(1), cb);
                  } else {
                    cb('skip early file:'+file);
                  }
                }
              } else {
                if (stats.isDirectory()) {
                  include_dirs && dir_fn(root, file);
                  recursive ? list_files(file, cb) : cb('skip directory:'+file);
                }
                if (stats.isFile()) {
                  include_files && file_fn(root, file);
                  cb(file);
                }
              }
            });
          } else {
            cb('skip dot file: ' + file);
          }
        } else {
          cb('no match: ' + file);
        }
      })
      //console.log('not done with match_files');
    });
  }
  // function to recusively list all files and directories
  function list_files (dir, callback) {
    //console.log('list:', dir);
    fs.readdir(path.join(root, dir), function (err, files) {
      if (err) {
        console.error('error reading directory ' + path.join(root, dir));
        callback(err);
      }
      var cb = callback_counter(files.length, function () {
        //console.log('done with list_files ' + dir);
        callback('list_files:'+dir);
      }, 'list_files:' + dir);
      files.forEach(function (file) {
        if (include_all || file[0] !== '.') {
          file = path.join(dir, file);
          fs.stat(path.join(root, file), function (err, stats) {
            if (stats.isDirectory()) {
              include_dirs && dir_fn(root, file);
              list_files(file, cb);
            } else
            if (stats.isFile()) {
              include_files && file_fn(root, file);
              cb();
            } else {
              cb();
            }
          });
        } else {
          cb();
        }
      });
      //console.log('not done with list_files ' + dir);
    });
  }
  //console.log('not done with finddir');
}

function callback_counter (count, callback, name) {
  if (count === 0) {
    callback();
  }
  var i = 0;
  function cb (info) {
    i += 1;
    //console.log('called ' + name + ' ' + i + ' of ' + count + ': ' + info);
    if (i >= count) {
      callback();
    }
  }
  cb.status = function () {
    console.log('called ' + i + ' of ' + count);
    return i;
  }
  cb.count = function () {
    return count;
  }
  return cb;
}

exports.Exec = Exec;
exports.finddir = finddir;