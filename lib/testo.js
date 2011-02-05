var 
  assert = require('assert'),
  sys = require('sys');

testo = {
  errors: [],

  error: function(error) {
    this.errors.push(error);
    sys.print("F");
  },

  equal: function(actual, expected, message) {
    try {
      assert.equal(actual, expected, message); 
      sys.print(".");
    } catch(e) {
      this.error(e.message+", expected '"+e.expected+"', got '"+e.actual+"'"); 
    }
  },

  notEqual: function(actual, expected, message) {
    try {
      assert.notEqual(actual, expected, message); 
      sys.print(".");
    } catch(e) {
      this.error(e.message+", did not expect '"+e.actual+"'"); 
    }
  },

  start: function(title) {
    sys.print(" ● "+title+"\n   ");
  }, 

  finish: function() {
    if (this.errors.length == 0) {
      sys.print(" ✓\n");
      return;
    }
    sys.print(" ✕\n");
    for(var i=0; i < this.errors.length; i++) {
      sys.puts("   "+(i+1)+") "+this.errors[i]);
    };
    this.errors = [];
  }
};

module.exports = testo;
