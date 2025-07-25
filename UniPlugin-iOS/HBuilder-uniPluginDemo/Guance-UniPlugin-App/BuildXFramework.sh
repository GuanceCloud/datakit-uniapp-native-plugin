# This script only compiles xcframework, it is recommended to use buildFramework.sh
# The buildFramework.sh script has a replace version operation, and uses carthage to package
buildFrameWorkWithName(){

FRAMEWORK_NAME="Guance-UniPlugin-App"
WORK_DIR='./build'
rm -r ${WORK_DIR}

##xcodebuild package
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

