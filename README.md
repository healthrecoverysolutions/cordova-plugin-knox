# cordova-plugin-knox

Native bindings for the Knox SDK

## API

See `lib/cordova-plugin-knox.d.ts` for full API

## Contributing 

### Using the Knox SDK

SDK documentation can be found [here](https://docs.samsungknox.com/devref/knox-sdk/reference/packages.html)

### Add an Native Android API Entry Point

This plugin has several source files for android:

- `KnoxPlugin.kt` - empty stub file that will be replaced dynamically by cordova hooks
- `KnoxPluginDisabled.kt` - minimal implementation who's only purpose is to notify that the plugin is disabled
- `KnoxPluginEnabled.kt` - actual implementation of native bindings

Only the `KnoxPluginEnabled.kt` variant should be modified.
The other variants only exist for build-time disablement of knox sdk.

To add new API entry points:

1. Open `src/android/KnoxPluginEnabled.kt`
2. Add constants for the actions you want to implement (e.g. `private const val ACTION_REBOOT = "reboot"`)
3. Implement matcher blocks for each new action (in the `when` block of `override fun execute()`)

### Add a JavaScript API Hook to Native

This plugin utilizes typescript and code generation to
minimize friction when linking a native API to javascript.

JavaScript APIs should only be added to `src/ts/cordova-plugin-knox.ts`.

The `lib` and `www` directories, although in source control, are **generated directories**.
These directories will be overwritten by compiled changes each time `npm run build` is run, and
they should **not** be edited directly.

To add new API entry points:

1. Make sure you are using the correct node version in this repo - `nvm use`
2. Install this repo's dependencies (if not done already) - `npm i`
3. Open `src/ts/cordova-plugin-knox.ts`
4. Implement wrappers for your new actions on the `KnoxCordovaInterface` class
5. Build the typescript changes with `npm run build` - your changes will be propagated automatically to `lib` and `www` directories

### Test Changes

The fasted way to test your plugin changes is to install your local repo onto a cordova/ionic project:

```bash
ionic cordova plugin add file:./path/to/cordova-plugin-knox
```

OR, if this plugin has already been added to your cordova project, you can overwrite it (instead of uninstall/re-install):

```bash
npm install -D -E file:./path/to/cordova-plugin-knox
```

## Deployment

To build a "bump" version (i.e. just incrementing the patch value):

```bash
npm run bump
```

To build a custom version:

```bash
npm version XXX
npm run version:publish
```

See [npm version command](https://docs.npmjs.com/cli/v8/commands/npm-version) docs for more available options