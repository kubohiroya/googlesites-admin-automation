***
Googleサイトのページレベルの権限を設定するライブラリです。  
webdriverioを使用し、画面を操作することで設定を行います。  
Googleアカウントにログインし、  
Googleサイトを使用するユーザを登録したり、ページレベルの権限を設定できます。  
  
***

# 使い方
setSitePermissions()を実行することで権限の設定を行います。  
使用例：  
```js
var webdriverio = require('webdriverio'),
    gAA         = require('../../index')  //googlesites-admin-automation
    ;

//権限の設定情報を指定します。
var CONFIG = {
  //サイトのURLを記述します。
  siteURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/',
  //権限登録の操作を行うオーナーのメールアドレスとパスワードを記述します。
  owner: {
    email: 'hoge@hoge.com',
    password:'hogehoge'
  },
  //編集者権限を持つサイトのユーザとして登録するメールアドレスの一覧を記述します。
  editors: [
    'testuser02@cuc.global',
    'testuser04@cuc.global'
  ],
  //閲覧者権限を持つサイトのユーザとして登録するメールアドレスの一覧を記述します。
  viewers: [
    'testuser03@cuc.global'
  ],
  permissions: [
    {
      //ページのURLを記述します。
      pageURL: 'https://sites.google.com/a/cuc.global/dev-y41i3303-01/page1',
      //編集者権限を持つページのユーザとして登録するメールアドレスの一覧を記述します。
      editors: [
        'testuser02@cuc.global'
      ],
      //閲覧者権限を持つページのユーザとして登録するメールアドレスの一覧を記述します。
      viewers: [
        'testuser03@cuc.global'
      ]
      //editors、viewersいずれにも記述されていないユーザは、該当ページのユーザから削除されてページが閲覧できなくなります。
    },
    //複数のページを指定可能です。
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

var client = webdriverio.remote({ desiredCapabilities: {browserName: 'chrome'} });
gAA.setSitePermissions(client, CONFIG);
```

***

# テストの実行
テストを実行するためには、権限の設定情報のownerプロパティ部分を抽出した  
`./test/.test.conf.js`
を作成する必要があります。  
テストで使用するGoogleアカウントのログイン情報（ユーザ、パスワード）を記述します。  
  
作成例：
__./test/.test.conf.js__
```js
module.exports.ACCOUNT = {
  //権限登録の操作を行うオーナーのメールアドレスとパスワードを記述します。
  owner: {
    email: 'hoge@hoge.com',
    password:'hogehoge'
  },
  //権限の無いユーザで確認するためのメールアドレスとパスワードを記述します。
  other: {
    email: 'hoge@hoge.com',
    password:'hogehoge'
  }
};
```

seleniumサーバーを起動しておきます。  
```shell
./node_modules/.bin/selenium-standalone start
```

テストを実行します。  
./test/specs配下に存在するテストスクリプトが実行されます。  
```shell
npm test
```