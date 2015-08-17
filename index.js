var q     = require('q');
var async = require('async');
var sprintf = require('util').format;
var utils = require('./lib/utils');
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
    return client.waitForExist(selector, 5 * 1000).then(function() {
      return client.waitForVisible(selector, 5 * 1000).then(function() {
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
 *	var user = {email: 'hoge@hoge.com', password: 'fuga'};
 *	gAA.login(user);
 * </example>
 *
 * @param {Object} user			userオブジェクト
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
        return client.waitForExist("//a[contains(@title, '"+user.email+"')]", 5*1000);
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
 *	gAA.goSharingPermissions(url)
 * </example>
 *
 * @param {String} url        url
 *
 */
module.exports.goSharingPermissions = function (url) {
	return client.url(url + 'system/app/pages/admin/commonsharing');
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
  var SEL_INVITE_EMAIL = "//td[@id=':p.inviter']//textarea";
  var SEL_INVITE_EMAIL_SUGGEST = "//div[@role='listbox']/div[@role='option']/div[contains(text(), '%s')]/..";

  var SEL_INVITE_PERMISSION_LIST = "//td[@id=':p.inviter']//div[@role='listbox']";
  var SEL_INVITE_PERMISSION_LIST_OPTION = "//div[@role='listbox']/div[@role='menuitemradio']//div[contains(text(), '%s')]/..";
  var SEL_SEND_NOTICE = "//span[@id=':p.sendNotifications']";
  var SEL_OK = "//div[@id=':p.share']";
  var SEL_OK_CONFIRM = "//button[@name='sio']";
/*
org.openqa.selenium.WebDriverException: unknown error: Element is not clickable at point (22, 389). Other element would receive the click: <div class="ztA2jd-oKd
M2c ztA2jd-auswjd auswjd" id=":7r" role="option" style="-webkit-user-select: none;">...</div>
*/
  function setPermissionSiteEach(permission){
//    return client.pause(5000).then(function(){
    return client.setValueFor(SEL_INVITE_EMAIL, permission.email).then(function(){
      //リストボックスを選択
      return client.clickFor(SEL_INVITE_PERMISSION_LIST).then(function(){
        //オプションを選択
        return client.clickFor(sprintf(SEL_INVITE_PERMISSION_LIST_OPTION, utils.getLevelText(permission.level))).then(function(){
          return client.isVisible(sprintf(SEL_INVITE_EMAIL_SUGGEST, permission.email)).then(function(isVisible) {
            console.log(sprintf(SEL_INVITE_EMAIL_SUGGEST, permission.email) + " isVisible:"+isVisible);
            if(isVisible){
              client.click(SEL_INVITE_EMAIL_SUGGEST);
            }
          }).then(function(){
            //メールで通知をOFF
            return client.clickFor(SEL_SEND_NOTICE).then(function(){
              //OKボタン押下
              return client.clickFor(SEL_OK).then(function(){
                //OK(再確認)ボタン押下
                return client.clickFor(SEL_OK_CONFIRM).then(function(){
                  //登録が完了するまで待つ
                  return client.waitForVisible(SEL_INVITE_EMAIL, 10*1000);
                });
              });
            });
          });
        });
      });
    });
//    });
  }

  var d = q.defer();
  return utils.scopeIframe(utils.SEL_IFRAME_SHARE_SETTING).then(function(){
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
  return client.isVisible(utils.SEL_PAGE_ENABLE).then(function(isVisible){
    if(isVisible){
      return client.clickFor(utils.SEL_PAGE_ENABLE).then(function(){
        return client.clickFor(utils.SEL_PAGE_ENABLE_CONFIRM).then(function(){
          return client.waitForVisible(utils.SEL_PAGE_DISABLE);
        });
      });
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
var SEL_REGISTERD_USERS = "//div[@role='button' and contains(@aria-label, 'さんを削除') and not(contains(@style, 'display: none'))]/ancestor::tr/td[@role='rowheader']/div/span[2]/span[2]";
var SEL_DELETE = "//td[@role='rowheader']/div/span[2]/span[text()='%s']/ancestor::tr//div[@role='button' and contains(@aria-label, 'さんを削除') and not(contains(@style, 'display: none'))]";
var SEL_DELETE_SAVE = "//div[@role='button' and text()='変更を保存']";
var SEL_DELETE_ALERT = "//div[@role='alert']/div[text()='保存が必要な変更を加えました。']";
  function deleteNoNeedUser(needUsers){
      return utils.scopeIframe(utils.SEL_IFRAME_SHARE_SETTING).then(function(){
      return client.getTextFor(SEL_REGISTERD_USERS).then(function(registeredUsers){
        var users = utils.getNoNeedUsers(registeredUsers, needUsers);
        console.log(users);
        if(users.length === 0){return client;}
        users.forEach(function(user){
          client.clickFor(sprintf(SEL_DELETE, user));
        });
        return client.clickFor(SEL_DELETE_SAVE).then(function(){
          return client.waitUntil(function(){
            return client.isVisible(SEL_DELETE_ALERT).then(function(isVisible){
              return !isVisible;
            });
          })
        });
      });
      });
  }

  var SEL_BTN_SHARE = "//span[@id='sites-share-visibility-btn']/div[@role='button']";
  var SEL_BTN_CHANGE = "//div[@id='sites-admin-share-inherits-selector']//div[contains(@id, 'changeLink')]/div[contains(text(), '変更')]";
  var SEL_RADIO_CUSTOM = "//input[@id='permissions-custom-radio']";
  var SEL_RADIO_INDEPENDENT = "//input[@id='permissions-ignores-radio']";
  var SEL_PERMISSION_SAVE = "//button[contains(text(), '保存')]";
  var SEL_PERMISSION_DESCRIPTION = "//div[contains(@id,'descriptionContainer')]/span[contains(@id, 'description')]";
  function setPermissionPageEach(page){
    return client.url(page.pageURL).then(function(){
      return client.clickFor(SEL_BTN_SHARE).then(function(){
        return client.clickFor(SEL_BTN_CHANGE).then(function(){
          return client.clickFor(SEL_RADIO_CUSTOM).then(function(){
            return client.clickFor(SEL_RADIO_INDEPENDENT).then(function(){
              return client.clickFor(SEL_PERMISSION_SAVE).then(function(){
                return client.getTextFor(SEL_PERMISSION_DESCRIPTION);
              });
            });
          });
        });
      });
    });
  }
  var d = q.defer();


  return utils.scopeIframe(utils.SEL_IFRAME_SHARE_SETTING).then(function(){
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
