package gc.unisessionreplay.android

import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import android.util.Log

object GCSessionReplayNative {
    private const val LOG_TAG = "GC-UniSessionReplay"
    private const val CORE_BRIDGE_CLASS = "com.ft.sdk.FTUniAppWebViewBridge"
    private const val DISABLE_FIRST_VIEW_BRIDGE_METHOD = "disableFirstViewBridge"
    private const val SDK_CLASS = "com.ft.sdk.FTSdk"
    private const val CONFIG_CLASS = "com.ft.sdk.sessionreplay.FTSessionReplayConfig"
    private const val WEB_BRIDGE_CLASS = "com.ft.sdk.WebAppInterface"

    fun enableFirstViewBridge() {
        invokeSafely("enable the first-view bridge") {
            Class.forName(CORE_BRIDGE_CLASS)
                .getMethod("enableFirstViewBridge")
                .invoke(null)
        }
    }

    private fun disableFirstViewBridge() {
        invokeSafely("disable the first-view bridge") {
            Class.forName(CORE_BRIDGE_CLASS)
                .getMethod(DISABLE_FIRST_VIEW_BRIDGE_METHOD)
                .invoke(null)
        }
    }

    fun setConfig(json: String?) {
        if (!isRumWebViewBridgeReady()) {
            Log.e(
                LOG_TAG,
                "Session Replay initialization requires the Mobile SDK and RUM WebView tracing to be configured first"
            )
            return
        }

        val params = parseObject(json)
        val config = invokeOrNull("create the Session Replay configuration") {
            Class.forName(CONFIG_CLASS).getConstructor().newInstance()
        } ?: return

        percentage(params["sampleRate"])?.let { setFloat(config, "setSampleRate", it) }
        percentage(params["sessionReplayOnErrorSampleRate"])
            ?.let { setFloat(config, "setSessionReplayOnErrorSampleRate", it) }
        touchPrivacy(params["touchPrivacy"])?.let {
            setEnum(config, "setTouchPrivacy", "com.ft.sdk.sessionreplay.TouchPrivacy", it)
        }
        textAndInputPrivacy(params["textAndInputPrivacy"])?.let {
            setEnum(config, "setTextAndInputPrivacy", "com.ft.sdk.sessionreplay.TextAndInputPrivacy", it)
        }
        imagePrivacy(params["imagePrivacy"])?.let {
            setEnum(config, "setImagePrivacy", "com.ft.sdk.sessionreplay.ImagePrivacy", it)
        }
        stringArray(params["enableLinkRUMKeys"])?.let { keys ->
            invokeSafely("set linked RUM keys") {
                config.javaClass.getMethod("enableLinkRUMKeys", Array<String>::class.java)
                    .invoke(config, keys)
            }
        }

        if (invokeSafely("initialize Session Replay") {
            Class.forName(SDK_CLASS)
                .getMethod("initSessionReplayConfig", Any::class.java)
                .invoke(null, config)
        }) {
            disableFirstViewBridge()
        }
    }

    private fun isRumWebViewBridgeReady(): Boolean {
        return try {
            val method = Class.forName(WEB_BRIDGE_CLASS)
                .getDeclaredMethod("isRumWebViewBridgeReady")
            method.isAccessible = true
            method.invoke(null) as? Boolean ?: false
        } catch (error: Throwable) {
            Log.e(LOG_TAG, "Unable to determine RUM WebView bridge readiness.", error)
            false
        }
    }

    private fun setFloat(config: Any, methodName: String, value: Float) {
        invokeSafely(methodName) {
            config.javaClass.getMethod(methodName, java.lang.Float.TYPE)
                .invoke(config, value)
        }
    }

    private fun setEnum(config: Any, methodName: String, enumClassName: String, constantName: String) {
        invokeSafely(methodName) {
            val enumClass = Class.forName(enumClassName)
            val value = enumClass.getField(constantName).get(null)
            config.javaClass.getMethod(methodName, enumClass).invoke(config, value)
        }
    }

    private fun parseObject(json: String?): JSONObject {
        if (json.isNullOrBlank()) {
            return JSONObject()
        }
        return JSON.parseObject(json) ?: JSONObject()
    }

    private fun percentage(value: Any?): Float? {
        val percentage = when (value) {
            is Number -> value.toFloat()
            is String -> value.trim().toFloatOrNull()
            else -> null
        } ?: return null
        return percentage.coerceIn(0f, 100f) / 100f
    }

    private fun normalized(value: Any?): String? {
        return (value as? String)?.trim()?.lowercase()
    }

    private fun touchPrivacy(value: Any?): String? {
        return when (normalized(value)) {
            "show" -> "SHOW"
            "hide" -> "HIDE"
            else -> null
        }
    }

    private fun textAndInputPrivacy(value: Any?): String? {
        return when (normalized(value)) {
            "masksensitiveinputs" -> "MASK_SENSITIVE_INPUTS"
            "maskallinputs" -> "MASK_ALL_INPUTS"
            "maskall" -> "MASK_ALL"
            else -> null
        }
    }

    private fun imagePrivacy(value: Any?): String? {
        return when (normalized(value)) {
            // Android has no bundled-image distinction. MASK_LARGE_ONLY is the
            // closest native behavior for the shared maskNonBundledOnly value.
            "masknonbundledonly" -> "MASK_LARGE_ONLY"
            "maskall" -> "MASK_ALL"
            "masknone" -> "MASK_NONE"
            else -> null
        }
    }

    private fun stringArray(value: Any?): Array<String>? {
        val values = when (value) {
            is JSONArray -> value.mapNotNull { item -> item as? String }
            is Collection<*> -> value.mapNotNull { item -> item as? String }
            is Array<*> -> value.mapNotNull { item -> item as? String }
            else -> return null
        }
        return values.toTypedArray()
    }

    private fun invokeSafely(operation: String, block: () -> Unit): Boolean {
        try {
            block()
            return true
        } catch (error: Throwable) {
            Log.e(LOG_TAG, "Unable to $operation.", error)
            return false
        }
    }

    private fun <T> invokeOrNull(operation: String, block: () -> T): T? {
        return try {
            block()
        } catch (error: Throwable) {
            Log.e(LOG_TAG, "Unable to $operation.", error)
            null
        }
    }
}
