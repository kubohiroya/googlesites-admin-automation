var chai        = require('chai'),
    expect      = chai.expect,
    assert      = chai.assert,
    utils       = require('../../lib/utils')
;

describe('utils tests', function(){
  it('getLevelText()',function() {
    expect(utils.getLevelText('can edit')).to.equal('編集者');
    expect(utils.getLevelText('can view')).to.equal('閲覧者');
    expect(utils.getLevelText('')).to.equal(undefined);
  });

  it('editPermissionList()',function() {
    var src = {editors: ['user01', 'user03'], viewers: ['user02']};
    var dest = [
      {email: 'user01', level: 'can edit'},
      {email: 'user03', level: 'can edit'},
      {email: 'user02', level: 'can view'}
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
    var srcPermissions = [ '閲覧者', '編集者', '編集者' ];
    var dest = {editors: ['user04', 'user02'], viewers: ['user03']};

    var target = utils.getUsersByPermissions(srcUsers, srcPermissions);

    assert.deepEqual(target, dest);
  });
});






