var chai        = require('chai'),
    expect      = chai.expect,
    assert      = chai.assert,
    utils       = require('../../lib/utils')
    EDITOR      = require('../../define.conf').EDITOR
    VIEWER      = require('../../define.conf').VIEWER
;

describe('utils tests', function(){
  it('editPermissionList()',function() {
    var src = {editors: ['user01', 'user03'], viewers: ['user02']};
    var dest = [
      {email: 'user01', level: EDITOR},
      {email: 'user03', level: EDITOR},
      {email: 'user02', level: VIEWER}
    ];
    var target = utils.editPermissionList(src);
    for(var i=0; i<target.length; i++){
      assert.deepEqual(target[i], dest[i]);
    }
  });

  it('getUnrequiredUsers()', function(){
    var registeredUsers = [
      'user03',
      'user04',
      'user01',
      'user02'
    ];
    var requiredUsers = [
      {email: 'user02'},
      {email: 'user03'}
    ];
    var target = utils.getUnrequiredUsers(registeredUsers, requiredUsers);
    assert.deepEqual(['user04','user01'], target);

    var target = utils.getUnrequiredUsers([], []);
    assert.deepEqual([], target);

    var target = utils.getUnrequiredUsers('user02', requiredUsers);
    assert.deepEqual([], target);

    var target = utils.getUnrequiredUsers('user02', []);
    assert.deepEqual(['user02'], target);
  });

  it('getUsersByPermissions()',function() {
    var srcUsers = [ 'user03', 'user04', 'user02' ];
    var srcPermissions = [ VIEWER, EDITOR, EDITOR ];
    var dest = {editors: ['user04', 'user02'], viewers: ['user03']};

    var target = utils.getUsersByPermissions(srcUsers, srcPermissions);

    assert.deepEqual(target, dest);
  });
});






