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

/*
function syncPromise(f) {
  var b = new block();
  return function(...args) {
    var result;
    var error;
    f.call(this, ...args).then(
      res=>result = res
    ).catch(
      err=>error = err
    ).done(
      ()=>b.done()
    );
    b.wait();
    if(error){throw error;}
    return result;
  };
}
 */

/*
function syncPromise(f) {
  var b = new block();
  var proxyHandler = {
    get: function(target, name) {
      if(name in target || name !== 'o'){
        if(name === 'then'){
          return syncPromise(target[name]);
        }
        return target[name];
      }
      var error, result;
      b.start();
      target.then(
        res => result = res
      ).catch(
        err => error = err
      ).done(
        () => b.done()
      );
      b.wait();
      if(error){throw error;}
      return result;
    }
  };
  return function(...args) {
    return new Proxy(f.call(this, ...args), proxyHandler);
  };
}
*/

function syncPromise(t) {
  var proxyHandler = {
    get: function(target, name) {
      if(name !== 'o' || !('then' in target) || name in target){
        return syncPromise(target[name]);
      }
      var error, result;
      var b = new block();
      b.start();
      target.then(
        res => result = res
      ).catch(
        err => error = err
      ).done(
        () => b.done()
      );
      b.wait();
      if(error){throw error;}
      return syncPromise(result);
    }
  };

  if(typeof t === 'object')
    return new Proxy(t, {
      get: function(target, name) {
        if(name==='__PROXY_TARGET__') return t;
        return syncPromise(target[name]);
      }
    });

  if(typeof t === 'function')
    return new Proxy(function(...args) {
      var _t = this.__PROXY_TARGET__ || this;
      var result = t.call(_t, ...args);
      if(typeof result === 'object' || typeof result==='function')
        return new Proxy(result, proxyHandler);
      return result;
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
  return t;
}

module.exports = {
  syncCallback,
  syncPromise
};
/*
var Promise = require('bluebird');

function async(){
  console.log(this);
  return Promise.delay(1000).then(()=>'done');
}

function async_obj(){
  this.h='a';
  this.e = async;
  this.l = function() {
    console.log('ffff',this.h);
    return {
      l:'aaa',
      f: async
    };
  };
}

bb=new async_obj();

async.async = async;
var s = syncPromise(new async_obj());



function a(){
  console.log(this);
}
a.b=function(){
  console.log(this.c);
}
a.c='asdf';
*/
