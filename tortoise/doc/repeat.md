repeat
======

Summary
-------

Creates a loop that repeats infinitely or a set number of times with an optional variable.

Syntax
------

    repeat [(count[, name])] {
      statements
    }

Parameters
----------

### count (optional)

A number of times to repeat the statments in the repeat body.

### name (optional)

A variable name that is the value of the current iteration. Counting starts at 0 and ends at `count - 1`.

Examples
--------

### Square Example

    repeat (4) {
      forward(100);
      right(90);
    }

### Variable Example

    repeat (10, i) {
      logln(i);
    }

### While Loop

    repeat {
      if (random() < 0.1) {
        break;
      }
      forward(10);
      right(5);
    }

### Until Loop

    repeat {
      forward(10);
      right(5);
      if (random() < 0.1) {
        break;
      }
    }

### Loop and a Half

    repeat {
      forward(10);
      if (random() < 0.1) {
        break;
      }
      right(5);
    }

Notes
-----

Infinite Loops must have a break statement that will be executed otherwise the program will appear to hang.