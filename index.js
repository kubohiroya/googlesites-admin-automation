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
/**
 *
 * webdriverio.remote()で作成したclientオブジェクトにfunctionを追加し、拡張します。
 *
 * <example>
    client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
    client.init(done);
    gAA.expandClient();
 * </example>
 *
 */
module.exports.expandClient = function () {
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
}

/**
 *
 * Googleアカウントにログインします。
 *　ログインが完了するまで待機します。
 *
 * <example>
 *  var user = {email: 'hoge@hoge.com', password: 'fuga'};
 *  gAA.login(user);
 * </example>
 *
 * @param {Object} user     userオブジェクト
 *
 */
module.exports.login = function (user) {
  function enterEmail(user){
    return client.setValueFor('#Email', user.email).then(function(){
      return client.clickFor('#next')
    });
  }

  function enterPass(user){
    return client.setValueFor('#Passwd', user.password).then(function(){
      return client.clickFor('#signIn').then(function(){
        return client.waitForExist("//a[contains(@title, '"+user.email+"')]", TOUT_MS);
      });
    });
  }

  return client.url('https://accounts.google.com/ServiceLogin?sacu=1').then(function(){
    return enterEmail(user).then(function(){
      return enterPass(user);
    });
  });
}

/**
 *
 * Googleサイトの共有と権限を設定する画面に遷移します。
 *
 * <example>
 *  gAA.goSharingPermissions(url)
 * </example>
 *
 * @param {String} url        url
 *
 */
module.exports.goSharingPermissions = function (url) {
  return client.url(url + URL.COMMON_SHARING).then(function(){
    return client.getTitle().then(function(txt){
      if(txt.indexOf(TITLE.NOT_OWNER) !== -1){
        throw new Error(EMESSAGE.NOT_OWNER);
      }else if(txt.indexOf(TITLE.PAGE_NOTFOUND_FIREFOX) !== -1
            || txt.indexOf(TITLE.PAGE_NOTFOUND_CHROME)　!== -1){
        throw new Error(EMESSAGE.PAGE_NOTFOUND);
      }
    });
  });
}

/**
 *
 * Googleサイトの共有と権限を設定します。
 *
 * <example>
 *  gAA.setPermissionSite(permissionList)
 * </example>
 *
 * @param {Object} permission        permissionオブジェクト
 *
 */
 module.exports.setPermissionSite = function (permissionList) {
  function setPermissionSiteEach(permission){
    var enterEmail = function(){
      var d = q.defer();
      client.setValueFor(SEL.INVITE_EMAIL, permission.email).then(function(){
        return d.resolve();
      });
      return d.promise;
    };

    var clearSuggest = function(){
      var d = q.defer();
      client.clickFor(SEL.INVITE_EMAIL).then(function(){
        return client.isVisible(sprintf(SEL.INVITE_EMAIL_SUGGEST, permission.email)).then(function(isVisible) {
          if(isVisible){
            return client.clickFor(SEL.INVITE_EMAIL_SUGGEST, permission.email).then(function(){
              return d.resolve();
            });
          }else{
            return d.resolve();
          }
        });
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
      //メールで通知をOFF
      client.clickFor(SEL.SEND_NOTICE).then(function(){
        return d.resolve();
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
      .then(enterEmail)
      .then(selectPermission)
      .then(clearSuggest)
      .then(clickSendNotice)
      .then(registUser)
      ;
  }

  var d = q.defer();
  return utils.scopeIframe(SEL.IFRAME_SHARE_SETTING).then(function(){
    async.forEachSeries(utils.editPermissionList(permissionList), function(permission, cb){
      setPermissionSiteEach(permission).then(function(){
        cb();
      });
     }, function() {
       d.resolve();
    });
    return d.promise;
  });
}

/**
 *
 * Googleサイトのページレベルのユーザ毎権限を有効化します。
 *
 * <example>
 *  gAA.setActivePagePermisson()
 * </example>
 *
 */
 module.exports.setActivePagePermisson = function () {
  function enablePagePermission(){
    return client.clickFor(SEL.PAGE_ENABLE).then(function(){
      return client.clickFor(SEL.PAGE_ENABLE_CONFIRM).then(function(){
        return client.waitForVisible(SEL.PAGE_DISABLE);
      });
    });
  }

  return client.isVisible(SEL.PAGE_ENABLE).then(function(isVisible){
    if(isVisible){
      return enablePagePermission();
    }else{
      console.log("alredy actived.");
    }
  });
}

/**
 *
 * Googleサイトのページレベルの権限を設定します。
 *
 * <example>
 *  gAA.setPermissionPage(pages)
 * </example>
 *
 * @param {Object} pages        pagesオブジェクト
 *
 */
module.exports.setPermissionPage = function (pages) {
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

    return utils.scopeIframe(SEL.IFRAME_SHARE_SETTING).then(function(){
      return client.getTextFor(SEL.REGISTERD_USERS).then(function(registeredUsers){
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



  function setPermissionPageEach(page){
    var goPageSharingPermissions = function(){
      var d = q.defer();
      client.url(page.pageURL).then(function(){
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
        // return client.waitUntil(function(){
        //   client.isExisting('selector').then(function(isExisting) {
        //   })
        //   return client.isVisible(SEL.MODAL).then(function(isVisible){
        //     return !isVisible;
        //   });
        // }).then(function(){
          // return client.actionFor(SEL.PERMISSION_DESCRIPTION, function(){}).then(function(){
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
  return utils.scopeIframe(SEL.IFRAME_SHARE_SETTING).then(function(){
    async.forEachSeries(pages, function(page, cb){
      setPermissionPageEach(page).then(function(){
        var permissionList = {editors: page.editors, viewers:page.viewers};
        deleteNoNeedUser(utils.editPermissionList(permissionList)).then(function(){
          cb();
        });
      });
     }, function() {
       d.resolve();
    });
    return d.promise;
  });
}
