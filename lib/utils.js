module.exports.SEL_IFRAME_SHARE_SETTING = "//iframe[@title='共有設定']";

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
