#
# Be sure to run `pod lib lint GuanceCloudPlugin.podspec' to ensure this is a
# valid spec before submitting.
#
# Any lines starting with a # are optional, but their use is encouraged
# To learn more about a Podspec see https://guides.cocoapods.org/syntax/podspec.html
#

Pod::Spec.new do |s|
  s.name             = 'Guance-UniPlugin-App'
  s.version          = '0.1.2'
  s.summary          = 'A short description of GuanceCloudPlugin.'
  
  # This description is used to generate tags and improve search results.
  #   * Think: What does it do? Why did you write it? What is the focus?
  #   * Try to keep it short, snappy and to the point.
  #   * Write the description between the DESC delimiters below.
  #   * Finally, don't worry about the indent, CocoaPods strips it!
  
  s.description      = <<-DESC
  TODO: Add long description of the pod here.
  DESC
  
  s.homepage         = 'https://github.com/hulilei/Guance-UniPlugin-App'
  # s.screenshots     = 'www.example.com/screenshots_1', 'www.example.com/screenshots_2'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'hulilei' => 'huuuu1016@gmail.com' }
  s.source           = { :git => 'https://github.com/hulilei/Guance-UniPlugin-App.git', :tag => s.version.to_s }
  # s.social_media_url = 'https://twitter.com/<TWITTER_USERNAME>'
  s.ios.deployment_target = '10.0'
  s.source_files = 'Guance-UniPlugin-App/Classes/**/*'
  s.static_framework = true
  s.xcconfig = {
    'USER_HEADER_SEARCH_PATHS' => ['"$(SRCROOT)/../../SDK/inc/DCUni"',  '"$(SRCROOT)/../../SDK/inc/weexHeader"']
  }
#  s.user_target_xcconfig = {
#    'ENABLE_BITCODE' => 'NO
#  }
  # s.resource_bundles = {
  #   'GuanceCloudPlugin' => ['GuanceCloudPlugin/Assets/*.png']
  # }
  
  # s.public_header_files = 'Pod/Classes/**/*.h'
  # s.frameworks = 'UIKit', 'MapKit'
  s.dependency 'FTMobileSDK', '1.4.4-beta.1'
  
end
