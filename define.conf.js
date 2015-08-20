module.exports.URL = {
  COMMON_SHARING: 'system/app/pages/admin/commonsharing'
};

module.exports.SELECTOR = {
	LOGINED: "//a[contains(@title, '%s')]",

	INVITE_EMAIL: "//td[@id=':p.inviter']//textarea",
	INVITE_EMAIL_SUGGEST: "//div[@role='listbox']/div[@role='option']/div[contains(text(), '%s')]/..",
	INVITE_PERMISSION_LIST: "//td[@id=':p.inviter']//div[@role='listbox']",
	INVITE_PERMISSION_LIST_OPTION: "//div[@role='listbox']/div[@role='menuitemradio']//div[contains(text(), '%s')]/..",
	SEND_NOTICE: "//span[@id=':p.sendNotifications']",
	OK: "//div[@id=':p.share']",
	OK_CONFIRM: "//button[@name='sio']",
	TODO: "//td[@role='rowheader']//span[contains(text(),'%s')]/../../../../td[@role='gridcell']//div[@role='option']",
	IFRAME_SHARE_SETTING: "//iframe[@title='共有設定']",
	PAGE_ENABLE: "//div[@id='sites-page-toolbar']//div[@id='sites-admin-share-buttons-wrapper']/div[@id='sites-admin-share-enable-plp']",
	PAGE_DISABLE: "//div[@id='sites-page-toolbar']//div[@id='sites-admin-share-buttons-wrapper']/div[@id='sites-admin-share-disable-plp']",
	PAGE_ENABLE_CONFIRM: "//div[contains(@class, 'sites-admin-share-dialog-buttons')]/button[@name='ok']",

	REGISTERD_USERS: "//div[@role='button' and contains(@aria-label, 'さんを削除') and not(contains(@style, 'display: none'))]/ancestor::tr/td[@role='rowheader']/div/span[2]/span[2]",
	DELETE_SELECT: "//td[@role='rowheader']/div/span[2]/span[text()='%s']/ancestor::tr//div[@role='button' and contains(@aria-label, 'さんを削除') and not(contains(@style, 'display: none'))]",
	DELETE_SAVE: "//div[@role='button' and text()='変更を保存']",
	DELETE_ALERT: "//div[@role='alert']/div[text()='保存が必要な変更を加えました。']",

	BTN_SHARE: "//span[@id='sites-share-visibility-btn']/div[@role='button']",
	BTN_CHANGE: "//div[@id='sites-admin-share-inherits-selector']//div[contains(@id, 'changeLink')]/div[contains(text(), '変更')]",
	RADIO_CUSTOM: "//input[@id='permissions-custom-radio']",
	RADIO_INDEPENDENT: "//input[@id='permissions-ignores-radio']",
	PERMISSION_SAVE: "//button[contains(text(), '保存')]",
	PERMISSION_DESCRIPTION: "//div[contains(@id,'descriptionContainer')]/span[contains(@id, 'description')]",
};

module.exports.TITLE = {
  COMMON_SHARING: '共有と権限',
  NOT_OWNER: '権限がありません',
  PAGE_NOTFOUND_FIREFOX: 'ページが見つかりませんでした',
  PAGE_NOTFOUND_CHROME: 'Forbidden'
};

module.exports.EMESSAGE = {
  NOT_OWNER: 'ログインしているユーザーはサイトのオーナーではありません。',
  PAGE_NOTFOUND: '指定されたサイトが存在しません'
};
