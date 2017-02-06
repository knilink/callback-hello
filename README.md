# callback-hello

A lightweight tool for testing asynchronous functions in repl happily. Should NOT be used in production environment.

## Installation

npm i https://github.com/knilink/callback-hello.git

## Example

### Prepare
```js
var { syncCallback, syncPromise } = require('./o.js');

function async_callback(a,b,c,rejected,cb){
  setTimeout(()=>rejected?cb(rejected):cb(null,[a,b,c]),1000);
}

function async_promise(result,rejected=false){
  return new Promise(function(resolve, reject) {
    setTimeout(()=>{
      rejected?reject('boom'):resolve(result);
    },1000);
  });
}
```

### Callback
```js
var sync_callback = syncCallback(async_callback);
sync_callback(1,2); // -> [ 1, 2, undefined ];
```
Function will run asynchronously by giving a callback function.
```js
sync_callback(1,2,3,false,(err,result)=>{
  console.log(result);
});
```

### Promise
```js
var sync_promise = syncPromise(async_promise);
sync_promise('done').o; // -> 'done'

// chaining
sync_promise('callback').then(a=>a+'-hello').o; // -> 'callback-hello'

// object
var async_obj = {
  value:'h',
  sync:a=>a,
  async:async_promise,
  complex: a=>{
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        resolve({
          another_async:b=>async_promise(a+'-'+b)
        });
      },1000);
    });
  }
};
async_obj.circular = async_obj;
var sync_obj = syncPromise(async_obj);
sync_obj.value;                      // -> 'h'
sync_obj.sync('e');                  // -> 'e'
sync_obj.sync(async_promise('l')).o; // -> 'l'
sync_obj.async('l').o;               // -> 'l'
sync_obj.circular.async('o').o;      // -> 'o'
sync_obj.complex('callback').o.another_async('hell').o+'o'; // -> 'callback-hello'
```
## Limitations
There will be an exception for syncCallback if the async function contain default values.
```js
syncCallback(function(a,b='b',callback){...})('a','b');
// -> exception: callback is not a function
```

After applying syncPromise all functions and objects are wrapped by proxies. Simply passing the wrapped objects will protentially break a 3rd-party api. Especially for those which was not written in js. Take nodegit as an example.
```js
var nodegit = require('nodegit');
var syncPromise = require('callback-hello').syncPromise;
var repo = syncPromise(nodegit).Repository.open('.').o;
nodegit.Reference.nameToId(repo, 'HEAD');
//node: ../../nan/nan_object_wrap.h:33: static T* Nan::ObjectWrap::Unwrap(v8::Local<v8::Object>) [with T = GitRepository]: Assertion `object->InternalFieldCount() > 0' failed.
```
The nodegit core received the proxy object causing assertion `object->InternalFieldCount() > 0' failed.
To prevent this issue.
```
// wrap nodegit as well, so it can recognize and revoke the wrapped object
syncProxy(nodegit).Reference.nameToId(repo, 'HEAD');
// or manually revoke the object
nodegit.Reference.nameToId(repo.__PROXY_TARGET__, 'HEAD');
```
where '__PROXY_TARGET__' is a keyword for identifying the proxies created by syncPromise.

## License

MIT
