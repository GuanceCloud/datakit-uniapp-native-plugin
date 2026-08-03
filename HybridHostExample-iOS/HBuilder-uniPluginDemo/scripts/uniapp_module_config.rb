# frozen_string_literal: true

require 'json'
require 'shellwords'
require 'tempfile'

module UniAppModuleConfig
  module_function

  DEFAULT_PERMISSION_TEXT = {
    'NSCameraUsageDescription' => 'Allow camera access for scanning and shooting.',
    'NSPhotoLibraryUsageDescription' => 'Allow photo library access for choosing images.',
    'NSPhotoLibraryAddUsageDescription' => 'Allow saving images to the photo library.',
    'NSMicrophoneUsageDescription' => 'Allow microphone access for recording audio.',
    'NSLocationUsageDescription' => 'Allow location access for location services.',
    'NSLocationWhenInUseUsageDescription' => 'Allow location access while using the app.',
    'NSLocationAlwaysUsageDescription' => 'Allow location access for background location services.',
    'NSLocationAlwaysAndWhenInUseUsageDescription' => 'Allow location access while using the app and in the background.',
    'NSUserTrackingUsageDescription' => 'Allow tracking to deliver personalized ads.',
    'NSContactsUsageDescription' => 'Allow contacts access for related features.',
    'NSFaceIDUsageDescription' => 'Allow Face ID authentication.',
    'NSBluetoothAlwaysUsageDescription' => 'Allow Bluetooth access for related features.',
    'NSBluetoothPeripheralUsageDescription' => 'Allow Bluetooth peripheral access for related features.'
  }.freeze

  INFO_PRIVACIES = {
    'CameraGallery' => %w[NSCameraUsageDescription NSPhotoLibraryUsageDescription NSPhotoLibraryAddUsageDescription NSMicrophoneUsageDescription],
    'Barcode' => %w[NSCameraUsageDescription],
    'FacialRecognitionVerify' => %w[NSCameraUsageDescription],
    'Geolocation' => %w[NSLocationUsageDescription NSLocationWhenInUseUsageDescription NSLocationAlwaysUsageDescription NSLocationAlwaysAndWhenInUseUsageDescription],
    'Geolocation-Baidu' => %w[NSLocationUsageDescription NSLocationWhenInUseUsageDescription NSLocationAlwaysUsageDescription NSLocationAlwaysAndWhenInUseUsageDescription],
    'Geolocation-Gaode' => %w[NSLocationUsageDescription NSLocationWhenInUseUsageDescription NSLocationAlwaysUsageDescription NSLocationAlwaysAndWhenInUseUsageDescription],
    'Map-Baidu' => %w[NSLocationUsageDescription NSLocationWhenInUseUsageDescription NSLocationAlwaysUsageDescription NSLocationAlwaysAndWhenInUseUsageDescription],
    'Map-Gaode' => %w[NSLocationUsageDescription NSLocationWhenInUseUsageDescription NSLocationAlwaysUsageDescription NSLocationAlwaysAndWhenInUseUsageDescription],
    'Map-Google' => %w[NSLocationUsageDescription NSLocationWhenInUseUsageDescription NSLocationAlwaysUsageDescription NSLocationAlwaysAndWhenInUseUsageDescription],
    'Speech-Baidu' => %w[NSMicrophoneUsageDescription],
    'Speech-Ifly' => %w[NSMicrophoneUsageDescription NSContactsUsageDescription],
    'FaceId' => %w[NSFaceIDUsageDescription],
    'BlueTooth' => %w[NSBluetoothAlwaysUsageDescription NSBluetoothPeripheralUsageDescription],
    'IBeacon' => %w[NSBluetoothAlwaysUsageDescription NSBluetoothPeripheralUsageDescription NSLocationWhenInUseUsageDescription],
    'UniAd-GG' => %w[NSUserTrackingUsageDescription],
    'UniAd-Pangle' => %w[NSUserTrackingUsageDescription],
    'UniAd-Baidu' => %w[NSLocationWhenInUseUsageDescription],
    'UniAd-KS' => %w[NSLocationWhenInUseUsageDescription],
    'UniAd-KS-Content' => %w[NSLocationWhenInUseUsageDescription],
    'UniAd-Sigmob' => %w[NSLocationWhenInUseUsageDescription]
  }.freeze

  FEATURE_COMMANDS = {
    'Payment-AliPay' => ['Add :Payment:extend:alix string PGAlixPay'],
    'Payment-Wechat' => ['Add :Payment:extend:weixin string PGWXPay'],
    'Payment-IAP' => ['Add :Payment:extend:appleiap string PGPlatbyIAP'],
    'Payment-Paypal' => ['Add :Payment:extend:paypal string PGPaypalPay'],
    'Payment-Stripe' => ['Add :Payment:extend:stripe string PGStripePay'],
    'Oauth-Univerify' => ['Add :OAuth:extend:univerify string PGUniVerify'],
    'Oauth-Sina' => ['Add :OAuth:extend:weibo string PGSinaWBOauth'],
    'Oauth-QQ' => ['Add :OAuth:extend:qq string PGQQOauth'],
    'Oauth-Wechat' => ['Add :OAuth:extend:weixin string PGWXOauth'],
    'Oauth-Wechat-PaySDK' => ['Add :OAuth:extend:weixin string PGWXOauth'],
    'Oauth-Apple' => ['Add :OAuth:extend:apple string PGAppleOauth'],
    'Oauth-Google' => ['Add :OAuth:extend:google string PGGoogleOauth'],
    'Oauth-Facebook' => ['Add :OAuth:extend:facebook string PGFBOauth'],
    'Push-UniPush' => ['Add :Push:class string PGPushActualize', 'Set :Push:server:class PGPushServerAct'],
    'Push-Getui' => ['Add :Push:class string PGPushActualize', 'Set :Push:server:class PGPushServerAct'],
    'Push-FCM' => ['Add :Push:class string PGPushActualize', 'Set :Push:server:class PGPushServerAct'],
    'Share-Sina' => ['Add :Share:extend:sinaweibo string PGSinaShare'],
    'Share-QQ' => ['Add :Share:extend:qq string PGTencentQQShare'],
    'Share-Wechat' => ['Add :Share:extend:weixin string PGWXShare'],
    'Share-Wechat-PaySDK' => ['Add :Share:extend:weixin string PGWXShare'],
    'Speech-Baidu' => ['Add :Speech:extend:baidu string PGBaiduSpeech'],
    'Speech-Ifly' => ['Add :Speech:extend:ifly string PGIFLYSpeech'],
    'Statistic-Umeng' => ['Set :Statistic:server:class UmengStatisticServer', 'Set :Statistic:server:identifier com.umeng.startup', 'Set :Statistic:class UmengStatistic'],
    'Statistic-Firebase' => ['Set :Statistic:server:class GoogleStatisticServer', 'Set :Statistic:server:identifier com.firebase.startup', 'Set :Statistic:class GoogleStatistic']
  }.freeze

  AD_PLIST_CHANNELS = {
    'UniAd-CSJ' => :csj,
    'UniAd-Gromore' => :gm,
    'UniAd-GDT' => :gdt,
    'UniAd-GG' => :gg,
    'UniAd-Pangle' => :pg,
    'UniAd-KS' => :ks,
    'UniAd-KS-Content' => :ks,
    'UniAd-Baidu' => :bd,
    'UniAd-Sigmob' => :sgm
  }.freeze

  def apply(enabled_subspecs, options = {})
    project_dir = File.expand_path('..', __dir__)
    sdk_dir = File.expand_path('../..', __dir__)
    info_plist = options.fetch(:info_plist, File.join(project_dir, 'HBuilder-Hello', 'HBuilder-Hello-Info.plist'))
    feature_plist = options.fetch(:feature_plist, File.join(sdk_dir, 'SDK', 'Bundles', 'PandoraApi.bundle', 'feature.plist'))
    entitlements = options.fetch(:entitlements, File.join(project_dir, 'HBuilder', 'HBuilder.entitlements'))
    permission_text = DEFAULT_PERMISSION_TEXT.merge(options.fetch(:permission_text, {}))
    plist_values = symbolize_keys(options.fetch(:plist_values, {}))
    uts_plugins = options.fetch(:uts_plugins, [])
    strict = options.fetch(:strict, false)

    apply_info_privacies(info_plist, enabled_subspecs, permission_text)
    apply_feature_commands(feature_plist, enabled_subspecs)
    apply_plist_values(info_plist, enabled_subspecs, plist_values, strict)
    apply_uts_plugin_values(info_plist, entitlements, uts_plugins)
    apply_entitlements(entitlements, plist_values)
    warn_external_requirements(project_dir, enabled_subspecs, plist_values)
  end

  def apply_info_privacies(info_plist, enabled_subspecs, permission_text)
    keys = enabled_subspecs.flat_map { |name| INFO_PRIVACIES.fetch(name, []) }.uniq
    keys.each do |key|
      add_if_missing(info_plist, ":#{key}", 'string', permission_text.fetch(key, key))
    end
  end

  def apply_feature_commands(feature_plist, enabled_subspecs)
    commands = enabled_subspecs.flat_map { |name| FEATURE_COMMANDS.fetch(name, []) }
    commands.each { |command| run_plistbuddy(feature_plist, command, allow_failure: command.start_with?('Add ')) }
  end

  def apply_plist_values(info_plist, enabled_subspecs, values, strict)
    plist = read_plist(info_plist)
    changed = false

    changed ||= apply_payment_values(plist, enabled_subspecs, values, strict)
    changed ||= apply_oauth_values(plist, enabled_subspecs, values, strict)
    changed ||= apply_share_values(plist, enabled_subspecs, values, strict)
    changed ||= apply_push_values(plist, enabled_subspecs, values, strict)
    changed ||= apply_speech_values(plist, enabled_subspecs, values, strict)
    changed ||= apply_statistic_values(plist, enabled_subspecs, values, strict)
    changed ||= apply_map_values(plist, enabled_subspecs, values, strict)
    changed ||= apply_ad_values(plist, enabled_subspecs, values, strict)

    write_plist(info_plist, plist) if changed
  end

  def apply_payment_values(plist, enabled, values, strict)
    changed = false
    if enabled.include?('Payment-Wechat')
      cfg = values.fetch(:payment_wechat, {})
      appid = required_value(cfg, :appid, 'payment_wechat.appid', strict)
      universal_links = optional_value(cfg, :universal_links)
      if present?(appid)
        changed ||= add_url_scheme(plist, 'weixin', appid)
        changed ||= add_unique_values(plist, 'LSApplicationQueriesSchemes', %w[weixin weixinULAPI weixinURLParamsAPI])
        changed ||= set_nested_value(plist, %w[weixin appid], appid)
      end
      changed ||= set_nested_value(plist, %w[weixin UniversalLinks], universal_links) if present?(universal_links)
    end

    if enabled.include?('Payment-AliPay')
      cfg = values.fetch(:payment_alipay, {})
      scheme = required_value(cfg, :scheme, 'payment_alipay.scheme', strict)
      if present?(scheme)
        changed ||= add_url_scheme(plist, 'alixpay', scheme)
        changed ||= add_unique_values(plist, 'LSApplicationQueriesSchemes', %w[alipay safepay])
      end
    end

    %w[Payment-Paypal Payment-Stripe].each do |name|
      next unless enabled.include?(name)

      key = name == 'Payment-Paypal' ? :payment_paypal : :payment_stripe
      plist_key = name == 'Payment-Paypal' ? 'paypal' : 'stripe'
      return_url = required_value(values.fetch(key, {}), :return_url, "#{key}.return_url", strict)
      changed ||= set_nested_value(plist, [plist_key, 'returnUrl'], return_url) if present?(return_url)
    end

    stripe_scheme = optional_value(values.fetch(:payment_stripe, {}), :scheme)
    changed ||= add_url_scheme(plist, 'stripe', stripe_scheme) if enabled.include?('Payment-Stripe') && present?(stripe_scheme)
    changed
  end

  def apply_oauth_values(plist, enabled, values, strict)
    changed = false

    if enabled.include?('Oauth-Univerify')
      appid = required_value(values.fetch(:oauth_univerify, {}), :appid, 'oauth_univerify.appid', strict)
      changed ||= set_nested_value(plist, %w[DCloudConfig univerify appid], appid) if present?(appid)
    end

    changed ||= apply_sina_values(plist, values.fetch(:oauth_sina, {}), 'oauth_sina', strict) if enabled.include?('Oauth-Sina')
    changed ||= apply_qq_values(plist, values.fetch(:oauth_qq, {}), 'oauth_qq', strict) if enabled.include?('Oauth-QQ')
    if (enabled & %w[Oauth-Wechat Oauth-Wechat-PaySDK]).any?
      changed ||= apply_wechat_values(plist, values.fetch(:oauth_wechat, {}), 'oauth_wechat', strict)
    end

    if enabled.include?('Oauth-Google')
      cfg = values.fetch(:oauth_google, {})
      client_id = required_value(cfg, :client_id, 'oauth_google.client_id', strict)
      reversed_client_id = required_value(cfg, :reversed_client_id, 'oauth_google.reversed_client_id', strict)
      changed ||= set_nested_value(plist, ['GIDClientID'], client_id) if present?(client_id)
      changed ||= add_url_scheme(plist, 'google_url', reversed_client_id) if present?(reversed_client_id)
    end

    if enabled.include?('Oauth-Facebook')
      cfg = values.fetch(:oauth_facebook, {})
      appid = required_value(cfg, :appid, 'oauth_facebook.appid', strict)
      token = required_value(cfg, :client_token, 'oauth_facebook.client_token', strict)
      changed ||= set_nested_value(plist, ['FacebookAppID'], appid) if present?(appid)
      changed ||= set_nested_value(plist, ['FacebookClientToken'], token) if present?(token)
      changed ||= add_url_scheme(plist, 'facebook', "fb#{appid}") if present?(appid)
      changed ||= add_unique_values(plist, 'LSApplicationQueriesSchemes', %w[fbapi fb-messenger-share-api fbauth2 fbshareextension])
    end

    changed
  end

  def apply_share_values(plist, enabled, values, strict)
    changed = false
    changed ||= apply_sina_values(plist, values.fetch(:share_sina, {}), 'share_sina', strict) if enabled.include?('Share-Sina')
    changed ||= apply_qq_values(plist, values.fetch(:share_qq, {}), 'share_qq', strict) if enabled.include?('Share-QQ')
    if (enabled & %w[Share-Wechat Share-Wechat-PaySDK]).any?
      changed ||= apply_wechat_values(plist, values.fetch(:share_wechat, {}), 'share_wechat', strict)
    end
    changed
  end

  def apply_push_values(plist, enabled, values, strict)
    return false unless (enabled & %w[Push-UniPush Push-Getui]).any?

    cfg = values.fetch(:push_getui, values.fetch(:push_unipush, {}))
    changed = false
    %i[appid appkey appsecret].each do |key|
      value = required_value(cfg, key, "push_getui.#{key}", strict)
      changed ||= set_nested_value(plist, ['getui', key.to_s], value) if present?(value)
    end
    changed
  end

  def apply_speech_values(plist, enabled, values, strict)
    changed = false
    if enabled.include?('Speech-Baidu')
      cfg = values.fetch(:speech_baidu, {})
      appid = required_value(cfg, :appid, 'speech_baidu.appid', strict)
      appkey = required_value(cfg, :appkey, 'speech_baidu.appkey', strict)
      secretkey = required_value(cfg, :secretkey, 'speech_baidu.secretkey', strict)
      changed ||= set_nested_value(plist, %w[baiduspeech APP_ID], appid) if present?(appid)
      changed ||= set_nested_value(plist, %w[baiduspeech API_KEY], appkey) if present?(appkey)
      changed ||= set_nested_value(plist, %w[baiduspeech SECRET_KEY], secretkey) if present?(secretkey)
    end

    if enabled.include?('Speech-Ifly')
      appid = required_value(values.fetch(:speech_ifly, {}), :appid, 'speech_ifly.appid', strict)
      changed ||= set_nested_value(plist, %w[iFly appid], appid) if present?(appid)
    end
    changed
  end

  def apply_statistic_values(plist, enabled, values, strict)
    return false unless enabled.include?('Statistic-Umeng')

    cfg = values.fetch(:statistic_umeng, {})
    appkey = required_value(cfg, :appkey, 'statistic_umeng.appkey', strict)
    channel = optional_value(cfg, :channel)
    changed = false
    changed ||= set_nested_value(plist, %w[umeng appkey], appkey) if present?(appkey)
    changed ||= set_nested_value(plist, %w[umeng channel], channel) if present?(channel)
    changed
  end

  def apply_map_values(plist, enabled, values, strict)
    changed = false
    if (enabled & %w[Map-Baidu Geolocation-Baidu]).any?
      appkey = required_value(values.fetch(:map_baidu, {}), :appkey, 'map_baidu.appkey', strict)
      changed ||= set_nested_value(plist, %w[baidu appkey], appkey) if present?(appkey)
    end
    if (enabled & %w[Map-Gaode Geolocation-Gaode]).any?
      appkey = required_value(values.fetch(:map_gaode, {}), :appkey, 'map_gaode.appkey', strict)
      changed ||= set_nested_value(plist, %w[amap appkey], appkey) if present?(appkey)
    end
    if enabled.include?('Map-Google')
      api_key = required_value(values.fetch(:map_google, {}), :api_key, 'map_google.api_key', strict)
      changed ||= set_nested_value(plist, %w[googleMap APIKey], api_key) if present?(api_key)
    end
    changed
  end

  def apply_ad_values(plist, enabled, values, strict)
    cfg = values.fetch(:uniad, {})
    changed = false
    market_channel = optional_value(cfg, :market_channel)
    changed ||= set_nested_value(plist, ['marketChannel'], market_channel) if present?(market_channel) && enabled.any? { |name| name.start_with?('UniAd-') }
    ad_id = optional_value(cfg, :dcloud_ad_id)
    changed ||= set_nested_value(plist, ['DCLOUD_AD_ID'], ad_id) if present?(ad_id) && enabled.any? { |name| name.start_with?('UniAd-') }

    AD_PLIST_CHANNELS.each do |subspec, channel|
      next unless enabled.include?(subspec)

      channel_cfg = cfg.fetch(channel, {})
      appid = optional_value(channel_cfg, :appid)
      splash = optional_value(channel_cfg, :splash_slotid)
      changed ||= set_nested_value(plist, ['uniad', channel.to_s, 'appid'], appid) if present?(appid)
      changed ||= set_nested_value(plist, ['uniad', channel.to_s, 'splash_slotid'], splash) if present?(splash)
      next if !strict || present?(appid) || present?(splash)

      warn_missing("uniad.#{channel}.appid / splash_slotid")
    end
    changed
  end

  def apply_sina_values(plist, cfg, label, strict)
    appkey = required_value(cfg, :appkey, "#{label}.appkey", strict)
    app_secret = optional_value(cfg, :app_secret) || optional_value(cfg, :appSecret)
    redirect_uri = optional_value(cfg, :redirect_uri) || optional_value(cfg, :redirectURI)
    universal_links = optional_value(cfg, :universal_links)
    changed = false
    if present?(appkey)
      changed ||= set_nested_value(plist, %w[sinaweibo appkey], appkey)
      changed ||= add_url_scheme(plist, 'com.weibo', "wb#{appkey}")
      changed ||= add_unique_values(plist, 'LSApplicationQueriesSchemes', %w[tencentweiboSdkv2 weibosdk2.5 sinaweibo sinaweibohd weibosdk])
    end
    changed ||= set_nested_value(plist, %w[sinaweibo appSecret], app_secret) if present?(app_secret)
    changed ||= set_nested_value(plist, %w[sinaweibo redirectURI], redirect_uri) if present?(redirect_uri)
    changed ||= set_nested_value(plist, %w[sinaweibo UniversalLinks], universal_links) if present?(universal_links)
    changed
  end

  def apply_qq_values(plist, cfg, label, strict)
    appid = required_value(cfg, :appid, "#{label}.appid", strict)
    universal_links = optional_value(cfg, :universal_links)
    changed = false
    if present?(appid)
      changed ||= set_nested_value(plist, %w[qq appid], appid)
      changed ||= add_url_scheme(plist, 'tencentopenapi', "tencent#{appid}")
      changed ||= add_unique_values(plist, 'LSApplicationQueriesSchemes', %w[mqq mqqapi mqzone wtloginmqq2 mqqopensdkapiV3 mqqwpa mqqopensdkapiV2 mqqOpensdkSSoLogin])
    end
    changed ||= set_nested_value(plist, %w[qq UniversalLinks], universal_links) if present?(universal_links)
    changed
  end

  def apply_wechat_values(plist, cfg, label, strict)
    appid = required_value(cfg, :appid, "#{label}.appid", strict)
    universal_links = optional_value(cfg, :universal_links)
    changed = false
    if present?(appid)
      changed ||= set_nested_value(plist, %w[weixin appid], appid)
      changed ||= add_url_scheme(plist, 'weixin', appid)
      changed ||= add_unique_values(plist, 'LSApplicationQueriesSchemes', %w[weixin weixinULAPI weixinURLParamsAPI])
    end
    changed ||= set_nested_value(plist, %w[weixin UniversalLinks], universal_links) if present?(universal_links)
    changed
  end

  def apply_entitlements(entitlements, values)
    return unless File.exist?(entitlements)

    cfg = values.fetch(:capabilities, {})
    domains = Array(optional_value(cfg, :associated_domains)).select { |value| present?(value) }
    apple = optional_value(cfg, :sign_in_with_apple)
    push = optional_value(cfg, :push_notifications)
    return if domains.empty? && !apple && !push

    plist = read_plist(entitlements)
    changed = false
    changed ||= add_unique_values(plist, 'com.apple.developer.associated-domains', domains) unless domains.empty?
    changed ||= add_unique_values(plist, 'com.apple.developer.applesignin', ['Default']) if apple
    changed ||= set_nested_value(plist, ['aps-environment'], push.to_s == 'production' ? 'production' : 'development') if push
    write_plist(entitlements, plist) if changed
  end

  def apply_uts_plugin_values(info_plist, entitlements, plugins)
    return if plugins.empty?

    apply_uts_info_plists(info_plist, plugins)
    apply_uts_entitlements(entitlements, plugins)
    warn_uts_deployment_targets(plugins)
  end

  def apply_uts_info_plists(info_plist, plugins)
    plist = read_plist(info_plist)
    changed = false
    plugins.each do |plugin|
      info = plugin[:info_plist]
      changed ||= merge_plist_file(plist, info) if info && File.exist?(info)

      config = plugin[:config] || {}
      plists = config['plists'] || config[:plists]
      changed ||= merge_config_plists(plist, plists)
    end
    write_plist(info_plist, plist) if changed
  end

  def apply_uts_entitlements(entitlements, plugins)
    return unless File.exist?(entitlements)

    plist = read_plist(entitlements)
    changed = false
    plugins.each do |plugin|
      path = plugin[:entitlements]
      changed ||= merge_plist_file(plist, path) if path && File.exist?(path)
    end
    write_plist(entitlements, plist) if changed
  end

  def merge_plist_file(target, path)
    source = read_plist(path)
    deep_merge_plist!(target, source)
  rescue StandardError => e
    warn "[UniAppModuleConfig] Failed to merge #{path}: #{e.message}"
    false
  end

  def merge_config_plists(target, plists)
    case plists
    when Hash
      deep_merge_plist!(target, stringify_keys(plists))
    when Array
      plists.reduce(false) do |changed, item|
        item.is_a?(Hash) ? (deep_merge_plist!(target, stringify_keys(item)) || changed) : changed
      end
    else
      false
    end
  end

  def deep_merge_plist!(target, source)
    changed = false
    source.each do |key, value|
      if target[key].is_a?(Hash) && value.is_a?(Hash)
        changed ||= deep_merge_plist!(target[key], value)
      elsif target[key].is_a?(Array) && value.is_a?(Array)
        before = target[key].dup
        value.each { |item| target[key] << item unless target[key].include?(item) }
        changed ||= before != target[key]
      elsif target[key] != value
        target[key] = value
        changed = true
      end
    end
    changed
  end

  def warn_uts_deployment_targets(plugins)
    plugins.each do |plugin|
      target = (plugin[:config] || {})['deploymentTarget']
      next unless present?(target)

      warn "[UniAppModuleConfig] UTS plugin #{plugin[:name]} requires iOS #{target}; ensure Podfile and Xcode deployment target are not lower."
    end
  end

  def warn_external_requirements(project_dir, enabled, values)
    warn_file_missing(project_dir, 'GoogleService-Info.plist') if (enabled & %w[Push-FCM Statistic-Firebase]).any?
    warn '[UniAppModuleConfig] Please keep required AppDelegate system callbacks for oauth/share/payment modules.' if (enabled & %w[Oauth-Sina Oauth-QQ Oauth-Wechat Oauth-Wechat-PaySDK Oauth-Google Oauth-Facebook Share-Sina Share-QQ Share-Wechat Share-Wechat-PaySDK Payment-Wechat]).any?
    warn '[UniAppModuleConfig] Please enable Push Notifications and upload APNs certificates in the related developer console.' if (enabled & %w[Push-UniPush Push-Getui Push-FCM]).any?
    domains = Array(optional_value(values.fetch(:capabilities, {}), :associated_domains)).select { |value| present?(value) }
    warn '[UniAppModuleConfig] Associated Domains still need to be enabled in Apple Developer and Xcode signing settings.' unless domains.empty?
  end

  def warn_file_missing(project_dir, filename)
    return if Dir.glob(File.join(project_dir, '**', filename)).any?

    warn "[UniAppModuleConfig] Missing file: #{filename}. Please download it from the related platform and add it to the app target."
  end

  def required_value(hash, key, label, strict)
    value = optional_value(hash, key)
    warn_missing(label) if !present?(value) && strict
    value
  end

  def optional_value(hash, key)
    hash[key] || hash[key.to_s]
  end

  def warn_missing(label)
    warn "[UniAppModuleConfig] Missing config: #{label}. Please edit HBuilder-Hello/uniapp_config.rb."
  end

  def add_if_missing(plist, path, type, value)
    return if run_plistbuddy(plist, "Print #{path}", allow_failure: true)

    run_plistbuddy(plist, "Add #{path} #{type} #{value}")
  end

  def add_url_scheme(plist, name, scheme)
    plist['CFBundleURLTypes'] ||= []
    item = plist['CFBundleURLTypes'].find do |entry|
      entry['CFBundleURLName'] == name || Array(entry['CFBundleURLSchemes']).include?(scheme)
    end
    if item
      item['CFBundleTypeRole'] ||= 'Editor'
      item['CFBundleURLName'] = name
      item['CFBundleURLSchemes'] ||= []
      return add_unique_values(item, 'CFBundleURLSchemes', [scheme])
    end

    plist['CFBundleURLTypes'] << {
      'CFBundleTypeRole' => 'Editor',
      'CFBundleURLName' => name,
      'CFBundleURLSchemes' => [scheme]
    }
    true
  end

  def add_unique_values(hash, key, values)
    hash[key] ||= []
    before = hash[key].dup
    values.each { |value| hash[key] << value unless hash[key].include?(value) }
    before != hash[key]
  end

  def set_nested_value(hash, path, value)
    current = hash
    path[0...-1].each { |key| current = (current[key] ||= {}) }
    last = path[-1]
    return false if current[last] == value

    current[last] = value
    true
  end

  def read_plist(plist)
    output = `/usr/bin/plutil -convert json -o - #{plist.shellescape}`
    raise "Failed to read plist: #{plist}" unless $CHILD_STATUS&.success? || $?.success?

    JSON.parse(output)
  end

  def write_plist(plist, hash)
    Tempfile.create(['uniapp-info', '.json']) do |file|
      file.write(JSON.pretty_generate(hash))
      file.close
      cmd = ['/usr/bin/plutil', '-convert', 'xml1', '-o', plist, file.path].map(&:shellescape).join(' ')
      raise "Failed to write plist: #{plist}" unless system(cmd)
    end
  end

  def present?(value)
    !(value.nil? || (value.respond_to?(:empty?) && value.empty?))
  end

  def symbolize_keys(object)
    case object
    when Hash
      object.each_with_object({}) { |(key, value), result| result[key.to_sym] = symbolize_keys(value) }
    when Array
      object.map { |value| symbolize_keys(value) }
    else
      object
    end
  end

  def stringify_keys(object)
    case object
    when Hash
      object.each_with_object({}) { |(key, value), result| result[key.to_s] = stringify_keys(value) }
    when Array
      object.map { |value| stringify_keys(value) }
    else
      object
    end
  end

  def run_plistbuddy(plist, command, allow_failure: false)
    escaped = ['/usr/libexec/PlistBuddy', '-c', command, plist].map(&:shellescape).join(' ')
    system(escaped, out: File::NULL, err: File::NULL).tap do |ok|
      raise "PlistBuddy failed: #{command} -> #{plist}" if !ok && !allow_failure
    end
  end
end
