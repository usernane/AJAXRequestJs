# Changelog

## [3.0.1](https://github.com/usernane/AJAXRequestJs/compare/v3.0.0...v3.0.1) (2026-09-08)


### Bug Fixes

* **packaging:** align package name to npm package 'ajaxrequest-helper' ([6928fef](https://github.com/usernane/AJAXRequestJs/commit/6928fef21bfe3f567f6c58952e442df20fa4e292))

## [3.0.0](https://github.com/usernane/AJAXRequestJs/compare/v3.0.0-beta...v3.0.0) (2026-09-08)


### Bug Fixes

* **build:** Node/SSR import safety and bundle runtime verification ([#139](https://github.com/usernane/AJAXRequestJs/issues/139)) ([38254e9](https://github.com/usernane/AJAXRequestJs/commit/38254e9c67b3557090e03fc4b67cb1fe771832d5))
* correct 'wriable' to 'writable' typo in AJAXRequest.js line 28 ([#109](https://github.com/usernane/AJAXRequestJs/issues/109)) ([#122](https://github.com/usernane/AJAXRequestJs/issues/122)) ([ff39fd2](https://github.com/usernane/AJAXRequestJs/commit/ff39fd2048fe2f3ec4aaf427f99f071a8d224838)), closes [#78](https://github.com/usernane/AJAXRequestJs/issues/78)
* **dist:** rebuild bundles to drop stale 'wriable' typo ([1982583](https://github.com/usernane/AJAXRequestJs/commit/19825837a32bc0dd0c56ebca6c0ffd22e987498e)), closes [#124](https://github.com/usernane/AJAXRequestJs/issues/124)
* v3.0.0 bug fixes, security hardening, and meta reconciliation ([#138](https://github.com/usernane/AJAXRequestJs/issues/138)) ([2c76964](https://github.com/usernane/AJAXRequestJs/commit/2c76964e69ca653ebe822db0cda853c430d8e805))


### Miscellaneous Chores

* Release ([d2d3e08](https://github.com/usernane/AJAXRequestJs/commit/d2d3e0834a4556918b43585cfb7a57915d73dd07))

## [3.0.0-beta](https://github.com/usernane/AJAXRequestJs/compare/v3.0.0-alpha...v3.0.0-beta) (2026-09-02)


### Features

* **core:** send() returns Promise ([#95](https://github.com/usernane/AJAXRequestJs/issues/95)) ([6dda0bc](https://github.com/usernane/AJAXRequestJs/commit/6dda0bc0af92aae217489173411438ac7e83e7d3))
* request timeout and cancellation (v3.0.0-beta) ([#118](https://github.com/usernane/AJAXRequestJs/issues/118)) ([fab3acf](https://github.com/usernane/AJAXRequestJs/commit/fab3acfcaa86f71482b0688f316f87fd151c4d60))
* **retry:** add backoff strategies — linear, exponential, jitter ([#113](https://github.com/usernane/AJAXRequestJs/issues/113)) ([a940a0a](https://github.com/usernane/AJAXRequestJs/commit/a940a0a21e7066967b6b0a5c4ce765e12455b0a7))
* **retry:** add onRetry and onRetryEnd callback pools ([#112](https://github.com/usernane/AJAXRequestJs/issues/112), [#114](https://github.com/usernane/AJAXRequestJs/issues/114)) ([9ef2f15](https://github.com/usernane/AJAXRequestJs/commit/9ef2f15335df604767bf527226dbeeaafe0486d6))
* **types:** add base AJAXRequest type definitions ([#100](https://github.com/usernane/AJAXRequestJs/issues/100)) ([#116](https://github.com/usernane/AJAXRequestJs/issues/116)) ([78d6d53](https://github.com/usernane/AJAXRequestJs/commit/78d6d5352c882e42dd1d43d071b8053b9c87b702))

## [3.0.0-alpha](https://github.com/usernane/AJAXRequestJs/compare/v2.1.9...v3.0.0-alpha) (2026-08-24)


### Bug Fixes

* correct typos in META properties and error pool ([cae63b3](https://github.com/usernane/AJAXRequestJs/commit/cae63b3f3a3d23e1671c8637238667601e004d17))
* correct typos in META properties and error pool ([76bf37f](https://github.com/usernane/AJAXRequestJs/commit/76bf37faffa26df5984969412214f38f752e7386))


### Miscellaneous Chores

* Merge pull request [#110](https://github.com/usernane/AJAXRequestJs/issues/110) from usernane/dev ([4fc8538](https://github.com/usernane/AJAXRequestJs/commit/4fc853862b1d4e214de383c6a450c45f878a44d7))
