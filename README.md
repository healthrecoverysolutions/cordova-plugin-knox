# cordova-plugin-knox

Native bindings for the Knox SDK

## API

See `lib/cordova-plugin-knox.d.ts` for full API

## Contributing

To add a new API entry point:

1. Make sure you are using the correct node version - `nvm use`
2. Install this repo's dependencies (if not done already) - `npm i`
3. Open `src/android/KnoxPluginEnabled.kt`
4. Add constants for the actions you want to implement (e.g. `private const val ACTION_REBOOT = "reboot"`)
5. Implement matcher blocks for each new action (in the `when` block of `override fun execute()`)
6. Open `src/ts/cordova-plugin-knox.ts`
7. Implement wrappers for your new actions on the `KnoxCordovaInterface` class
8. Build the typescript changes with `npm run build`
9. Install your local repo onto a cordova/ionic project and test - `ionic cordova plugin add file:./path/to/cordova-plugin-knox`

NOTE: if the plugin has already been added to your cordova project, you can overwrite it (instead of uninstall/instal) via:

```bash
npm i -D -E file:./path/to/cordova-plugin-knox
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