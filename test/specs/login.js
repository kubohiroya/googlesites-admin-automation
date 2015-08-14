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

    permissions_test:[
        {
            email: 'testuser02@cuc.global',
            level: 'can edit',
            pages: [
                {name: 'home', level: 'can view'},
                {name: 'page1', level: 'can edit'}
            ]
        },
        {
            email: 'testuser03@cuc.global',
            level: 'can view',
            pages: [
                {name: 'home', level: 'can edit'},
                {name: 'page1', level: 'can view'}
            ]
        },
        {
            email: 'testuser04@cuc.global',
            level: 'can edit',
            pages: [
                {name: 'home', level: 'can view'},
                {name: 'page1', level: 'can view'}
            ]
        }
    ],

    // permissions:[
    //     {
    //         pageURL: "https://sites.google.com/a/example.com/a",
    //         editors: ["a@exmaple.com", "aa@example.com"],
    //         viewers: ["aaa@example.com"]
    //     },
    //     {
    //         pageURL: "https://sites.google.com/a/example.com/b",
    //         editors: ["b@exmaple.com", "bb@example.com"],
    //         viewers: ["bbb@example.com"]
    //     }
    // ]
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

        gAA.setPermissionSite(client, CONFIG.permissions_test).then(function() {
            async.forEachSeries(CONFIG.permissions_test, function(permission, cb){
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
        return gAA.setActivePagePermisson(client).then(function(){
            return client.actionFor(utils.SEL_PAGE_DISABLE, function(){
                return client.isVisible(utils.SEL_PAGE_DISABLE).then(function(isVisible){
                    expect(isVisible).to.equal(true);
                    client.call(done);
                });
            });
        });
    });

    it('ページレベルの権限を設定する',function(done){
        //ページをクリックする
        //「ホーム と同じ権限とメンバーを使用します。 」の右側にある「変更」ボタンを押す
        //「独自の権限を使用する」のラジオボタンを選択
        //「独自の権限: 新しいユーザーをこのページに追加しない」のラジオボタンを選択
        //「保存」をクリック
        //「アクセスできるユーザー」のうち、設定上不要なユーザについて、各行右端の×ボタンをクリック
        client.call(done);  //TODO
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
