var runLoopOnce = require('deasync').runLoopOnce;

function block() {
  var done = false;
  this.start = function() {
    done = false;
  };
  this.wait = function() {
    while(!done) {runLoopOnce();}
  };
  this.done = function() {
    done=true;
  };
}

function syncCallback(f) {
  var b = new block();
  return function(...args) {
    if(args.length >= f.length) {
      return f(...args);
    }
    var result;
    var error;
    args[f.length-1] = function(err, res) {
      b.done();
      err ? error=err : result=res;
    };
    b.start();
    f.call(this, ...args);
    b.wait();
    if(error) throw error;
    return result;
  };
}

function syncPromise(t) {

  if(typeof t === 'object'){
    return new Proxy(t, {
      get: function(target, name) {
        if(name==='__PROXY_TARGET__') return t;
        if(name !== 'o' || !('then' in target) || name in target){
          return syncPromise(target[name]);
        }
        var error, result;
        var b = new block();
        b.start();
        target.then(res => {
          result = res;
          b.done();
        }).catch(err => {
          error = err;
          b.done();
        });
        b.wait();
        if(error){throw error;}
        return syncPromise(result);
      }
    });
  }

  if(typeof t === 'function'){
    return new Proxy(function(...args) {
      var _t = this.__PROXY_TARGET__ || this;
      var result = t.call(_t, ...args);
      return syncPromise(result);
    }, {
      get: function(_, name) {
        if(name==='__PROXY_TARGET__') return t;
        if(name==='call' || name =='apply' ){
          return function(...args) {
            return syncPromise(t[name](...args));
          };
        }
        return syncPromise(t[name]);
      }
    });
  }

  return t;
}

module.exports = {
  syncCallback,
  syncPromise
};
