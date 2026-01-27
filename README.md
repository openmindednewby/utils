# @dloizides/utils

> Type-safe utility functions for TypeScript projects

[![npm version](https://badge.fury.io/js/@baseclient%2Futils.svg)](https://www.npmjs.com/package/@dloizides/utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @dloizides/utils
# or
yarn add @dloizides/utils
# or
pnpm add @dloizides/utils
```

## Features

- **Type Guards**: `isValueDefined`, `isNotEmptyArray`, `isNotEmptyString`, `isNullOrUndefined`, `isEmptyArray`, `isEmptyString`
- **Assertions**: `assertDefined`
- **Zero Dependencies**: No runtime dependencies
- **Tree-shakeable**: Only import what you need
- **TypeScript First**: Full type inference and narrowing

## Usage

### Type Guards

```typescript
import { isValueDefined, isNotEmptyArray, isNotEmptyString } from '@dloizides/utils';

// isValueDefined - Check if value is not null or undefined
const user = getUserOrNull();
if (isValueDefined(user)) {
  console.log(user.name); // TypeScript knows user is defined
}

// isNotEmptyArray - Check if array has elements
const items = getItems();
if (isNotEmptyArray(items)) {
  console.log(items[0]); // Safe to access first element
}

// isNotEmptyString - Check if string has content
const input = formData.get('name');
if (isNotEmptyString(input)) {
  saveUser(input); // String is guaranteed to have content
}
```

### Assertions

```typescript
import { assertDefined } from '@dloizides/utils';

function processUser(user: User | null) {
  assertDefined(user, 'User is required');
  // user is now narrowed to User
  return user.name.toUpperCase();
}
```

### Subpath Imports

```typescript
// Import only guards
import { isValueDefined } from '@dloizides/utils/guards';

// Import only assertions
import { assertDefined } from '@dloizides/utils/assertions';
```

## API Reference

### Type Guards

| Function | Description |
|----------|-------------|
| `isValueDefined<T>(value)` | Returns `true` if value is not `null` or `undefined` |
| `isNotEmptyArray<T>(value)` | Returns `true` if value is an array with length > 0 |
| `isNotEmptyString(value)` | Returns `true` if value is a non-empty string (after trim) |
| `isNullOrUndefined(value)` | Returns `true` if value is `null` or `undefined` |
| `isEmptyArray(value)` | Returns `true` if value is an empty array |
| `isEmptyString(value)` | Returns `true` if value is empty or whitespace only |

### Assertions

| Function | Description |
|----------|-------------|
| `assertDefined<T>(value, message?)` | Throws if value is `null` or `undefined` |

## License

MIT
