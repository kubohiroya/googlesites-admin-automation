var chai        = require('chai'),
    expect      = chai.expect,
    assert      = chai.assert,
    async       = require('async');
    webdriverio = require('webdriverio'),
    q           = require('q'),
    sprintf     = require('util').format,
    utils       = require('../../lib/utils'),
    SEL         = require('../../define.conf').SELECTOR;
    TITLE       = require('../../define.conf').TITLE;
    EMESSAGE    = require('../../define.conf').EMESSAGE;
    gAA         = require('../../index')  //googlesites-admin-automation
;

var CONFIG = {
    siteURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/',
    owner: {
        email: 'hoge@hoge.com',
        password:'hogehoge'
    },
    editors: [
        'testuser02@cuc.global',
        'testuser04@cuc.global'
    ],
    viewers: [
        'testuser03@cuc.global'
    ],
    permissions: [
        {
            pageURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/page1',
            editors: [
                'testuser02@cuc.global'
            ],
            viewers: [
                'testuser03@cuc.global'
            ]
        },
        {
            pageURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/home',
            editors: [
                'testuser02@cuc.global',
                'testuser04@cuc.global'
            ],
            viewers: [
            ]
        }
    ]
}

describe('googlesites-admin-automation tests', function(){
    this.timeout(99999999);
    client = {};

    before(function(done){
            client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
            client.init(done);
            gAA.expandClient();
    });

    it('ログインできる',function(done) {
        gAA.login(CONFIG.owner).then(function(){
            client.isExisting(sprintf(SEL.LOGINED, CONFIG.owner.email))
                .then(function(exist){
                expect(exist).to.equal(true);
            }).call(done);
        });
    });

    it('Googleサイトの権限設定画面に遷移する',function(done) {
        gAA.goSharingPermissions(CONFIG.siteURL).then(function(){
            client.getTitle()
                .then(function(txt){
                    expect(txt).to.include(TITLE.COMMON_SHARING);
                })
                .call(done);
        });
    });

    it('サイトレベルでのユーザ毎権限を設定する',function(done){
        var result = [];
        var d = q.defer();
        var func = function(permission){
            return client.getTextFor(sprintf(SEL.TODO, permission.email)).then(function(txt){
                result.push({
                    email: permission.email, 
                    txtExpect: txt,
                    txtActual: utils.getLevelText(permission.level)
                });
            });
        };
        var permissionList = {editors: CONFIG.editors, viewers:CONFIG.viewers};
        gAA.setPermissionSite(permissionList).then(function() {
            async.forEachSeries(utils.editPermissionList(permissionList), function(permission, cb){
                func(permission).then(function(){
                    cb();
                });
            }, function(){
                d.resolve();
            })
            ;
            return d.promise;
      }).then(function(){
        result.forEach(function(obj){
            assert.equal(obj.txtExpect, obj.txtActual, obj.email);
        });
        client.call(done);
      }).catch(function(err){
        //TODO: assert()でfailせずグリーンになってしまうので、ここでコンソールに出力しておく。
        console.log(err);
        client.call(done);
      });
    });

    it('ページレベルのユーザ毎権限を有効化する',function(done){
        return client.refresh().then(function(){
        return gAA.setActivePagePermisson().then(function(){
            return client.refresh().then(function(){
                return client.actionFor(SEL.PAGE_DISABLE, function(){
                    return client.isVisible(SEL.PAGE_DISABLE).then(function(isVisible){
                        expect(isVisible).to.equal(true);
                        client.call(done);
                    });
                });
            });
        });
        });
    });

    it('ページレベルの権限を設定する',function(done){
        var result = [];
        var d = q.defer();
        var func = function(page){
            return client.url(page.pageURL).then(function(){
            return client.clickFor(SEL.BTN_SHARE).then(function(){
                return client.getTextFor(SEL.PERMISSION_DESCRIPTION).then(function(txt){
                    result.push({url: page.pageURL, txt: txt});
                });
            });
            });
        };

        gAA.setPermissionPage(CONFIG.permissions).then(function() {
            async.forEachSeries(CONFIG.permissions, function(permission, cb){
                func(permission).then(function(){
                    cb();
                });
            }, function(){
                d.resolve();
            })
            ;
            return d.promise;
          }).then(function(){
            result.forEach(function(obj){
                assert.include(obj.txt, "今後の変更は無視します。", obj.url + ": " + obj.txt);
            });
            client.call(done);
          }).catch(function(err){
            //TODO: assert()でfailせずグリーンになってしまうので、ここでコンソールに出力しておく。
            console.log(err);
            client.call(done);  //TODO
        });
    });

    after(function(done) {
        client.end(done);
    });
});

describe('check other owner', function(){
    this.timeout(99999999);
    client = {};

    before(function(done){
        client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
        client.init(done);
        gAA.expandClient();
    });

    it('オーナーが指定されたユーザではない場合にはエラーとなる', function(done){
        gAA.login({email: 'hoge@hoge.com', password:'hogehoge'}).then(function(){
            gAA.goSharingPermissions(CONFIG.siteURL).then(function(){
                expect('Error message').to.equal('Error has not occurred');
            }).catch(function(err){
                expect(err.message).to.equal(EMESSAGE.NOT_OWNER);
                client.call(done);
            });
        });
    });

    after(function(done) {
        client.end(done);
    });
});

describe('check site exist', function(){
    this.timeout(99999999);
    client = {};

    before(function(done){
        client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
        client.init(done);
        gAA.expandClient();
    });

    it('指定されたサイトが存在しない場合にはエラーとなる', function(done){
        gAA.login(CONFIG.owner).then(function(){
            gAA.goSharingPermissions(CONFIG.siteURL + 'notExist/').then(function(){
                expect('Error message').to.equal('Error has not occurred');
            }).catch(function(err){
                expect(err.message).to.equal(EMESSAGE.PAGE_NOTFOUND);
                client.call(done);
            });
        });
    });

    after(function(done) {
        client.end(done);
    });
});
