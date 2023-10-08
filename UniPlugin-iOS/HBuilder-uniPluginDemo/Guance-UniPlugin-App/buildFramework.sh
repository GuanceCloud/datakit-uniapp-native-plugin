FT_COCOAPODS="$1"
FT_FILE_PATH="Guance-UniPlugin-App/Classes/Guance-UniPlugin-App-Version.h"
VersionStr=$(cat ../../../.version)
SDK_VERSION=${VersionStr#*=}
if [[ "$FT_COCOAPODS" == "cocoapods" ]]; then
sed  -i '' 's/UniPluginAppVersion.*/UniPluginAppVersion @"'$SDK_VERSION'"/g' ../Guance-UniPlugin-App/Guance-UniPlugin-App/Classes/Guance-UniPlugin-App-Version.h
else
#修改工程中的版本号，目的：使打包成功的 framework 中 info.plist 里的 version 与实际 version 一致
sed  -i '' -e 's/MARKETING_VERSION \= [0-9].*\;/MARKETING_VERSION = '$SDK_VERSION';/' Guance-UniPlugin-App.xcodeproj/project.pbxproj
sed  -i '' 's/UniPluginAppVersion.*/UniPluginAppVersion @"'$SDK_VERSION'"/g' Guance-UniPlugin-App/Classes/Guance-UniPlugin-App-Version.h
#借助 carthage 进行打包 framework
carthage build --platform ios  --no-skip-current --use-xcframeworks
fi

