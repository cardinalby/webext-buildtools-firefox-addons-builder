[![Build Status](https://travis-ci.com/cardinalby/webext-buildtools-firefox-addons-builder.svg?branch=master)](https://travis-ci.com/cardinalby/webext-buildtools-firefox-addons-builder)
### Introduction
*webext-buildtools* builder which allows you deploy extension (packed to zip) 
to Firefox Addons, and sign xpi file (for offline distribution).

If you need a **complete solution** for Web Extension build/deploy, go to 
[webext-buildtools-integrated-builder](https://github.com/cardinalby/webext-buildtools-integrated-builder) repo.  

To read what are *webext-buildtools* and *builders* go to 
[webext-buildtools-builder-types](https://github.com/cardinalby/webext-buildtools-builder-types) repo.

Builder is based on 
[firefox-extension-deploy](https://www.npmjs.com/package/firefox-extension-deploy) and
[sign-addon](https://www.npmjs.com/package/sign-addon) packages.

### Installation
`npm install webext-buildtools-firefox-addons-builder`

### Purpose

Builder uses Firefox Addons API to deploy your extension and/or get signed crx 
file for offline distribution 
(read ["Signing and distributing your add-on"](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Distribution) for details).

Builder doesn't allow to publish new extension, only update existing (`deploy.extensionId` in options) 
with new version.  

### Usage example
```js
const FirefoxAddonsBuilder = require('webext-buildtools-firefox-addons-builder').default;
const fs = require('fs-extra');

const options = { ... }; // see description below
const logMethod = console.log;
const builder = new FirefoxAddonsBuilder(options, logMethod);

builder.setInputManifest(await fs.readJson('./ext_dir/package.json'));
builder.setInputZipBuffer(await fs.read('./packed.zip'));

builder.requireDeployedExt();
builder.requireSignedXpiFile();

const buildResult = await builder.build();
``` 

### Options
Options object described in [declarations/options.d.ts](declarations/options.d.ts)

[See](https://github.com/cardinalby/webext-buildtools-integrated-builder/blob/master/logMethod.md) how to get `logMethod` for pretty output.

#### Api access
To setup API access you need to generate and specify `jwtIssuer`, `jwtSecret` in `options.api`.
You can create them at [https://addons.mozilla.org/en-US/developers/addon/api/key/](https://addons.mozilla.org/en-US/developers/addon/api/key/)

### Inputs
1. **`setInputManifest(...)`**. Required. Object with parsed extension's `package.json`.
2. **`setInputZipBuffer(...)`**. Required. Buffer with zipped extension dir.

You can use [webext-buildtools-dir-reader-mw](https://www.npmjs.com/package/webext-buildtools-dir-reader-mw)
to generate needed inputs from extension directory.

### Outputs

#### Deployed extension
Require to deploy extension to Firefox Addons<br>

*Required options:* `deploy.extensionId`, `api` <br>
*Require methods:* `requireSignedXpiFile()` <br>
*Assets:* <br> 
`const xpiFilePath = buildResult.getAssets().signedXpiFile.getValue()` <br>
`const xpiBuffer = buildResult.getAssets().signedXpiBuffer.getValue()` <br>
`const extId = buildResult.getAssets().signedExtStoreId.getValue()`

#### Signed xpi file
Require to get signed xpi file. This output is independent from deployed extension.
`options.signXpi.extensionId` should contain id of extension uploaded to Firefox Addons 
especially for offline distribution. If not specified, new extension will be added 
for every build (not recommended)

*Required options:* `signXpi.extensionId` (recommended), `signXpi.xpiOutPath` 
(if not temporary file required), apiAccess` <br>

*Require methods:* `requirePublishedExt()` <br>
*Assets:* 
`const extId = buildResult.getAssets().deployedExtStoreId.getValue()` 