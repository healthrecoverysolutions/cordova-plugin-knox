package com.hrs.knox

import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import timber.log.Timber

class KnoxPlugin : CordovaPlugin() {

	override fun execute(
		action: String,
		args: JSONArray,
		callbackContext: CallbackContext
	): Boolean {
		Timber.w("ignoring action '$action' on disabled variant of knox plugin")
		callbackContext.error("Knox is disabled")
		return true
	}
}