FT_COCOAPODS="$1"
FT_FILE_PATH="GC-UniPlugin-App/Classes/GC-UniPlugin-App-Version.h"
VersionStr=$(cat ../../../.version)
SDK_VERSION=${VersionStr#*=}
MAIN_VERSION=$(echo "$SDK_VERSION" | sed -E 's/^([0-9]+\.[0-9]+\.[0-9]+).*/\1/')

if [[ "$FT_COCOAPODS" == "cocoapods" ]]; then
sed  -i '' 's/UniPluginAppVersion.*/UniPluginAppVersion @"'$SDK_VERSION'"/g' ../GC-UniPlugin-App/GC-UniPlugin-App/Classes/GC-UniPlugin-App-Version.h
else
# Modify the version number in the project, the purpose is to make the version in the info.plist 
# of the successfully packaged framework consistent with the actual version
sed  -i '' -e 's/MARKETING_VERSION \= [0-9].*\;/MARKETING_VERSION = '$MAIN_VERSION';/' GC-UniPlugin-App.xcodeproj/project.pbxproj
sed  -i '' 's/UniPluginAppVersion.*/UniPluginAppVersion @"'$SDK_VERSION'"/g' GC-UniPlugin-App/Classes/GC-UniPlugin-App-Version.h
# Use carthage to package the framework
carthage build --platform iOS --no-skip-current --use-xcframeworks
fi

