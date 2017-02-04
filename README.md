# callback-hello

A lightweight tool for testing asynchronous functions in repl happily. Should NOT be used in production environment.

## Installation

npm i https://github.com/knilink/callback-hello.git

## Usage

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
sync_callback(1,2); // -> [ 1, 2, undefined, undefined ];
```
Function will run asynchronously by giving a callback function.
```js
sync_callback(1,2,3,false,(err,result)=>{
  console.log(result);
});
```

### promise
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
  recursion: async_obj,
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
var sync_obj = syncPromise(async_obj);
sync_obj.value;                      // -> 'h'
sync_obj.sync('e');                  // -> 'e'
sync_obj.sync(async_promise('l')).o; // -> 'l'
sync_obj.async('l').o;               // -> 'l'
sync_obj.recursion.async('o').o;     // -> 'o'
sync_obj.complex('callback').o.another_async('hello').o; // -> callback-hello
```
## Limitations
There will be a exception for syncCallback if the async function contain default value.
```js
syncCallback(function(a,b='b',callback){...})('a','b');
// -> exception: callback is not a function
```

## License

MIT
