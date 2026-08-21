pipeline {
    agent {
        label 'macos'
    }

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        // Update this value when the checked-in Android UTS AARs are rebuilt
        // with a different DCloud Android SDK / UTS Runtime package.
        DCLOUD_UTS_RUNTIME_VERSION = '5.15.82650_20260710'
        GITHUB_RELEASE_REPOSITORY = 'GuanceCloud/datakit-uniapp-native-plugin'
    }

    stages {
        stage('Checkout tag') {
            steps {
                checkout scm
            }
        }

        stage('Validate release inputs') {
            steps {
                script {
                    if (!env.TAG_NAME?.trim()) {
                        error('Release publishing is allowed only for a discovered SCM tag build.')
                    }
                }
                sh '''#!/usr/bin/env bash
set -euo pipefail

tag="$TAG_NAME"
case "$tag" in
  *[!A-Za-z0-9._+-]*|'')
    echo "Invalid release tag: $tag" >&2
    exit 1
    ;;
esac

git rev-parse --verify "refs/tags/$tag" >/dev/null
node scripts/check-version-consistency.js "$tag"

test -n "${DCLOUD_SDK_LIBS_DIR:-}"
test -d "$DCLOUD_SDK_LIBS_DIR/DCUniBase.framework"
test -d "$DCLOUD_SDK_LIBS_DIR/DCloudUTSFoundation.framework"
'''
            }
        }

        stage('Verify source contracts') {
            steps {
                sh '''#!/usr/bin/env bash
set -euo pipefail
node scripts/test-uts-proxy-exports.js
node scripts/test-view-tracking.js
node scripts/test-session-replay-feature.js
node scripts/test-hybrid-ios-uts-integration.js
node scripts/test-hybrid-android-uts-integration.js
node scripts/test-tagged-release-automation.js
node scripts/test-version-management.js
git diff --check
'''
            }
        }

        stage('Build Android Host') {
            steps {
                dir('HybridHostExample-Android') {
                    sh '''#!/usr/bin/env bash
set -euo pipefail
./gradlew :unimoduleGCUniPlugin:assembleRelease :unimoduleGCUniSessionReplay:assembleRelease :simpleDemo:assembleRelease
'''
                }
            }
        }

        stage('Package release artifact') {
            steps {
                sh '''#!/usr/bin/env bash
set -euo pipefail

DCLOUD_UTS_RUNTIME_VERSION="$DCLOUD_UTS_RUNTIME_VERSION" \
  bash HybridHostExample-Android/scripts/package_guance_uniapp_android.sh "$TAG_NAME"

DCLOUD_SDK_LIBS_DIR="$DCLOUD_SDK_LIBS_DIR" \
GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES=1 \
  bash HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/package_guance_uniapp_ios.sh "$TAG_NAME"

bash scripts/package_guance_uniapp_release.sh "$TAG_NAME" \
  "HybridHostExample-iOS/HBuilder-uniPluginDemo/build/GuanceUniApp-iOS/GuanceUniApp-iOS-$TAG_NAME.zip" \
  "HybridHostExample-Android/build/GuanceUniApp-Android/GuanceUniApp-Android-$TAG_NAME.zip"
'''
            }
        }

        stage('Publish GitHub Release') {
            steps {
                withCredentials([string(credentialsId: 'github-release-token', variable: 'GH_TOKEN')]) {
                    sh '''#!/usr/bin/env bash
set -euo pipefail

GITHUB_RELEASE_REPOSITORY="$GITHUB_RELEASE_REPOSITORY" \
  bash scripts/publish_github_release.sh "$TAG_NAME" \
    "build/GuanceUniApp/GuanceUniApp-$TAG_NAME.zip"
'''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'build/GuanceUniApp/*.zip', allowEmptyArchive: true, fingerprint: true
        }
    }
}
