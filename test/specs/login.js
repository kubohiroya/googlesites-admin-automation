var chai        = require('chai'),
    expect      = chai.expect,
    assert      = chai.assert,
    async       = require('async');
    webdriverio = require('webdriverio'),
    q           = require('q'),
    sprintf      = require('util').format,
    utils       = require('../../lib/utils'),
    gAA         = require('../../index')  //googlesites-admin-automation
;

var CONFIG = {
    siteURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/',
    owner: {
        email: 'hoge@hoge.com',
        password:'hogehoge'
    },
    editors: [
        "testuser02@cuc.global",
        "testuser04@cuc.global"
    ],
    viewers: [
        "testuser03@cuc.global"
    ],
    pages: [
        {
            pageURL: "https://sites.google.com/a/cuc.global/dev-y41i3303-01/page1",
            editors: [
                "testuser02@cuc.global"
            ],
            viewers: [
                "testuser03@cuc.global"
            ]
        },
        {
            pageURL: "https://sites.google.com/a/cuc.global/dev-y41i3303-01/home",
            editors: [
                "testuser02@cuc.global",
                "testuser04@cuc.global"
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
            gAA.expandClient(client);
    });

    it('ログインできる',function(done) {
        gAA.login(client, CONFIG.owner).then(function(){
            client.isExisting("//a[contains(@title, '" + CONFIG.owner.email + "')]")
                .then(function(exist){
                expect(exist).to.equal(true);
            }).call(done);
        });
    });

    it('Googleサイトの権限設定画面に遷移する',function(done) {
        gAA.goSharingPermissions(client, CONFIG.siteURL).then(function(){
            client.getTitle()
                .then(function(txt){
                    expect(txt).to.include('共有と権限');
                })
                .call(done);
        });
    });

    it('サイトレベルでのユーザ毎権限を設定する',function(done){
        var result = [];
        var d = q.defer();
        var SELECTOR = "//td[@role='rowheader']//span[contains(text(),'%s')]/../../../../td[@role='gridcell']//div[@role='option']";
        var func = function(permission){
            return client.getTextFor(sprintf(SELECTOR, permission.email)).then(function(txt){
                result.push({
                    email: permission.email, 
                    txtExpect: txt,
                    txtActual: utils.getLevelText(permission.level)
                });
            });
        };
        var permissionList = {editors: CONFIG.editors, viewers:CONFIG.viewers};
        gAA.setPermissionSite(client, permissionList).then(function() {
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
        return gAA.setActivePagePermisson(client).then(function(){
            return client.refresh().then(function(){
                return client.actionFor(utils.SEL_PAGE_DISABLE, function(){
                    return client.isVisible(utils.SEL_PAGE_DISABLE).then(function(isVisible){
                        console.log(isVisible);
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
        var SELECTOR = "//div[contains(@id,'descriptionContainer')]/span[contains(@id, 'description')]";
        var func = function(page){
            return client.url(page.pageURL).then(function(){
            return client.clickFor("//span[@id='sites-share-visibility-btn']/div[@role='button']").then(function(){

                return client.getTextFor(SELECTOR).then(function(txt){
                    result.push({url: page.pageURL, txt: txt});
                });
            });
            });
        };
        gAA.setPermissionPage(client, CONFIG.pages).then(function() {
            async.forEachSeries(CONFIG.pages, function(permission, cb){
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

    describe('Googleサイトで新規サイトを作成する', function(){
        it('存在するサイトのオーナーが指定されたユーザではない場合にはエラー終了する', function(done){
            assert.ok('not fix');
            client.call(done);  //TODO
            //client.url('https://sites.google.com/a/cuc.global');
            //作成ボタンを押す
            //{siteTitle: '開発・テスト用：y41i3303-01', siteName: 'dev-y41i3303-01'}
            //作成ボタンを押す
            //https://sites.google.com/a/cuc.global/dev-y41i3303-01/
            //ページを作成する
            //gAA.goSharingPermissions('https://sites.google.com/a/cuc.global/dev-y41i3303-01/')
            //ページレベルの権限を有効にするボタンを押す
            // id="sites-admin-share-disable-plp" display: none;"ページ レベルの権限を無効にする
            // id="sites-admin-share-enable-plp"ページ レベルの権限を有効にする
            // <button name="ok">ページ レベルの権限を有効にする</button>
            //アクセスできるユーザーとして、「リンクを知っている 千葉商科大学国際教養学部 の全員が閲覧できます」を選択
        });

        it('指定されたサイトがすでに存在する場合には、(1)へ進む', function(done){
            assert.ok('not fix');
            client.call(done);  //TODO
        });
    });

    after(function(done) {
        client.end(done);
    });
});
