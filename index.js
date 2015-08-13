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
    gaa.init(client);
 * </example>
 *
 * @param {Object} client      clientオブジェクト
 *
 */
module.exports.expandClient = function (client) {
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
 *	gaa.login(client, user);
 * </example>
 *
 * @param {Object} client 		clientオブジェクト
 * @param {Object} user			userオブジェクト
 *
 */
module.exports.login = function (client, user) {
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
 *	gaa.goSharingPermissions(client, url)
 * </example>
 *
 * @param {Object} client     clientオブジェクト
 * @param {String} url        url
 *
 */
module.exports.goSharingPermissions = function (client, url) {
	return client.url(url + 'system/app/pages/admin/commonsharing');
}

var SEL_INVITE_EMAIL = "//td[@id=':p.inviter']//textarea";
var SEL_INVITE_PERMISSION_LIST = "//td[@id=':p.inviter']//div[@role='listbox']";
var SEL_INVITE_PERMISSION_LIST_OPTION = "//div[@role='listbox']/div[@role='menuitemradio']//div[contains(text(), '%s')]/..";
var SEL_SEND_NOTICE = "//span[@id=':p.sendNotifications']";
var SEL_OK = "//div[@id=':p.share']";
var SEL_OK_CONFIRM = "//button[@name='sio']";

function setPermissionSiteEach(permission){
  return client.setValueFor(SEL_INVITE_EMAIL, permission.email).then(function(){
    //リストボックスを選択
    return client.clickFor(SEL_INVITE_PERMISSION_LIST).then(function(){
      //オプションを選択
      return client.clickFor(sprintf(SEL_INVITE_PERMISSION_LIST_OPTION, utils.getLevelText(permission.level))).then(function(){
        //メールで通知をOFF
        return client.clickFor(SEL_SEND_NOTICE).then(function(){
          //OKボタン押下
          return client.clickFor(SEL_OK).then(function(){
            //OK(再確認)ボタン押下
            return client.clickFor(SEL_OK_CONFIRM).then(function(){
              //登録が完了するまで待つ
              return client.waitForVisible(SEL_INVITE_EMAIL);
            });
          });
        });
      });
    });
  });
}

/**
 *
 * Googleサイトの共有と権限を設定します。
 *
 * <example>
 *  gaa.setPermissionSite(client, permissionList)
 * </example>
 *
 * @param {Object} client     clientオブジェクト
 * @param {Array} permissionList        permissionオブジェクトの配列
 *
 */
 module.exports.setPermissionSite = function (client, permissionList) {
  var d = q.defer();
  return utils.scopeIframe(utils.SEL_IFRAME_SHARE_SETTING).then(function(){
    async.forEachSeries(permissionList, function(permission, cb){
      setPermissionSiteEach(permission).then(function(){
        cb();
      });
     }, function() {
       d.resolve();
    });
    return d.promise;
  });
}
