@file:Suppress("UNCHECKED_CAST", "USELESS_CAST", "INAPPLICABLE_JVM_NAME", "UNUSED_ANONYMOUS_PARAMETER", "SENSELESS_COMPARISON", "NAME_SHADOWING", "UNNECESSARY_NOT_NULL_ASSERTION")
package uts.sdk.modules.GCUniSessionReplay
import io.dcloud.uniapp.*
import io.dcloud.uniapp.extapi.*
import io.dcloud.uts.*
import io.dcloud.uts.Map
import io.dcloud.uts.Set
import io.dcloud.uts.UTSAndroid
import kotlin.properties.Delegates
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import gc.unisessionreplay.android.GCSessionReplayNative
open class GCSessionReplayConfig (
    open var sampleRate: Number? = null,
    open var sessionReplayOnErrorSampleRate: Number? = null,
    open var touchPrivacy: String? = null,
    open var textAndInputPrivacy: String? = null,
    open var imagePrivacy: String? = null,
    open var enableSwiftUI: Boolean? = null,
    open var enableLinkRUMKeys: UTSArray<String>? = null,
) : UTSObject()
fun stringifyParams(params: GCSessionReplayConfig): String {
    return JSON.stringify(params) ?: "{}"
}
open class GCUniSessionReplay {
    companion object {
        fun setConfig(params: GCSessionReplayConfig) {
            GCSessionReplayNative.setConfig(stringifyParams(params))
        }
    }
}
open class GCSessionReplayTouchPrivacy {
    companion object {
        val SHOW: String = "show"
        val HIDE: String = "hide"
    }
}
open class GCSessionReplayTextAndInputPrivacy {
    companion object {
        val MASK_SENSITIVE_INPUTS: String = "maskSensitiveInputs"
        val MASK_ALL_INPUTS: String = "maskAllInputs"
        val MASK_ALL: String = "maskAll"
    }
}
open class GCSessionReplayImagePrivacy {
    companion object {
        val MASK_NON_BUNDLED_ONLY: String = "maskNonBundledOnly"
        val MASK_ALL: String = "maskAll"
        val MASK_NONE: String = "maskNone"
    }
}
open class GCSessionReplayConfigJSONObject : UTSJSONObject() {
    open var sampleRate: Number? = null
    open var sessionReplayOnErrorSampleRate: Number? = null
    open var touchPrivacy: String? = null
    open var textAndInputPrivacy: String? = null
    open var imagePrivacy: String? = null
    open var enableSwiftUI: Boolean? = null
    open var enableLinkRUMKeys: UTSArray<String>? = null
}
open class GCUniSessionReplayByJs : GCUniSessionReplay {
    constructor() : super() {}
    companion object {
        fun setConfigByJs(params: GCSessionReplayConfigJSONObject) {
            return GCUniSessionReplay.setConfig(GCSessionReplayConfig(sampleRate = params.sampleRate, sessionReplayOnErrorSampleRate = params.sessionReplayOnErrorSampleRate, touchPrivacy = params.touchPrivacy, textAndInputPrivacy = params.textAndInputPrivacy, imagePrivacy = params.imagePrivacy, enableSwiftUI = params.enableSwiftUI, enableLinkRUMKeys = params.enableLinkRUMKeys))
        }
    }
}
open class GCSessionReplayTouchPrivacyByJs : GCSessionReplayTouchPrivacy {
    constructor() : super() {}
    companion object {
        val SHOW = GCSessionReplayTouchPrivacy.SHOW
        val HIDE = GCSessionReplayTouchPrivacy.HIDE
    }
}
open class GCSessionReplayTextAndInputPrivacyByJs : GCSessionReplayTextAndInputPrivacy {
    constructor() : super() {}
    companion object {
        val MASK_SENSITIVE_INPUTS = GCSessionReplayTextAndInputPrivacy.MASK_SENSITIVE_INPUTS
        val MASK_ALL_INPUTS = GCSessionReplayTextAndInputPrivacy.MASK_ALL_INPUTS
        val MASK_ALL = GCSessionReplayTextAndInputPrivacy.MASK_ALL
    }
}
open class GCSessionReplayImagePrivacyByJs : GCSessionReplayImagePrivacy {
    constructor() : super() {}
    companion object {
        val MASK_NON_BUNDLED_ONLY = GCSessionReplayImagePrivacy.MASK_NON_BUNDLED_ONLY
        val MASK_ALL = GCSessionReplayImagePrivacy.MASK_ALL
        val MASK_NONE = GCSessionReplayImagePrivacy.MASK_NONE
    }
}
