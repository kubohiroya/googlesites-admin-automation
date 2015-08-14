module.exports.SEL_IFRAME_SHARE_SETTING = "//iframe[@title='共有設定']";
module.exports.SEL_PAGE_ENABLE = "//div[@id='sites-page-toolbar']//div[@id='sites-admin-share-buttons-wrapper']/div[@id='sites-admin-share-enable-plp']";
module.exports.SEL_PAGE_DISABLE = "//div[@id='sites-page-toolbar']//div[@id='sites-admin-share-buttons-wrapper']/div[@id='sites-admin-share-disable-plp']";
module.exports.SEL_PAGE_ENABLE_CONFIRM = "//div[contains(@class, 'sites-admin-share-dialog-buttons')]/button[@name='ok']";

module.exports.scopeIframe = function(selectorIframe){
    return client.waitForExist(selectorIframe, function(err, res){
        return client.element(selectorIframe, function(err, res){
            return client.frame(res.value);
        });
    });
}

module.exports.getLevelText = function(level){
  if(level === 'can edit'){
    return '編集者';
  }else if(level === 'can view'){
    return '閲覧者';
  }
  return;
}
