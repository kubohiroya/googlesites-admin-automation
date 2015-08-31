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

describe('googlesites-admin-automation test', function(){
    this.timeout(99999999);
    var client;

    before(function(done){
        client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
        client.init(done);
    });

    it('ページごとの権限が取得できる',function(done) {
        gAA.setSitePermissions(client, CONFIG).then(function(){
            gAA.getSitePermissions(client, CONFIG).then(function(result){
                assert.deepEqual(CONFIG.viewers.sort(), result.viewers.sort());
                assert.deepEqual(CONFIG.editors.sort(), result.editors.sort());
                CONFIG.permissions.forEach(function(permission, index){
                    assert.strictEqual(permission.pageURL, result.permissions[index].pageURL);
                    assert.deepEqual(permission.viewers.sort(), result.permissions[index].viewers.sort());
                    assert.deepEqual(permission.editors.sort(), result.permissions[index].editors.sort());
                });
                client.call(done);
            });
        });
    });

    after(function(done) {
        client.end(done);
    });
});

describe('check other owner test', function(){
   this.timeout(99999999);
    var client;

    before(function(done){
       client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
       gAA.init(client);
       client.init(done);
    });

    it('オーナーが指定されたユーザではない場合にはエラーとなる', function(done){
        var other = {owner: {email: 'hoge@hoge.com', password:'hogehoge'}};
        gAA.enterEmail(other).then(function(){
            gAA.enterPass(other).then(function(){
                gAA.goSharingPermissions(CONFIG).then(function(result){
                    expect('Error message').to.equal('Error has not occurred');
                }).catch(function(err){
                    expect(err.message).to.equal(EMESSAGE.NOT_OWNER);
                    client.call(done);
                });
            });
        });
    });

    after(function(done) {
        client.end(done);
    });
});

describe('googlesites-admin-automation Low-level API tests', function(){
    this.timeout(99999999);
    var client;

    before(function(done){
       client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
       gAA.init(client);
       client.init(done);
    });

    it('Emailが入力できる',function(done) {
        gAA.enterEmail(CONFIG).then(function(result){
            expect(result).to.equal('googleAccount.enterPass');
            client.call(done);
        });
    });

    it('Passwordを入力しログインできる',function(done) {
        gAA.enterPass(CONFIG).then(function(result){
            expect(result).to.equal('googleSite.goSharingPermissions');
            client.call(done);
        });
    });

    it('Googleサイトの権限設定画面に遷移する',function(done) {
        gAA.goSharingPermissions(CONFIG).then(function(result){
            expect(result).to.equal('googleSite.setPermissionSite');
            client.call(done);
        });
    });

    it('サイトレベルでのユーザ毎権限を設定する',function(done) {
        gAA.setPermissionSite(CONFIG).then(function(result){
            expect(result).to.equal('googleSite.setEnablePagePermisson');
            client.call(done);
        });
    });

    it('ページレベルのユーザ毎権限を有効化する',function(done) {
        gAA.setEnablePagePermisson(CONFIG).then(function(result){
            expect(result).to.equal('googleSite.setPermissionPage');
            client.call(done);
        });
    });

    it('ページレベルの権限を設定する',function(done) {
        gAA.setPermissionPage(CONFIG).then(function(result){
            expect(result).to.equal('end');
            client.call(done);
        });
    });

    after(function(done) {
        client.end(done);
    });
});
