[![npm-publish](https://github.com/cardinalby/webext-buildtools-firefox-addons-builder/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/cardinalby/webext-buildtools-firefox-addons-builder/actions/workflows/npm-publish.yml)

## Introduction
*webext-buildtools* builder which allows you to deploy extension (packed to zip) 
to Firefox Addons, and sign xpi file (for offline distribution).

## Installation
`npm install webext-buildtools-firefox-addons-builder`

## Purpose

Builder uses Firefox Addons API to deploy your extension and/or get signed crx 
file for offline distribution 
(read ["Signing and distributing your add-on"](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/Distribution) for details).

Builder doesn't allow to publish new extension, only update existing (`deploy.extensionId` in options) 
with new version.  

## Usage example
```js
const FirefoxAddonsBuilder = require('webext-buildtools-firefox-addons-builder').default;
const fs = require('fs-extra');

const options = { ... }; // see description below
const logMethod = console.log;
const builder = new FirefoxAddonsBuilder(options, logMethod);

// Optional, can be extracted from zip
builder.setInputManifest(await fs.readJson('./ext_dir/package.json'));

builder.setInputZipBuffer(await fs.read('./packed.zip'));

builder.requireDeployedExt();
builder.requireSignedXpiFile();

const buildResult = await builder.build();
``` 

## Options
Options object described in [declarations/options.d.ts](./declarations/options.d.ts)

[See](https://github.com/cardinalby/webext-buildtools-integrated-builder/blob/master/logMethod.md) how to get `logMethod` for pretty output.

## Api access
To set up API access you need to generate and specify `jwtIssuer`, `jwtSecret` in `options.api`.
You can create them at [https://addons.mozilla.org/en-US/developers/addon/api/key/](https://addons.mozilla.org/en-US/developers/addon/api/key/)

## Inputs

### 🔸 _extension archive_; **Required**
Can be set using one of the following inputs:

#### 1. `setInputZipBuffer(buffer: Buffer)`
Buffer with zipped extension dir.

#### 2. `setInputZipFilePath(filePath: string)`
Buffer with zipped extension dir.

### 🔹 `setInputManifest(...)`
Object with parsed extension's `package.json`. Will be extracted from zip if not specified.

### 🔹 _sources archive_
It's needed for admins for a review if your zipped extension contains minified code.
Can be set using one of the following inputs:

#### 1. `setInputSourcesZipBuffer(buffer: Buffer)` 
Buffer with zipped dir containing source code of the extension. 

#### 2. `setInputSourcesZipFilePath(filePath: string)`
Path to zip containing source code of the extension.

You can use [webext-buildtools-dir-reader-mw](https://www.npmjs.com/package/webext-buildtools-dir-reader-mw)
to generate needed inputs from extension directory.

## Outputs

### Deployed extension
Require to deploy extension to Firefox Addons<br>

*Required options:* `deploy.extensionId`, `api` <br>
*Require methods:* `requireSignedXpiFile()` <br>
*Assets:* <br> 
`const xpiFilePath = buildResult.getAssets().signedXpiFile.getValue()` <br>
`const xpiBuffer = buildResult.getAssets().signedXpiBuffer.getValue()` <br>
`const extId = buildResult.getAssets().signedExtStoreId.getValue()`

### Signed xpi file
Require to get signed xpi file. This output is independent of deployed extension.
`options.signXpi.extensionId` should contain id of extension uploaded to Firefox Addons 
especially for offline distribution. If not specified, new extension will be added 
for every build (not recommended)

*Required options:* `signXpi.extensionId` (recommended), `signXpi.xpiOutPath` 
(if not temporary file required), `apiAccess` <br>

*Require methods:* `requirePublishedExt()` <br>
*Assets:* 
`const extId = buildResult.getAssets().deployedExtStoreId.getValue()` 

## Errors

Package exports the following error classes, which can be thrown:

* `VersionAlreadyExistsError` if you try to upload already existing version
* `UnauthorizedError`: For "Deployed extension" output.
  `jwtIssuer`, `jwtSecret` Options are invalid.
* `ValidationError` For "Deployed extension" output. Firefox Addons validation rejected your extension
* `PollTimedOutError` For "Deployed extension" output. Polling uploaded item status was timed out.
Your extension will be probably published later.

## References

If you are interested in building CI/CD solution for Web Extension using GitHub Actions it's better
to use the dedicated actions for it instead.

Please read the ["Releasing WebExtension using GitHub Actions"](https://cardinalby.github.io/blog/post/github-actions/webext/1-introduction/) article to learn the details.

If you need to deploy to other targets, take a look at
[webext-buildtools-integrated-builder](https://github.com/cardinalby/webext-buildtools-integrated-builder) repo.

To read what are *webext-buildtools* and *builders* go to
[webext-buildtools-builder-types](https://github.com/cardinalby/webext-buildtools-builder-types) repo.

[sign-addon](https://www.npmjs.com/package/sign-addon) package is used for signing under the hood.

