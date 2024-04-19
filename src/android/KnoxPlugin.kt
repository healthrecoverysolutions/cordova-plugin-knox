package com.hrs.knox

import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.json.JSONArray
import org.json.JSONObject
import timber.log.Timber

private const val ACTION_TEST = "test"

class KnoxPlugin : CordovaPlugin() {

	override fun pluginInitialize() {
		super.pluginInitialize()
	}

	override fun onPause(multitasking: Boolean) {
		super.onPause(multitasking)
	}

	override fun onStop() {
		super.onStop()
	}

	override fun onDestroy() {
		super.onDestroy()
	}

	override fun execute(
		action: String,
		args: JSONArray,
		callbackContext: CallbackContext
	): Boolean {
		Timber.v("execute action '$action'")
		when (action) {
			ACTION_TEST -> {
				cordova.threadPool.execute {
					callbackContext.success("test!")
				}
			}

			else -> {
				Timber.w("rejecting unsupported action '$action'")
				callbackContext.error("Action $action is not implemented in KnoxPlugin.")
				return false
			}
		}
		return true
	}
}