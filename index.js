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

var init = function(context){
  var client = context.client;
  client.actionFor = function(selector, action) {
    return client.waitForExist(selector, TOUT_MS).then(function() {
      return client.waitForVisible(selector, TOUT_MS).then(function() {
        return action();
      });
    });
  };

  client.clickFor = function(selector) {
    return client.actionFor(selector, function() {
      return client.click(selector);
    });
  };

  client.setValueFor = function(selector, value) {
    return client.actionFor(selector, function() {
      return client.setValue(selector, value);
    });
  };

  client.getTextFor = function(selector) {
    return client.actionFor(selector, function() {
      return client.getText(selector);
    });
  };
};

var steps = {
  googleAccount: {
    enterEmail: function(context) {
      var client = context.client;
      var params = context.params;
      var d = q.defer();
      client.url(URL.ACCOUNT_LOGIN).then(function(){
        return client.isExisting(SEL.ACCOUNT_PASS).then(function(isExisting) {
          //ログイン中にパスワードを再入力する場合
          if(isExisting){
            d.resolve(context);
          }else{
            return client.setValueFor(SEL.ACCOUNT_EMAIL, params.owner.email).then(function() {
              return client.clickFor(SEL.ACCOUNT_NEXT).then(function() {
                d.resolve(context);
              });
            });
          }
        });
      });
      return d.promise;
    },

    enterPass: function(context) {
      var client = context.client;
      var params = context.params;
      var d = q.defer();
      client.setValueFor(SEL.ACCOUNT_PASS, params.owner.password).then(function() {
        return client.clickFor(SEL.ACCOUNT_SIGNIN).then(function() {
          return client.waitForExist(sprintf(SEL.LOGINED, params.owner.email), TOUT_MS).then(function(){
            d.resolve(context);
          });
        });
      });
      return d.promise;
    }
  },

  googleSite: {
    goSharingPermissions: function(context) {
      var client = context.client;
      var params = context.params;
      var d = q.defer();
      client.url(params.siteURL + URL.COMMON_SHARING).then(function(){
        return client.getTitle().then(function(txt){
          if(txt.indexOf(TITLE.NOT_OWNER) !== -1){
            d.reject(new Error(EMESSAGE.NOT_OWNER));
          }else if(txt.indexOf(TITLE.PAGE_NOTFOUND_FIREFOX) !== -1
                || txt.indexOf(TITLE.PAGE_NOTFOUND_CHROME) !== -1){
            d.reject(new Error(EMESSAGE.SITE_NOTFOUND));
          }
          d.resolve(context);
        });
      });
      return d.promise;
    },

    setPermissionSite: function(context) {
      var client = context.client;
      var params = context.params;
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
           d.resolve(context);
        });
        return d.promise;
      });
    },

    setEnablePagePermisson: function(context) {
      var client = context.client;
      var params = context.params;
      function enablePagePermission(){
        return client.clickFor(SEL.PAGE_ENABLE).then(function(){
          return client.clickFor(SEL.PAGE_ENABLE_CONFIRM).then(function(){
            return client.waitForVisible(SEL.PAGE_DISABLE);
          });
        });
      }

      var d = q.defer();
      return client.refresh().then(function(){
        client.isVisible(SEL.PAGE_ENABLE).then(function(isVisible){
          if(isVisible){
            enablePagePermission();
          }else{
            console.log("alredy enabled.");
          }
          d.resolve(context);
        });
        return d.promise;
      });
    },

    setPermissionPage: function(context) {
      var client = context.client;
      var params = context.params;
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
            return client.getTitle().then(function(txt){
              if(txt.indexOf(TITLE.NOT_OWNER) !== -1){
                throw new Error(EMESSAGE.NOT_OWNER);
              }else if(txt.indexOf(TITLE.PAGE_NOTFOUND_FIREFOX) !== -1
                    || txt.indexOf(TITLE.PAGE_NOTFOUND_CHROME) !== -1){
                return d.reject(new Error(EMESSAGE.PAGE_NOTFOUND));
              }
              return client.clickFor(SEL.BTN_SHARE).then(function(){
                return d.resolve();
              });
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
          }).catch(function(err){
            d.reject(err);
          });
         }, function() {
           d.resolve(context);
        });
        return d.promise;
      });
    },

    getPermissionSite: function(context) {
      var client = context.client;
      var params = context.params;
      var d = q.defer();
      return utils.scopeIframe(client, SEL.IFRAME_SHARE_SETTING, TOUT_MS).then(function(){
        client.getTextFor(SEL.REGISTERD_ALL_USERS).then(function(registeredUsers){
          return client.getTextFor(SEL.REGISTERD_PERMISSIONS).then(function(registeredPermissions){
            context.getPermissionSite = utils.editPermissionObj(registeredUsers, registeredPermissions);
            d.resolve(context);
          });
        });
        return d.promise;
      });
    },

    getPermissionPage: function(context) {
      var client = context.client;
      var params = context.params;
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
                context.getPermissionPage.push(obj);
                d.resolve(context);
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

      context.getPermissionPage = [];
      var d = q.defer();
      return client.then(function(){
        async.forEachSeries(params.permissions, function(permission, cb){
          getPermissionPageEach(permission).then(function(){
            cb();
          });
         }, function() {
           d.resolve(context);
        });
        return d.promise;
      });
    }
  }
};

module.exports.setSitePermissions = function (clientArg, paramsArg) {
  var context = {client: clientArg, params: paramsArg};
  init(context);

  return q.when(context)
    .then(steps.googleAccount.enterEmail)
    .then(steps.googleAccount.enterPass)
    .then(steps.googleSite.goSharingPermissions)
    .then(steps.googleSite.setPermissionSite)
    .then(steps.googleSite.setEnablePagePermisson)
    .then(steps.googleSite.setPermissionPage)
    .then(function(context){
      var d = q.defer();
      d.resolve();
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
    ;
};

module.exports.getSitePermissions = function (clientArg, paramsArg) {
  var context = {client: clientArg, params: paramsArg};
  init(context);

  return q.when(context)
    .then(steps.googleAccount.enterEmail)
    .then(steps.googleAccount.enterPass)
    .then(steps.googleSite.goSharingPermissions)
    .then(steps.googleSite.getPermissionSite)
    .then(steps.googleSite.getPermissionPage)
    .then(function(context){
      var d = q.defer();
      d.resolve({
        viewers: context.getPermissionSite.viewers,
        editors: context.getPermissionSite.editors,
        permissions: context.getPermissionPage
      });
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
    ;
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
module.exports.enterEmail = function (clientArg, paramsArg) {
  var context = {client: clientArg, params: paramsArg};
  init(context);

  return q.when(context)
    .then(steps.googleAccount.enterEmail)
    .then(function(){
      var d = q.defer();
      d.resolve();
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
  ;
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
module.exports.enterPass = function (clientArg, paramsArg) {
  var context = {client: clientArg, params: paramsArg};
  init(context);

  return q.when(context)
    .then(steps.googleAccount.enterPass)
    .then(function(){
      var d = q.defer();
      d.resolve();
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
  ;
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
module.exports.goSharingPermissions = function (clientArg, paramsArg) {
  var context = {client: clientArg, params: paramsArg};
  init(context);

  return q.when(context)
    .then(steps.googleSite.goSharingPermissions)
    .then(function(){
      var d = q.defer();
      d.resolve();
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
  ;
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
module.exports.setPermissionSite = function (clientArg, paramsArg) {
  var context = {client: clientArg, params: paramsArg};
  init(context);

  return q.when(context)
    .then(steps.googleSite.setPermissionSite)
    .then(function(){
      var d = q.defer();
      d.resolve();
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
  ;
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
module.exports.setEnablePagePermisson = function (clientArg, paramsArg) {
  var context = {client: clientArg, params: paramsArg};
  init(context);

  return q.when(context)
    .then(steps.googleSite.setEnablePagePermisson)
    .then(function(){
      var d = q.defer();
      d.resolve();
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
  ;
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
module.exports.setPermissionPage = function (clientArg, paramsArg) {
  var context = {client: clientArg, params: paramsArg};
  init(context);

  return q.when(context)
    .then(steps.googleSite.setPermissionPage)
    .then(function(){
      var d = q.defer();
      d.resolve();
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
  ;
};