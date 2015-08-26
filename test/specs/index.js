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
    var client;

    before(function(done){
       client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
       client.init(done);
    });

    it('ページごとの権限が設定できる',function(done) {
        //TODO:検証内容
        gAA.setSitePermissions(client, CONFIG).then(function(){
            client.call(done);
        });
    });

    after(function(done) {
        client.end(done);
    });
});


describe('googlesites-admin-automation Low-level API tests', function(){
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

    after(function(done) {
        client.end(done);
    });
});