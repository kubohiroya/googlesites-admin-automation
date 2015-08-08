var q = require('q');

/**
 *
 * webdriverio.remote()で作成したclientオブジェクトにfunctionを追加し、拡張します。
 * Returns a list of attribute values if selector matches multiple elements.
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
	return client.url('https://accounts.google.com/ServiceLogin?sacu=1').then(function(){
		return client.setValueFor('#Email', user.email).then(function(){
			return client.clickFor('#next').then(function(){
				return client.setValueFor('#Passwd', user.password).then(function(){
					return client.clickFor('#signIn').then(function(){
						return client.waitForExist("//a[contains(@title, '"+user.email+"')]", 5*1000);
					});
				});
			});
		});
	});
}

/**
 *
 * Googleサイトの共有と権限を設定する画面に遷移します。
 *
 * <example>
 *	gaa.go(client)
 * </example>
 *
 * @param {Object} client 		clientオブジェクト
 *
 */
module.exports.goCommonsharing = function (client) {
	return client.url('https://sites.google.com/site/y41i3303/system/app/pages/admin/commonsharing');
}
