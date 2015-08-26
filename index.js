var q     = require('q');
var async = require('async');
var sprintf = require('util').format;
var utils = require('./lib/utils');
var DF = require('./define.conf');
var URL = DF.URL;
var SEL = DF.SELECTOR;
var TITLE = DF.TITLE;
var EMESSAGE = DF.EMESSAGE;
var TOUT_MS = DF.TIME_OUT_MS;

var actions, client, exec, init, main, options, q, webdriverio;

actions = {
  'start': function(client, params, next) {
    return next('googleAccount.enterEmail');
  },

  'googleAccount.enterEmail': function(client, params, next) {
    return client.url('https://accounts.google.com/ServiceLogin?sacu=1').then(function(){
      return client.setValueFor('#Email', params.owner.email).then(function() {
        return client.clickFor('#next').then(function() {
          return next('googleAccount.enterPass');
        });
      });
    });
  },

  'googleAccount.enterPass': function(client, params, next) {
    return client.setValueFor('#Passwd', params.owner.password).then(function() {
      return client.clickFor('#signIn').then(function() {
        return client.waitForExist("//a[contains(@title, '" + params.owner.email + "')]", TOUT_MS).then(function(){
          return next('googleSite.goSharingPermissions');
        });
      });
    });
  },

  'googleSite.goSharingPermissions': function(client, params, next) {
    return client.url(params.siteURL + URL.COMMON_SHARING).then(function(){
      return client.getTitle().then(function(txt){
        if(txt.indexOf(TITLE.NOT_OWNER) !== -1){
          throw new Error(EMESSAGE.NOT_OWNER);
        }else if(txt.indexOf(TITLE.PAGE_NOTFOUND_FIREFOX) !== -1
              || txt.indexOf(TITLE.PAGE_NOTFOUND_CHROME)　!== -1){
          throw new Error(EMESSAGE.PAGE_NOTFOUND);
        }
        return next('end');
      });
    });

  }
};

exec = function(client, params, action) {
  var d, next;
  d = q.defer();
  next = function(nextActionName) {
    if(params.notNext){
      return d.resolve(nextActionName);
    }
    if (nextActionName === 'end') {
      return d.resolve();
    } else if (actions[nextActionName]) {
      console.log('action:', nextActionName);
      return exec(client, params, actions[nextActionName]).then(function() {
        return d.resolve();
      });
    } else {
      console.log('unknown action name', nextActionName);
      return d.reject();
    }
  };
  action(client, params, next);
  return d.promise;
};

init = function(){
  client.actionFor = function(selector, action) {
    return client.waitForExist(selector, TOUT_MS).then(function() {
      return client.waitForVisible(selector, TOUT_MS).then(function() {
        return action();
      });
    });
  };

  client.clickFor = function(selector) {
    var d;
    d = q.defer();
    client.actionFor(selector, function() {
      return client.click(selector).then(function() {
        return d.resolve();
      });
    });
    return d.promise;
  };

  client.setValueFor = function(selector, value) {
    var d;
    d = q.defer();
    client.actionFor(selector, function() {
      return client.setValue(selector, value).then(function() {
        return d.resolve();
      });
    });
    return d.promise;
  };

  client.getTextFor = function(selector) {
    var d;
    d = q.defer();
    client.actionFor(selector, function() {
      return client.getText(selector).then(function(text) {
        return d.resolve(text);
      });
    });
    return d.promise;
  };
};

main = function(params, startActionName) {
  init();
  return exec(client, params, actions[startActionName]).then(function() {
    return console.log('done');
  });
};

module.exports.setSitePermissions = function (clientArg, params) {
  client = clientArg;
  return main(params, 'start');
};




module.exports.enterEmail = function (params) {
  params.notNext = true;
  return exec(client, params, actions['googleAccount.enterEmail']);
};

module.exports.enterPass = function (params) {
  params.notNext = true;
  return exec(client, params, actions['googleAccount.enterPass']);
};

module.exports.init = function (clientArg) {
  client = clientArg;
  init();
};

// module.exports.enterEmail = function (params) {
//   var d, next;
//   d = q.defer();
//   var action = actions['googleAccount.enterEmail'];
//   action(client, params, function(nextActionName){
//     return d.resolve(nextActionName);
//   });
//   return d.promise;
// };
