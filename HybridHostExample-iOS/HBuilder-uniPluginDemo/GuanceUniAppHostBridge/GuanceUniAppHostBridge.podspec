Pod::Spec.new do |s|
  s.name = 'GuanceUniAppHostBridge'
  s.version = '0.2.7'
  s.summary = 'Static Guance SDK bridge for hybrid UniApp UTS modules.'
  s.homepage = 'https://github.com/GuanceCloud/ft-sdk-uniapp-native-plugin'
  s.license = { :type => 'Apache-2.0' }
  s.authors = { 'Guance' => 'support@guance.com' }
  s.platform = :ios, '12.0'
  s.source = {
    :git => 'https://github.com/GuanceCloud/ft-sdk-uniapp-native-plugin.git',
    :tag => s.version.to_s
  }
  s.static_framework = true
  s.swift_version = '5.0'
  s.source_files = 'Sources/**/*.{h,m,mm,swift}'
  s.dependency 'GuanceSDK/Agent', '= 1.6.7-alpha.2'
  s.dependency 'GuanceSDK/SessionReplay', '= 1.6.7-alpha.2'
  s.frameworks = 'WebKit'
  s.pod_target_xcconfig = {
    'OTHER_SWIFT_FLAGS' => '$(inherited) -DGUANCE_UNI_COCOAPODS_SESSION_REPLAY'
  }
  # The dynamic UTS modules discover the bridge classes through Objective-C
  # runtime lookup. Keep those classes in the final application binary.
  s.user_target_xcconfig = {
    'OTHER_LDFLAGS' => '$(inherited) -ObjC'
  }
end
