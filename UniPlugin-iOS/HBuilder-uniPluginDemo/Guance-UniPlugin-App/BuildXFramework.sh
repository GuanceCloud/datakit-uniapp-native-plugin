buildFrameWorkWithName(){

FRAMEWORK_NAME="Guance-UniPlugin-App"
WORK_DIR='build'
#release环境下，generic ios device编译出的framework。这个framework只能供真机运行。
DEVICE_DIR=${WORK_DIR}/'Release-iphoneos'/${FRAMEWORK_NAME}'.framework'
#release环境下，simulator编译出的framework。这个framework只能供模拟器运行。
SIMULATOR_DIR=${WORK_DIR}/'Release-iphonesimulator'/${FRAMEWORK_NAME}'.framework'
#framework的输出目录
OUTPUT_DIR=FRAMEWORK/${FRAMEWORK_NAME}'.framework'

##xcodebuild打包
xcodebuild archive \
  -scheme ${FRAMEWORK_NAME} \
  -archivePath "./build/ios.xcarchive" \
  -sdk iphoneos \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES

xcodebuild archive \
  -scheme ${FRAMEWORK_NAME} \
  -archivePath "./build/ios-sim.xcarchive" \
  -sdk iphonesimulator \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES


xcodebuild -create-xcframework \
  -framework "./build/ios.xcarchive/Products/Library/Frameworks/Guance_UniPlugin_App.framework" \
  -framework "./build/ios-sim.xcarchive/Products/Library/Frameworks/Guance_UniPlugin_App.framework" \
  -output "./build/Guance_UniPlugin_App.xcframework"



#rm -r ${WORK_DIR}
echo "--------------END--------------"
}
echo "--------------START--------------"
echo "IPHONEOS_ARCH: ${IPHONEOS_ARCH}"
echo "IPHONESIMULATOR_ARCH: ${IPHONESIMULATOR_ARCH}"
echo "FRAMEWORK_NAME: $1"

buildFrameWorkWithName $1

