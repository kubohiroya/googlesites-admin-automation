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

      function waitUntil(){
        return client.waitForExist(SEL.ACCOUNT_PASS, TOUT_MS).then(function(){
          d.resolve(context);
        });
      }

      client.url(URL.ACCOUNT_LOGIN).then(function(){
        return client.isExisting(SEL.ACCOUNT_PASS).then(function(isExisting) {
          //ログイン中にパスワードを再入力する場合
          if(isExisting){
            d.resolve(context);
          }else{
            return client.setValueFor(SEL.ACCOUNT_EMAIL, params.owner.email).then(function() {
              return client.clickFor(SEL.ACCOUNT_NEXT).then(waitUntil);
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

      function checkCondition(){
        return client.waitForVisible(SEL.ACCOUNT_PASS, TOUT_MS).then(function(result){
          if(!result){
            d.reject(new Error(sprintf(EMESSAGE.ILLIGAL_STATE, 'enterPass()')));
          }
        });
      }

      function waitUntil(){
        return client.waitForExist(sprintf(SEL.LOGINED, params.owner.email), TOUT_MS).then(function(){
          d.resolve(context);
        });
      }

      checkCondition().then(function(){
        return client.setValueFor(SEL.ACCOUNT_PASS, params.owner.password).then(function() {
          return client.clickFor(SEL.ACCOUNT_SIGNIN).then(waitUntil);
        });
      });
      return d.promise;
    }
  },

  googleSite: {
    openAdminCommonSharing: function(context) {
      var client = context.client;
      var params = context.params;
      var d = q.defer();
      function checkCondition(){
        return client.waitForExist(sprintf(SEL.LOGINED, params.owner.email), TOUT_MS).then(function(result){
          if(!result){
            d.reject(new Error(sprintf(EMESSAGE.ILLIGAL_STATE, 'openAdminCommonSharing()')));
          }
        });
      }

      function waitUntil(){
        return client.getTitle().then(function(txt){
          if(txt.indexOf(TITLE.NOT_OWNER) !== -1){
            d.reject(new Error(EMESSAGE.NOT_OWNER));
          }else if(txt.indexOf(TITLE.PAGE_NOTFOUND_FIREFOX) !== -1
                || txt.indexOf(TITLE.PAGE_NOTFOUND_CHROME) !== -1){
            d.reject(new Error(EMESSAGE.SITE_NOTFOUND));
          }
          d.resolve(context);
        });
      }

      checkCondition().then(function(){
        return client.url(params.siteURL + URL.COMMON_SHARING).then(waitUntil);
      });
      return d.promise;
    },

    setSiteUsers: function(context) {
      function setSiteUsersEach(permission){
        var enterEmail = function(){
          var d = q.defer();
          client.setValueFor(SEL.INVITE_EMAIL, permission.email).then(function(){
            client.pause(1 * 1000).then(function(){ //TODO;StaleElementReferenceExceptionの仮対応
            client.waitForVisible(SEL.INVITE_EMAIL_SUGGEST, TOUT_MS).then(function(result){
              if(result){
                return d.resolve();
              }else{
                return d.reject(new Error(sprintf(EMESSAGE.NOT_EXIST_ACCOUNT, permission.email)));
              }
            });
            });
          });
          return d.promise;
        };

        var selectPermission = function(){
          var d = q.defer();
          //リストボックスを選択
          client.clickFor(SEL.INVITE_PERMISSION_LIST).then(function(){
            //オプションを選択
            var sel = sprintf(SEL.INVITE_PERMISSION_LIST_OPTION, permission.level);
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
          .fail(function(err){
            d.reject(err);
          })
          ;
      }

      var client = context.client;
      var params = context.params;
      var d = q.defer();

      return utils.scopeIframe(client, SEL.IFRAME_SHARE_SETTING, TOUT_MS).then(function(){
        async.forEachSeries(utils.editPermissionList(params), function(permission, cb){
          setSiteUsersEach(permission).then(function(){
            cb();
          });
         }, function() {
           client.frame();  //frameのフォーカスを移動したままだと、次のpromised stepにてエレメントが見つからない場合があるため。
           d.resolve(context);
        });
        return d.promise;
      });
    },

    setEnablePageLevelPermission: function(context) {
      var client = context.client;
      var params = context.params;
      function enablePageLevelPermission(){
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
            enablePageLevelPermission().then(function(){
              d.resolve(context);
            });
          }else{
            console.log("already enabled.");
            d.resolve(context);
          }
        });
        return d.promise;
      });
    },

    setPagePermission: function(context) {
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
            var users = utils.getUnrequiredUsers(registeredUsers, needUsers);
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

      function setPagePermissionEach(permission){
        var openPageAdminCommonSharing = function(){
          var d = q.defer();
          client.url(permission.pageURL).then(function(){
            return client.getTitle().then(function(txt){
              if(txt.indexOf(TITLE.NOT_OWNER) !== -1){
                return d.reject(new Error(EMESSAGE.NOT_OWNER));
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
          .then(openPageAdminCommonSharing)
          .then(openPermissionModal)
          .then(selectPermissionCustom)
          .then(selectPermissionIndependent)
          .then(savePermission)
        ;
      }

      var d = q.defer();
      client.then(function(){
        async.forEachSeries(params.permissions, function(permission, cb){
          setPagePermissionEach(permission).then(function(){
            var permissionList = {editors: permission.editors, viewers:permission.viewers};
            deleteNoNeedUser(utils.editPermissionList(permission)).then(function(){
              cb();
            });
          }).catch(function(err){
            d.reject(err);
          });
        }, function() {
           client.frame();  //frameのフォーカスを移動したままだと、次のpromised stepにてエレメントが見つからない場合があるため。
           d.resolve(context);
        });
      });
      return d.promise;
    },

    getSitePermission: function(context) {
      var client = context.client;
      var params = context.params;
      var d = q.defer();

      return utils.scopeIframe(client, SEL.IFRAME_SHARE_SETTING, TOUT_MS).then(function(){
        client.getTextFor(SEL.REGISTERD_ALL_USERS).then(function(registeredUsers){
          return client.getTextFor(SEL.REGISTERD_PERMISSIONS).then(function(registeredPermissions){
            context.getSitePermission = utils.getUsersByPermissions(registeredUsers, registeredPermissions);
            d.resolve(context);
          });
        });
        return d.promise;
      });
    },

    getPagePermission: function(context) {
      var client = context.client;
      var params = context.params;

      function getPagePermissionEach(permission){
        var openPageAdminCommonSharing = function(){
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
                var obj = utils.getUsersByPermissions(registeredUsers, registeredPermissions);
                obj.pageURL = permission.pageURL;
                context.getPagePermission.push(obj);
                d.resolve(context);
              });
            });
          });
          return d.promise;
        };

        return q.when()
          .then(openPageAdminCommonSharing)
          .then(getPermissions)
        ;
      }

      context.getPagePermission = [];
      var d = q.defer();
      return client.then(function(){
        async.forEachSeries(params.permissions, function(permission, cb){
          getPagePermissionEach(permission).then(function(){
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

module.exports.setSitePermissions = function (client, params) {
  var context = {client: client, params: params};
  init(context);

  return q.when(context)
    .then(steps.googleAccount.enterEmail)
    .then(steps.googleAccount.enterPass)
    .then(steps.googleSite.openAdminCommonSharing)
    .then(steps.googleSite.setSiteUsers)
    .then(steps.googleSite.setEnablePageLevelPermission)
    .then(steps.googleSite.setPagePermission)
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

module.exports.getSitePermissions = function (client, params) {
  var context = {client: client, params: params};
  init(context);

  return q.when(context)
    .then(steps.googleAccount.enterEmail)
    .then(steps.googleAccount.enterPass)
    .then(steps.googleSite.openAdminCommonSharing)
    .then(steps.googleSite.getSitePermission)
    .then(steps.googleSite.getPagePermission)
    .then(function(context){
      var d = q.defer();
      d.resolve({
        viewers: context.getSitePermission.viewers,
        editors: context.getSitePermission.editors,
        permissions: context.getPagePermission
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
 * Googleアカウントログイン画面でEmailを入力します
 *
 * 正常終了した際は、Passwordを入力できます。
 *
 * <example>
 *  gAA.enterEmail(client, CONFIG);
 * </example>
 *
 * @param {Object} client      webdriverio Object
 * @param {Object} params      権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.enterEmail = function (client, params) {
  var context = {client: client, params: params};
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
 * Googleアカウントログイン画面でPasswordを入力します
 *
 * 実行するためには、Googleアカウントのログイン画面でEmailの入力が完了し、Passwordを入力できる状態にしておく必要があります。
 * 正常終了した際は、Googleアカウントへのログインが完了します。
 *
 * <example>
 *  gAA.enterPass(client, CONFIG);
 * </example>
 *
 * @param {Object} client      webdriverio Object
 * @param {Object} params      権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.enterPass = function (client, params) {
  var context = {client: client, params: params};
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
 * Googleサイトの共有と権限設定画面に遷移します
 *
 * 実行するためには、ログインが完了した状態にしておく必要があります。
 * 正常終了した際は、Googleサイトの共有と権限を設定する画面に遷移します。
 *
 * <example>
 *  gAA.openAdminCommonSharing(client, CONFIG);
 * </example>
 *
 * @param {Object} client      webdriverio Object
 * @param {Object} params      権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.openAdminCommonSharing = function (client, params) {
  var context = {client: client, params: params};
  init(context);

  return q.when(context)
    .then(steps.googleSite.openAdminCommonSharing)
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
 * Googleサイトを使用するユーザを登録します
 *
 * 実行するためには、Googleサイトの共有と権限を設定する画面を表示しておく必要があります。
 * 各ユーザのサイトレベルの権限（編集者、閲覧者等）も合わせて登録できます。
 *
 * <example>
 *  gAA.setSiteUsers(client, CONFIG);
 * </example>
 *
 * @param {Object} client      webdriverio Object
 * @param {Object} params      権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.setSiteUsers = function (client, params) {
  var context = {client: client, params: params};
  init(context);

  return q.when(context)
    .then(steps.googleSite.setSiteUsers)
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
 * Googleサイトのページレベルのユーザ毎権限を有効にします
 *
 * 実行するためには、Googleサイトの共有と権限を設定する画面を表示しておく必要があります。
 * 正常終了した際は、ページレベルのユーザ毎権限が設定可能となります。
 *
 * <example>
 *  gAA.setEnablePageLevelPermission(client, CONFIG);
 * </example>
 *
 * @param {Object} client      webdriverio Object
 * @param {Object} params      権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.setEnablePageLevelPermission = function (client, params) {
  var context = {client: client, params: params};
  init(context);

  return q.when(context)
    .then(steps.googleSite.setEnablePageLevelPermission)
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
 * 実行するためには、ログインが完了した状態にしておく必要があります。
 * また、ページレベルのユーザ毎権限を有効にしておく必要もあります。
 * 正常終了した際は、ページレベルのユーザ毎権限が設定された状態となります。
 *
 * <example>
 *  gAA.setPagePermission(client, CONFIG);
 * </example>
 *
 * @param {Object} client      webdriverio Object
 * @param {Object} params      権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.setPagePermission = function (client, params) {
  var context = {client: client, params: params};
  init(context);

  return q.when(context)
    .then(steps.googleSite.setPagePermission)
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
 * Googleサイトの使用可能なユーザを取得します
 *
 * 実行するためには、Googleサイトの共有と権限を設定する画面を表示しておく必要があります。
 * 各ユーザのサイトレベルの権限（編集者、閲覧者等）も合わせて取得できます。
 *
 * <example>
 *  gAA.getSitePermission(client, CONFIG);
 * </example>
 *
 * @param {Object} client      webdriverio Object
 * @param {Object} params      権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.getSitePermission = function (client, params) {
  var context = {client: client, params: params};
  init(context);

  return q.when(context)
    .then(steps.googleSite.getSitePermission)
    .then(function(context){
      var d = q.defer();
      d.resolve(context.getSitePermission);
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
  ;
};

/**
 *
 * Googleサイトのページごとに設定されたユーザと権限を取得します
 *
 * 実行するためには、ログインが完了した状態にしておく必要があります。
 *
 * <example>
 *  gAA.getPagePermission(client, CONFIG);
 * </example>
 *
 * @param {Object} client      webdriverio Object
 * @param {Object} params      権限設定情報Object
 *
 * @return {Object}   promise Object
 *
 */
module.exports.getPagePermission = function (client, params) {
  var context = {client: client, params: params};
  init(context);

  return q.when(context)
    .then(steps.googleSite.getPagePermission)
    .then(function(context){
      var d = q.defer();
      d.resolve(context.getPagePermission);
      return d.promise;
    })
    .fail(function(err){
      throw err;
    })
  ;
};
