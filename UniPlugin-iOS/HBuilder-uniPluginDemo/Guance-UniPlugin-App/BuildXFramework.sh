# 当前脚本仅编译 xcframework 推荐使用 buildFramework.sh
# buildFramework.sh 脚本里有替换 version 操作,借助 carthage 进行打包
buildFrameWorkWithName(){

FRAMEWORK_NAME="Guance-UniPlugin-App"
WORK_DIR='./build'
rm -r ${WORK_DIR}

##xcodebuild打包
xcodebuild archive \
  -scheme ${FRAMEWORK_NAME} \
  -archivePath "${WORK_DIR}/ios.xcarchive" \
  -sdk iphoneos \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES

xcodebuild archive \
  -scheme ${FRAMEWORK_NAME} \
  -archivePath "${WORK_DIR}/ios-sim.xcarchive" \
  -sdk iphonesimulator \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES


xcodebuild -create-xcframework \
  -framework "${WORK_DIR}/ios.xcarchive/Products/Library/Frameworks/Guance_UniPlugin_App.framework" \
  -framework "${WORK_DIR}/ios-sim.xcarchive/Products/Library/Frameworks/Guance_UniPlugin_App.framework" \
  -output "${WORK_DIR}/Guance_UniPlugin_App.xcframework"



echo "--------------END--------------"
}
echo "--------------START--------------"
echo "FRAMEWORK_NAME: $1"

buildFrameWorkWithName $1

