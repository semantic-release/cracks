# cracks

[![Greenkeeper badge](https://badges.greenkeeper.io/semantic-release/cracks.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/semantic-release/cracks.svg)](https://travis-ci.org/semantic-release/cracks)

> This module can automatically detect breaking changes by running the
test suite of your last-release against the current codebase. That shouldn't fail.

_Note:_ This is under the assumption you're testing the API of your module rather than implementation details. Of course this is hard sometimes and you might get false positives. Better safe than sorry :)

## Install

```bash
npm install --save-dev cracks
```

## Configuration

**paths**: An array of paths (files/directories) that will be checked out from the last release to restore your test suite. Note that you should add "package.json", because it will install old "devDependencies" as well. Default: `["tests", "package.json"]`

**silent**: Whether to output the results of `npm test`. It will always output the results when a breaking change was detected. Default: `true`

The test command is currently hard coded as `npm test`, but will be configurable in the future.

## Usage

### As a [`semantic-release`](https://github.com/semantic-release/semantic-release) plugin

Add a "verifyRelease" plugin to the "release" field in your "package.json".

```json
"release": {
  "verifyRelease": "cracks"
}
```

Passing options:

```json
"release": {
  "verifyRelease": {
    "path": "cracks",
    "paths": ["tests", "package.json"],
    "silent": true
  }
}
```

### CLI

```
Usage:
  cracks <options>
Options:
  -p, --paths  <paths>  Overwrite checkout paths
  -s, --silent          Suppress 'npm test' output
  -v, --version         Output the current version
  -h, --help            Output this help info
```

## Licence

The [MIT License (MIT)](http://opensource.org/licenses/MIT)

Copyright © 2015 [Christoph Witzko](https://twitter.com/christophwitzko)
