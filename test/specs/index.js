var chai        = require('chai'),
    expect      = chai.expect,
    assert      = chai.assert,
    async       = require('async');
    webdriverio = require('webdriverio'),
    q           = require('q'),
    sprintf     = require('util').format,
    ACCOUNT     = require('../.test.conf').ACCOUNT,
    utils       = require('../../lib/utils'),
    SEL         = require('../../define.conf').SELECTOR;
    TITLE       = require('../../define.conf').TITLE;
    EMESSAGE    = require('../../define.conf').EMESSAGE;
    gAA         = require('../../index')  //googlesites-admin-automation
;

var CONFIG = {
  siteURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/',
  owner: ACCOUNT.owner,
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
   client.init(done);
  });

  it('オーナーが指定されたユーザではない場合にはエラーとなる', function(done){
    var other = {owner: ACCOUNT.other};
    gAA.enterEmail(client, other).then(function(){
      gAA.enterPass(client, other).then(function(){
        gAA.openAdminCommonSharing(client, CONFIG).then(function(result){
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

describe('check site exist', function(){
  this.timeout(99999999);
  var client;

  before(function(done){
   client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
   client.init(done);
  });

  it('指定されたサイトが存在しない場合にはエラーとなる', function(done){
    var other = {
      siteURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/' + 'notExist/',
      owner: ACCOUNT.owner
    };
    gAA.enterEmail(client, other).then(function(){
      gAA.enterPass(client, other).then(function(){
        gAA.openAdminCommonSharing(client, other).then(function(result){
          expect('Error message').to.equal('Error has not occurred');
        }).catch(function(err){
          expect(err.message).to.equal(EMESSAGE.SITE_NOTFOUND);
          client.call(done);
        });
      });
    });
  });

  it('指定されたページが存在しない場合にはエラーとなる', function(done){
    var other = {
      siteURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/',
      owner: ACCOUNT.owner,
      permissions: [
        {
          pageURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/page1' + 'notExist/',
        }
      ]
    };
    gAA.enterEmail(client, other).then(function(){
      gAA.enterPass(client, other).then(function(){
        gAA.setPagePermission(client, other).then(function(result){
          expect('Error message').to.equal('Error has not occurred');
        }).catch(function(err){
          expect(err.message).to.equal(EMESSAGE.PAGE_NOTFOUND);
          client.call(done);
        });
      });
    });
  });

  after(function(done) {
    client.end(done);
  });
});

describe('アカウントが存在しない場合のテスト', function(){
  this.timeout(99999999);
  var client;

  before(function(done){
   client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
   client.init(done);
  });

  it('viewerのアカウントが存在しない場合にはエラーとなる', function(done){
    var other = {
      siteURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/',
      owner: ACCOUNT.owner,
      viewers: ['notexistviewers@cuc.global'],
      editors: []
    };

    gAA.setSitePermissions(client, other).then(function(){
      expect('Error message').to.equal('Error has not occurred');
    }).catch(function(err){
      expect(err.message).to.equal(sprintf(EMESSAGE.NOT_EXIST_ACCOUNT, other.viewers[0]));
      client.call(done);
    });
  });


  it('editorsのアカウントが存在しない場合にはエラーとなる', function(done){
    var other = {
      siteURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/',
      owner: ACCOUNT.owner,
      viewers: [],
      editors: ['notexisteditors@cuc.global']
    };
    gAA.setSitePermissions(client, other).then(function(){
      expect('Error message').to.equal('Error has not occurred');
    }).catch(function(err){
      expect(err.message).to.equal(sprintf(EMESSAGE.NOT_EXIST_ACCOUNT, other.editors[0]));
      client.call(done);
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
   client.init(done);
  });

  it('低レベルAPIが事前条件どおりに実行できる',function(done) {
    gAA.enterEmail(client, CONFIG).then(function(){
      gAA.enterPass(client, CONFIG).then(function(){
        gAA.openAdminCommonSharing(client, CONFIG).then(function(){
          gAA.setSiteUsers(client, CONFIG).then(function(){
            gAA.setEnablePageLevelPermission(client, CONFIG).then(function(){
              gAA.setPagePermission(client, CONFIG).then(function(){
                client.call(done);
              });
            });
          });
        });
      });
    });
  });

  after(function(done) {
    client.end(done);
  });
});

describe('Low-level API status tests', function(){
  this.timeout(99999999);
  var client;

  before(function(done){
   client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
   client.init(done);
  });

  it('',function(done) {
    gAA.enterPass(client, CONFIG).then(function(){
      expect('Error message').to.equal('Error has not occurred');
    }).catch(function(err){
      expect(err.message).to.equal(sprintf(EMESSAGE.ILLIGAL_STATE, 'enterPass()'));
      client.call(done);
    });
  });
        // gAA.openAdminCommonSharing(client, CONFIG).then(function(){
        //   gAA.setSiteUsers(client, CONFIG).then(function(){
        //     gAA.setEnablePageLevelPermission(client, CONFIG).then(function(){
        //       gAA.setPagePermission(client, CONFIG).then(function(){

  after(function(done) {
    client.end(done);
  });
});
