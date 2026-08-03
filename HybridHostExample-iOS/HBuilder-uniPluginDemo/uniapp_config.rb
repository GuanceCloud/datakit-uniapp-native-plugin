# Fill values only for the modules enabled in Podfile.
# Unused module configs can stay empty; the script writes values only for enabled subspecs.

UNIAPP_PLIST_VALUES = {
  payment_wechat: {
    appid: '',
    universal_links: ''
  },
  payment_alipay: {
    scheme: ''
  },
  payment_paypal: {
    return_url: ''
  },
  payment_stripe: {
    return_url: '',
    scheme: ''
  },

  oauth_univerify: {
    appid: ''
  },
  oauth_sina: {
    appkey: '',
    app_secret: '',
    redirect_uri: '',
    universal_links: ''
  },
  oauth_qq: {
    appid: '',
    universal_links: ''
  },
  oauth_wechat: {
    appid: '',
    universal_links: ''
  },
  oauth_google: {
    client_id: '',
    reversed_client_id: ''
  },
  oauth_facebook: {
    appid: '',
    client_token: ''
  },

  share_sina: {
    appkey: '',
    app_secret: '',
    redirect_uri: '',
    universal_links: ''
  },
  share_qq: {
    appid: '',
    universal_links: ''
  },
  share_wechat: {
    appid: '',
    universal_links: ''
  },

  push_getui: {
    appid: '',
    appkey: '',
    appsecret: ''
  },

  speech_baidu: {
    appid: '',
    appkey: '',
    secretkey: ''
  },
  speech_ifly: {
    appid: ''
  },

  statistic_umeng: {
    appkey: '',
    channel: 'App Store'
  },

  map_baidu: {
    appkey: ''
  },
  map_gaode: {
    appkey: ''
  },
  map_google: {
    api_key: ''
  },

  uniad: {
    # Format from DCloud docs: bundle id|appid|adid|channel
    market_channel: '',
    dcloud_ad_id: ''
  },

  capabilities: {
    associated_domains: [],
    sign_in_with_apple: false,
    push_notifications: false
  }
}.freeze

# Optional values for UTS plugin config.json placeholders.
# Example: config.json value "{$appid}" reads UNIAPP_UTS_PLUGIN_VALUES['plugin-name'][:appid].
UNIAPP_UTS_PLUGIN_VALUES = {
  # 'uni-push' => {
  #   appid: '',
  #   appKey: '',
  #   appSecret: ''
  # }
}.freeze
