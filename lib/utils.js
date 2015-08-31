module.exports.scopeIframe = function(client, selectorIframe, ms){
  return client.waitForExist(selectorIframe, ms).then(function(){
    return client.element(selectorIframe).then(function(res){
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

module.exports.editPermissionList = function(permissionList){
  var result = [];
  permissionList.editors.forEach(function(email){
    result.push({email: email, level: 'can edit'});
  });
  permissionList.viewers.forEach(function(email){
    result.push({email: email, level: 'can view'});
  });
  return result;
}

module.exports.getNoNeedUsers = function(registeredUsers, needUsers){
  var users = [];
  needUsers.forEach(function(u){
      users.push(u.email);
  });
  if(typeof registeredUsers === 'string'){
    registeredUsers = [registeredUsers];
  }
  return registeredUsers.filter(function(r){
      return users.indexOf(r) === -1;
  });
}

module.exports.editPermissionObj = function(users, permissions){
  var result = {editors: [], viewers: []};
  users.forEach(function(email, index){
    if(permissions[index] === '編集者'){
      result.editors.push(email);
    }
    if(permissions[index] === '閲覧者'){
      result.viewers.push(email);
    }
  });
  return result;
}
