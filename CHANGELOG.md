# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-27

### Added

- Initial release
- Type guards:
  - `isValueDefined` - Check if value is not null or undefined
  - `isNotEmptyArray` - Check if value is a non-empty array
  - `isNotEmptyString` - Check if value is a non-empty string (after trim)
  - `isNullOrUndefined` - Check if value is null or undefined
  - `isEmptyArray` - Check if value is an empty array
  - `isEmptyString` - Check if value is empty or whitespace only
- Assertions:
  - `assertDefined` - Assert that value is defined (throws if null/undefined)
- Full TypeScript support with type narrowing
- ESM and CommonJS module support
- 100% test coverage
