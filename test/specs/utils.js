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

    it('getNoNeedUsers()', function(){
        var registeredUsers = [
            'user03',
            'user04',
            'user01',
            'user02'
        ];
        var needUsers = [
            {email: 'user02'},
            {email: 'user03'}
        ];
        var target = utils.getNoNeedUsers(registeredUsers, needUsers);
        assert.deepEqual(['user04','user01'], target);

        var target = utils.getNoNeedUsers([], []);
        assert.deepEqual([], target);

        var target = utils.getNoNeedUsers('user02', needUsers);
        assert.deepEqual([], target);

        var target = utils.getNoNeedUsers('user02', []);
        assert.deepEqual(['user02'], target);
    });
});
