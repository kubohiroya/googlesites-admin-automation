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

var actions, client, exec, init, main, webdriverio, process, result = {};

actions = {
  'start': function(client, params, next) {
    return next('googleAccount.enterEmail');
  },

  'googleAccount.enterEmail': function(client, params, next) {
    return client.url('https://accounts.google.com/ServiceLogin?sacu=1').then(function(){
      return client.isExisting('#Passwd').then(function(isExisting) {
        //ログイン中にパスワードを再入力する場合
        if(isExisting){
          return next('googleAccount.enterPass');
        }else{
          return client.setValueFor('#Email', params.owner.email).then(function() {
            return client.clickFor('#next').then(function() {
              return next('googleAccount.enterPass');
            });
          });
        }
      })
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
        if(process === 'getSitePermissions'){
          return next('googleSite.getPermissionSite');
        }else{
          return next('googleSite.setPermissionSite');
        }
      });
    });
  },

  'googleSite.getPermissionSite': function(client, params, next) {
    return utils.scopeIframe(client, SEL.IFRAME_SHARE_SETTING, TOUT_MS).then(function(){
      return client.getTextFor(SEL.REGISTERD_ALL_USERS).then(function(registeredUsers){
        return client.getTextFor(SEL.REGISTERD_PERMISSIONS).then(function(registeredPermissions){
          result = utils.editPermissionObj(registeredUsers, registeredPermissions);
          return next('googleSite.getPermissionPage');
        });
      });
    });
  },

  'googleSite.getPermissionPage': function(client, params, next) {
    function getPermissionPageEach(permission){
      var goPageSharingPermissions = function(){
        var d = q.defer();
        client.url(permission.pageURL).then(function(){
          return client.clickFor(SEL.BTN_SHARE).then(function(){
            return d.resolve();
          });
        });
        return d.promise;
      };

      var getPermissions = function(){
        var d = q.defer();
        return utils.scopeIframe(client, SEL.IFRAME_SHARE_SETTING, TOUT_MS).then(function(){
          return client.getTextFor(SEL.REGISTERD_ALL_USERS).then(function(registeredUsers){
            return client.getTextFor(SEL.REGISTERD_PERMISSIONS).then(function(registeredPermissions){
              var obj = utils.editPermissionObj(registeredUsers, registeredPermissions);
              obj.pageURL = permission.pageURL;
              result.permissions.push(obj);
              return d.resolve();
            });
          });
        });
        return d.promise;
      };

      return q.when()
        .then(goPageSharingPermissions)
        .then(getPermissions)
      ;
    }

    result.permissions = [];
    var d = q.defer();
    return client.then(function(){
      async.forEachSeries(params.permissions, function(permission, cb){
        getPermissionPageEach(permission).then(function(){
          cb();
        });
       }, function() {
         d.resolve();
      });
      return d.promise;
    }).then(function(){
       return next('end');
    });
  },

  'googleSite.setPermissionSite': function(client, params, next) {
    function setPermissionSiteEach(permission){
      var enterEmail = function(){
        var d = q.defer();
        client.setValueFor(SEL.INVITE_EMAIL, permission.email).then(function(){
          return d.resolve();
        });
        return d.promise;
      };

      var selectPermission = function(){
        var d = q.defer();
        //リストボックスを選択
        client.clickFor(SEL.INVITE_PERMISSION_LIST).then(function(){
          //オプションを選択
          var sel = sprintf(SEL.INVITE_PERMISSION_LIST_OPTION, utils.getLevelText(permission.level));
          return client.clickFor(sel).then(function(){
            return d.resolve();
          });
        });
        return d.promise;
      };

      var clickSendNotice = function(){
        var d = q.defer();
        client.clickFor(SEL.INVITE_EMAIL).then(function(){
        //メールで通知をOFF
          return client.clickFor(SEL.SEND_NOTICE).then(function(){
            return d.resolve();
          });
        });
        return d.promise;
      };

      var registUser = function(){
        var d = q.defer();
        //OKボタン押下
        client.clickFor(SEL.OK).then(function(){
          //OK(再確認)ボタン押下
          return client.clickFor(SEL.OK_CONFIRM).then(function(){
            //登録が完了するまで待つ
            return client.waitForVisible(SEL.INVITE_EMAIL, TOUT_MS).then(function(){
              return d.resolve();
            });
          });
        });
        return d.promise;
      };

      return q.when()
        .then(clickSendNotice)
        .then(enterEmail)
        .then(selectPermission)
        .then(registUser)
        ;
    }

    var d = q.defer();
    return utils.scopeIframe(client, SEL.IFRAME_SHARE_SETTING, TOUT_MS).then(function(){
      async.forEachSeries(utils.editPermissionList(params), function(permission, cb){
        setPermissionSiteEach(permission).then(function(){
          cb();
        });
       }, function() {
         d.resolve();
      });
      return d.promise;
    }).then(function(){
         return next('googleSite.setEnablePagePermisson');
    });
  },

  'googleSite.setEnablePagePermisson': function(client, params, next) {
    function enablePagePermission(){
      return client.clickFor(SEL.PAGE_ENABLE).then(function(){
        return client.clickFor(SEL.PAGE_ENABLE_CONFIRM).then(function(){
          return client.waitForVisible(SEL.PAGE_DISABLE);
        });
      });
    }

    return client.refresh().then(function(){
      return client.isVisible(SEL.PAGE_ENABLE).then(function(isVisible){
        if(isVisible){
          return enablePagePermission();
        }else{
          console.log("alredy enabled.");
        }
      }).then(function(){
        return next('googleSite.setPermissionPage');
      });
    });
  },

  'googleSite.setPermissionPage': function(client, params, next) {
    function deleteNoNeedUser(needUsers){
      var selectUsersToDelete = function(users){
        var d = q.defer();
        async.forEachSeries(users, function(user, cb){
          client.clickFor(sprintf(SEL.DELETE_SELECT, user)).then(function(){
            cb();
          });
        }, function() {
           return d.resolve();
        });
        return d.promise;
      };

      var saveToDelete = function(){
        var d = q.defer();
        return client.clickFor(SEL.DELETE_SAVE).then(function(){
          return client.waitUntil(function(){
            return client.isVisible(SEL.DELETE_ALERT).then(function(isVisible){
              return !isVisible;
            });
          }).then(function(){
            return d.resolve();
          });
        });
        return d.promise;
      };

      return utils.scopeIframe(client, SEL.IFRAME_SHARE_SETTING, TOUT_MS).then(function(){
        return client.getTextFor(SEL.REGISTERD_ENABLED_USERS).then(function(registeredUsers){
          var users = utils.getNoNeedUsers(registeredUsers, needUsers);
          if(users.length === 0){
            console.log('User to be deleted does not exist.');
            return;
          }
          return q.when(users)
            .then(selectUsersToDelete)
            .then(saveToDelete)
          ;
        });
      });
    }

    function setPermissionPageEach(permission){
      var goPageSharingPermissions = function(){
        var d = q.defer();
        client.url(permission.pageURL).then(function(){
          return client.clickFor(SEL.BTN_SHARE).then(function(){
            return d.resolve();
          });
        });
        return d.promise;
      };

      var openPermissionModal = function(){
        var d = q.defer();
        client.clickFor(SEL.BTN_CHANGE).then(function(){
            return d.resolve();
          });
        return d.promise;
      };

      var selectPermissionCustom = function(){
        var d = q.defer();
        client.clickFor(SEL.RADIO_CUSTOM).then(function(){
          return d.resolve();
        });
        return d.promise;
      };

      var selectPermissionIndependent = function(){
        var d = q.defer();
        client.clickFor(SEL.RADIO_INDEPENDENT).then(function(){
          return d.resolve();
        });
        return d.promise;
      };

      var savePermission = function(){
        var d = q.defer();
        client.clickFor(SEL.PERMISSION_SAVE).then(function(){
            //TODO:モーダルウィンドウが前面に表示されていてクリックできない（SEL.DELETE_SELECT）場合がある問題の暫定的な対応
            return client.pause(TOUT_MS / 2).then(function() {
              return d.resolve();
            });
        });
        return d.promise;
      };

      return q.when()
        .then(goPageSharingPermissions)
        .then(openPermissionModal)
        .then(selectPermissionCustom)
        .then(selectPermissionIndependent)
        .then(savePermission)
      ;
    }

    var d = q.defer();
    return client.then(function(){
      async.forEachSeries(params.permissions, function(permission, cb){
        setPermissionPageEach(permission).then(function(){
          var permissionList = {editors: permission.editors, viewers:permission.viewers};
          deleteNoNeedUser(utils.editPermissionList(permission)).then(function(){
            cb();
          });
        });
       }, function() {
         d.resolve();
      });
      return d.promise;
    }).then(function(){
       return next('end');
    });
  },
};

exec = function(client, params, action) {
  var d, next;
  d = q.defer();
  next = function(nextActionName) {
    if(params.notNext){
      return d.resolve(nextActionName);
    }
    if (nextActionName === 'end') {
      console.log('end');
      process = void 0;
      return d.resolve();
    } else if (actions[nextActionName]) {
      console.log('action:', nextActionName);
      return exec(client, params, actions[nextActionName]).then(function() {
        return d.resolve(result);
      });
    } else {
      console.log('unknown action name', nextActionName);
      process = void 0;
      return d.reject();
    }
  };

  action(client, params, next)
    .catch(function(err){
      process = void 0;
      d.reject(err);
    });
  return d.promise;
};

init = function(){
  result = {};
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
  return exec(client, params, actions[startActionName]);
};

module.exports.init = function (clientArg) {
  client = clientArg;
  init();
};

/**
 *
 * Googleサイトの権限を設定します
 *　ページごとの権限も含まれます
 *
 * <example>
 *  var CONFIG = {
 *      siteURL: 'https://sites.google.com/',
 *      owner: {
 *          email: 'hoge@hoge.com',
 *          password:'hogehoge'
 *      },
 *      editors: [
 *          'testuser04@hoge.com'
 *      ],
 *      viewers: [
 *          'testuser03@hoge.com'
 *      ],
 *      permissions: [
 *          {
 *              pageURL: 'https://sites.google.com/page1',
 *              editors: [
 *                  'testuser02@hoge.com'
 *              ],
 *              viewers: [
 *                  'testuser03@hoge.com'
 *              ]
 *          }
 *      ]
 *  }
 *  var client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
 *  gAA.setSitePermissions(client, CONFIG);
 * </example>
 *
 * @param {Object} clientArg      webdriverio Object
 * @param {Object} params         権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.setSitePermissions = function (clientArg, params) {
  client = clientArg;
  process = 'setSitePermissions';
  return main(params, 'start');
};

/**
 *
 * Googleサイトに設定された権限を取得します
 *　ページごとの権限も含まれます
 *
 * <example>
 *  var client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
 *  gAA.getSitePermissions(client, CONFIG).then(function(result){
 *    console.log(result);
 * });
 * </example>
 *
 * @param {Object} clientArg      webdriverio Object
 * @param {Object} params         権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.getSitePermissions = function (clientArg, params) {
  client = clientArg;
  process = 'getSitePermissions';
  return main(params, 'start');
};

/**
 *
 * GoogleアカウントでEmailを入力します
 *
 * <example>
 *  gAA.enterEmail(CONFIG);
 * </example>
 *
 * @param {Object} params         権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.enterEmail = function (params) {
  params.notNext = true;
  return exec(client, params, actions['googleAccount.enterEmail']);
};

/**
 *
 * GoogleアカウントでPasswordを入力します
 *
 * <example>
 *  gAA.enterPass(CONFIG);
 * </example>
 *
 * @param {Object} params         権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.enterPass = function (params) {
  params.notNext = true;
  return exec(client, params, actions['googleAccount.enterPass']);
};

/**
 *
 * Googleサイトの権限設定画面に遷移します
 *
 * <example>
 *  gAA.goSharingPermissions(CONFIG);
 * </example>
 *
 * @param {Object} params         権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.goSharingPermissions = function (params) {
  params.notNext = true;
  return exec(client, params, actions['googleSite.goSharingPermissions']);
};

/**
 *
 * Googleサイトのサイトレベルでのユーザ毎権限を設定します
 *
 * <example>
 *  gAA.setPermissionSite(CONFIG);
 * </example>
 *
 * @param {Object} params         権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.setPermissionSite = function (params) {
  params.notNext = true;
  return exec(client, params, actions['googleSite.setPermissionSite']);
};

/**
 *
 * Googleサイトのページレベルのユーザ毎権限を有効化します
 *
 * <example>
 *  gAA.setEnablePagePermisson(CONFIG);
 * </example>
 *
 * @param {Object} params         権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.setEnablePagePermisson = function (params) {
  params.notNext = true;
  return exec(client, params, actions['googleSite.setEnablePagePermisson']);
};

/**
 *
 * Googleサイトのページごとに権限を設定します
 *
 * <example>
 *  gAA.setPermissionPage(CONFIG);
 * </example>
 *
 * @param {Object} params         権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.setPermissionPage = function (params) {
  params.notNext = true;
  return exec(client, params, actions['googleSite.setPermissionPage']);
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
