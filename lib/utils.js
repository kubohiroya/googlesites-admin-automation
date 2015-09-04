var EDITOR      = require('../define.conf').EDITOR
    VIEWER      = require('../define.conf').VIEWER
;

module.exports.scopeIframe = function(client, selectorIframe, ms){
  return client.waitForExist(selectorIframe, ms).then(function(){
    return client.element(selectorIframe).then(function(res){
      return client.frame(res.value);
    });
  });
}

module.exports.editPermissionList = function(permissionList){
  var result = [];
  permissionList.editors.forEach(function(email){
    result.push({email: email, level: EDITOR});
  });
  permissionList.viewers.forEach(function(email){
    result.push({email: email, level: VIEWER});
  });
  return result;
}

module.exports.getUnrequiredUsers = function(registeredUsers, requiredUsers){
  var users = [];
  requiredUsers.forEach(function(u){
      users.push(u.email);
  });
  if(typeof registeredUsers === 'string'){
    registeredUsers = [registeredUsers];
  }
  return registeredUsers.filter(function(r){
      return users.indexOf(r) === -1;
  });
}

module.exports.getUsersByPermissions = function(users, permissions){
  var result = {editors: [], viewers: []};
  users.forEach(function(email, index){
    if(permissions[index] === EDITOR){
      result.editors.push(email);
    }
    if(permissions[index] === VIEWER){
      result.viewers.push(email);
    }
  });
  return result;
}
