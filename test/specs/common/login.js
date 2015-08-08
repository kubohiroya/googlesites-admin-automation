var chai        = require('chai'),
    expect      = chai.expect,
    assert      = chai.assert,
    webdriverio = require('webdriverio'),
    gAA         = require('../../../index')  //googlesites-admin-automation
;
console.log(assert);

describe('google login tests', function(){
    var user = {email: 'hoge@hoge.com', password: 'hogehoge'};
//    this.timeout(99999999);
    client = {};

    before(function(done){
            client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
            client.init(done);
            gAA.expandClient(client);
    });

    it('ログインできる',function(done) {
        gAA.login(client, user).then(function(){
            client.isExisting("//a[contains(@title, '"+user.email+"')]")
                .then(function(exist){
                expect(exist).to.equal(true);
            }).call(done);
        });
    });

    it('Googleサイトの権限設定画面に遷移できる',function(done) {
        gAA.goCommonsharing(client).then(function(){
            client.getTitle()
                .then(function(txt){
                expect(txt).to.include('共有と権限');
            }).call(done);
        });
    });

    after(function(done) {
        client.end(done);
    });
});
