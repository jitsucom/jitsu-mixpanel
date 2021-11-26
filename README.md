# mixpanel-destination

Implementation of Mixpanel destination for [Jitsu](https://jitsu.com)
based on new Jitsu Javascript Destinations.

# Implementation

Jitsu offers standard interfaces for developing new destinations with Javascript or Typescript.

Interfaces may be found here: https://github.com/jitsucom/js-mono-proto/tree/main/packages/jitsu-types

Implementation example: https://github.com/jitsucom/js-mono-proto/tree/main/packages/test-destination

# Setting up

Install all dependencies for a project
```shell
yarn install
```

Build destination
```shell
yarn build
```

Run tests
```shell
yarn test
```

If everything is ok - resulted destination file location
```shell
./dist/mixpanel-destination.js
```