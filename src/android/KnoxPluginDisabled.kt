package com.hrs.knox

import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.json.JSONObject
import org.json.JSONArray
import timber.log.Timber

private const val KNOX_ENABLED = false
private const val ACTION_IS_ENABLED = "isEnabled"

class KnoxPlugin : CordovaPlugin() {

	override fun execute(
		action: String,
		args: JSONArray,
		callbackContext: CallbackContext
	): Boolean {
		Timber.v("execute action '$action'")
		when (action) {
			ACTION_IS_ENABLED -> {
				Timber.v("responding with 'false'")
				callbackContext.success(JSONObject().put("enabled", KNOX_ENABLED))
			}

			else -> {
				Timber.w("ignoring action '$action' on disabled variant of knox plugin")
				callbackContext.error("Knox is disabled")
			}
		}
		return true
	}
}