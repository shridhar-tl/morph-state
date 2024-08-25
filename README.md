[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# morph-state Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Installation](#installation)
4. [Usage](#usage)
    1. [Component-wise State Management](#component-wise-state-management)
    2. [Global State Outside Components](#global-state-outside-components)
    3. [Context Integration for Global State](#context-integration-for-global-state)
5. [API Reference](#api-reference)
    1. [Interceptor Config Properties](#interceptor-config-properties)
    2. [Helper Methods](#helper-methods)
6. [Advanced Usage](#advanced-usage)
    1. [Working with Nested Properties](#working-with-nested-properties)
    2. [Replacing the Entire State](#replacing-the-entire-state)
    3. [Resetting the State](#resetting-the-state)
    4. [Passing State to Child Components](#passing-state-to-child-components)
    5. [Using State as Change Handler](#using-state-as-change-handler)
    6. [Minimizing Re-renders](#minimizing-re-renders)
7. [React Standards Compliance and Justification for Mutations](#react-standards-compliance-and-justification-for-mutations)
    1. [Why Mutations?](#why-mutations)
    2. [Ensuring React Principles](#ensuring-react-principles)
8. [More Usage Examples](#more-usage-examples)
9. [Contributing](#contributing)
10. [Conclusion](#conclusion)
11. [View Examples](./examples)

## Introduction

`morph-state` is a comprehensive mutable state management library for React built using TypeScript. It offers three distinct ways to manage state efficiently: component-wise, global state outside of components, and context-based global state. By leveraging proxy objects, it allows for fine-grained mutations at any nested property level while ensuring optimal performance.

## Key Features

1. **Component-wise State Management**:
   - Like React's `useState` but allows deeper property mutations.
   - Prevents unnecessary re-renders.
   - Includes callback mechanisms for controlled state changes.

2. **Global State Outside Components**:
   - Manage state outside React components.
   - Share state across different applications on the same page (e.g., JQuery and React).

3. **Context-based Global State**:
   - Manage global state using React Context API.
   - Provides `<MorphStateProvider>` and `useMorphState` hooks.

## Installation

You can install `morph-state` using your preferred package manager:

### Using NPM

```sh
npm install morph-state
```

### Using Yarn

```sh
yarn add morph-state
```

### Using PNPM

```sh
pnpm add morph-state
```

## Usage

### Component-wise State Management

#### Basic Usage

Initialize with an optional initial state and an optional change callback:

```typescript
import React from 'react';
import { useMutableState } from 'morph-state';

function App() {
    const state = useMutableState({ count: 0 }, (value, { field, update, cancel }) => {
        if (value < 0) cancel();
        else if (value > 10) update(10);
        console.log(`Changed ${field} to ${value}`);
    });

    return (
        <div>
            <p>Count: {state.count}</p>
            <button onClick={() => state.count++}>Increment</button>
            <button onClick={() => state.count--}>Decrement</button>
        </div>
    );
}
```

### Global State Outside Components

Create and use state outside React components:

```typescript
import { createStore, valueOf } from 'morph-state';

const initialState = {
    name: "Shridhar",
    age: 10,
    address: { stateCode: "TN", city: "Chennai" }
};

const callback = (value, { field, update, cancel }) => {
    console.log(`State change at ${field} to ${value}`);
    if (field === 'age' && value < 0) cancel();
};

const store = createStore(initialState, {
    interceptUndefined: true,
    interceptNull: true,
    interceptValues: true,
    onChange: callback
});

// Accessing state outside components
console.log(valueOf(store.state.name)); // Outputs: Shridhar
```

#### Using Hooks Inside Components:

```typescript
import React from 'react';
import { createStore, createHook } from 'morph-state';

const store = createStore({ count: 0 });
const useCount = createHook(store);

function Counter() {
    const state = useCount();
    return (
        <div>
            <p>Count: {state.count}</p>
            <button onClick={() => state.count++}>Increment</button>
        </div>
    );
}
```

#### Create Slice Hook Example:

```typescript
const useAddress = createHook(store, (state) => state.address);

function AddressInfo() {
    const address = useAddress();
    return (
        <div>
            <p>City: {address.city}</p>
            <p>State: {address.stateCode}</p>
        </div>
    );
}
```

#### State Sync from Outside:

```typescript
import React, { useEffect } from 'react';
import { createStore, createHook, valueOf } from 'morph-state';

// Create the store outside any React component
const store = createStore({ appState: { sharedValue: 0 } }, {
    interceptUndefined: true,
    interceptNull: true,
    interceptValues: true,
    interceptObjects: true
});

// External function to modify store value
function modifyStoreValue(newValue) {
    store.state.appState.sharedValue = newValue;
}

// Example set interval which changes the value every 2 seconds
const interval = setInterval(() => {
    modifyStoreValue(Math.floor(Math.random() * 100));
}, 2000);

// clearInterval(interval); // Clear it when not needed

const useAppState = createHook(store, (state) => state.appState);

function SharedValueComponent() {
    // The `appState` would be a proxy object as `interceptObjects` config is set to `true`
    // The `appState.sharedValue` would also be a proxy object as `interceptValues` config is set to `true`
    // You cannot directly use this proxy object and hence you need `valueOf` helper function to get the actual value
    // As `appState` is a proxy object, you can assign/mutate any property values and it would be available throughout your page
    const appState = useSharedValue();

    return (
        <div>
            <p>Shared Value: {valueOf(appState.sharedValue)}</p>
            <button onClick={() => appState.sharedValue = valueOf(sharedValue) + 200}>Increment Shared Value by 200</button>
        </div>
    );
}

export default SharedValueComponent;
```

### Context Integration for Global State

Pass global state down the component tree without passing props.

#### Define Provider and Context Hooks:

Using the `MorphStateProvider` and `useMorphState` functions:

```typescript
import React from 'react';
import { MorphStateProvider, useMorphState, valueOf } from 'morph-state';

const initialState = {
    name: "Shridhar",
    age: 10,
    address: { stateCode: "TN", city: "Chennai" }
};

const callback = (value, { field, update, cancel }) => {
    console.log(`State change at ${field} to ${value}`);
};

function App() {
    return (
        <MorphStateProvider initialState={initialState} config={{ interceptUndefined: true, interceptNull: true, interceptValues: true }} onChange={callback}>
            <RootComponent />
        </MorphStateProvider>
    );
}

function RootComponent() {
    // As `interceptValues` is set to true, name property would be a proxy object even though it is a string
    // You need to use helper methods like `valueOf` to use actual value of the property
    const state = useMorphState();
    return (
        <div>
            <p>Global State Name: {valueOf(state.name)}</p>
            <ChildComponent />
        </div>
    );
}

function ChildComponent() {
    // Though `interceptValues` is set to true at provider level, as it is set to `false` at hook, age property would be a raw numeric value instead of ruturning a proxy.
    // You need not to use helper methods for such use case.
    const age = useMorphState(state => state.age, { interceptValues: false });
    return (
        <div>
            <p>Global State Age: {age}</p>
        </div>
    );
}
```

#### Accessing Nested Properties:

```typescript
function NestedComponent() {
    const stateCode = useMorphState(state => state.address.stateCode);
    return (
        <div>
            <p>State Code: {valueOf(stateCode)}</p>
        </div>
    );
}
```

## API Reference

### Interceptor Config Properties

The `morph-state` library utilizes config properties to determine whether to return raw data or a Proxy object:

| Property              | Type    | Default | Description                                                         |
|-----------------------|---------|---------|---------------------------------------------------------------------|
| interceptUndefined    | boolean | false   | Return proxy when a property is `undefined`                         |
| interceptNull         | boolean | false   | Return proxy when a property is `null`                              |
| interceptValues       | boolean | false   | Return proxy for non-object values (e.g., strings, booleans, etc.)  |
| interceptArrays       | boolean | true    | Return proxy for arrays                                             |
| interceptSpecialObjects | boolean | true    | Return proxy for special objects like `Map` or `Set`                |
| interceptObjects      | boolean | true    | Return proxy for usual objects                                      |

### Helper Methods

To simplify usage, helper methods can be called by passing the property retrieved from the state object. These methods only function correctly with Proxy objects:

| Method                          | Description                               |
|---------------------------------|-------------------------------------------|
| `withChangeHandler(state)`      | Returns a callback method to set the value of the property being passed. This is equivalent to mutating that specific value directly. |
| `withEventHandler(state, beforeSet?)` | Returns a callback method to pass directly to DOM element's `onChange` prop |
| `valueOf(state)`                | Returns the raw value of the property being passed |
| `isNull(state)`                 | Checks if the property's raw value is `null`       |
| `isUndefined(state)`            | Checks if the property's raw value is `undefined`  |
| `isNullOrUndefined(state)`      | Checks if the property's raw value is `null` or `undefined` |
| `isTruthy(state)`               | Checks if the property's raw value is truthy       |

### Component-wise State Management

#### useMutableState

This hook manages mutable state within the component level.

*Parameters:*
   - `initialState` (optional): The initial state object.
   - `configOrCallback` (optional): This can be a callback function triggered before a value update, a config object regulating Proxies, `true` (all proxy behavior), or `false` (no proxy behavior).

```typescript
const state = useMutableState({ count: 0 }, {
    interceptUndefined: true,
    interceptNull: true,
    onChange: (value, { field, update, cancel }) => {
        if (value < 0) cancel();
        else if (value > 10) update(10);
    }
});
```

### Global State

Shared state across different applications within the same page.

#### createStore

Creates a store with the specified initial state and configuration.

*Parameters:*
   - `initialState` (optional): The initial state object.
   - `configOrCallback` (optional): Similar options to `useMutableState`.

```typescript
const store = createStore({ count: 0 }, {
    interceptUndefined: true,
    interceptNull: true,
    onChange: (value, { field, update, cancel }) => {
        if(value < 0) cancel();
    }
});
```

### Context-based Global State

Manage state within nested React components using Context API.

#### &lt;MorphStateProvider initialState={state} config={config} onChange={callback} /&gt;

Provides global state using a React Context Provider.

#### useMorphState(selector?, config?)

Access stored state within components. Optional selector and config for specific properties or behaviors.

## Advanced Usage

### Using event handlers

```typescript
import { useMutableState, withChangeHandler, valueOf } from 'morph-state';

function App() {
    const state = useMutableState({
        user: {
            name: 'John',
            details: {
                age: 30,
                location: 'NY'
            }
        }
    }, {
        interceptUndefined: true,
        interceptNull: true,
        interceptValues: true
    });

    return (
        <div>
            <p>User Name: {valueOf(state.user.name)}</p>
            {/* Start typing the text in following input field and the name would be updated automatically. */}
            {/* `withEventHandler` does the trick for you */}
            <input value={{valueOf(state.user.name)}} onChange={withEventHandler(state.user.name)} />
            <button onClick={() => state.user.name = 'Doe'}>Change Name to Doe</button>
        </div>
    );
}
```

### Replacing the Entire State

Replace the entire state with a new object:

```typescript
import { useMutableState, valueOf, withChangeHandler } from 'morph-state';

function App() {
    const state = useMutableState({ count: 0 }, {
        interceptUndefined: true,
        interceptNull: true,
        interceptValues: true
    });

    return (
        <div>
            <p>Count: {valueOf(state.count)}</p>
            <button onClick={() => state.replace({ count: 100 })}>Set Count to 100</button>
        </div>
    );
}
```

### Resetting the State

```typescript
import { useMutableState, valueOf, withChangeHandler } from 'morph-state';

function App() {
    const state = useMutableState({ count: 0 }, {
        interceptUndefined: true,
        interceptNull: true,
        interceptValues: true
    });

    return (
        <div>
            <p>Count: {valueOf(state.count)}</p>
            <button onClick={() => state.count++}>Increment</button>
            <button onClick={() => state.reset()}>Reset</button>
        </div>
    );
}
```

### Passing State to Child Components

```typescript
import { useMutableState, valueOf, withEventHandler } from 'morph-state';

function Child({ onNameChange }) {
    return (
        <input type="text" placeholder="Enter name" onChange={onNameChange} />
    );
}

function App() {
    const state = useMutableState({ user: { name: '', details: { age: 0 }} }, {
        interceptUndefined: true,
        interceptNull: true,
        interceptValues: true
    });

    return (
        <div>
            <Child onNameChange={withEventHandler(state.user.name)} />
            <p>User Name: {valueOf(state.user.name)}</p>
        </div>
    );
}
```

### Using State as Change Handler

```typescript
import { useMutableState, withEventHandler, valueOf } from 'morph-state';

function App() {
    const state = useMutableState({ user: { name: 'John' } }, {
        interceptUndefined: true,
        interceptNull: true,
        interceptValues: true
    });

    return (
        <div>
            <input 
                type="text" 
                value={valueOf(state.user.name)} 
                onChange={withEventHandler(state.user.name)} 
            />
            <p>User Name: {valueOf(state.user.name)}</p>
        </div>
    );
}
```

### Minimizing Re-renders

```typescript
import React, { useState, useEffect } from 'react';
import { useMutableState, withEventHandler, valueOf } from 'morph-state';

function RerenderCountDisplay({ onChange }) {
    const [count, setCount] = useState(0);

    // This will not be triggered multiple times as `withEventHandler` returns memoized function to avoid unnecessary rerenders
    useEffect(() => { 
        setCount(c => c + 1);
    }, [onChange]);

    return <div>Re-render Count: {count}</div>;
}

function App() {
    const state = useMutableState({
        user: {
            name: 'John'
        },
    }, {
        interceptUndefined: true,
        interceptNull: true,
        interceptValues: true
    });

    return (
        <div>
            <RerenderCountDisplay onChange={withEventHandler(state.user.name)} />
            <input value={valueOf(state.user.name)} onChange={withEventHandler(state.user.name)} />
            <p>User Name: {valueOf(state.user.name)}</p>
        </div>
    );
}
```

## React Standards Compliance and Justification for Mutations

### Why Mutations?

Contrary to popular belief about immutability, `morph-state` leverages controlled mutations to provide a convenient, intuitive API while ensuring performance optimization and maintaining React principles.

### Ensuring React Principles

1. **Controlled Mutations**: Ensure React re-renders components only when necessary.
2. **Efficient Updates**: Proxy mechanism to communicate state changes efficiently.
3. **Component Isolation**: Subscriptions only to necessary state properties.
4. **Declarative State Management**: Ensure the interface remains declarative.
5. **Memoization**: Prevent unnecessary re-renders.

## More Usage Examples

### Directly Mutate Properties

```typescript
import { useMutableState, valueOf, withChangeHandler } from 'morph-state';

function DirectModification() {
    const state = useMutableState({ counter: 0 }, {
        interceptUndefined: true,
        interceptNull: true,
        interceptValues: false
    });
    state.counter++; // You can use ++ only when `interceptValues` is set to false (which is default)
    console.log(state.counter); // Outputs updated counter value
}
```

### Callback Usage

```typescript
import { useMutableState } from 'morph-state';

const callback = (value, { field, update, cancel }) => {
    if (value < 0) {
        cancel();
    }
};

const state = useMutableState({ count: 0 }, {
    interceptUndefined: true,
    interceptNull: true,
    interceptValues: true,
    onChange: callback
});

// or you can directly pass callback as second prop if you do not have any changes in default config
const state = useMutableState({ count: 0 }, callback);
```

## Powerful Use Cases

### Interaction Between Different Technologies

When building applications that combine different technologies on the same page, having a mutable state management library like `morph-state` can be incredibly powerful. This allows for seamless state sharing and interaction across various frameworks and libraries.

#### Example: jQuery and React Interaction

```html
<div id="jquery-component">
    <input type="text" id="shared-input" />
</div>
<div id="react-component"></div>
```

```javascript
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import { createStore, createHook, valueOf } from 'morph-state';

// Create store outside React component
const store = createStore({ sharedValue: '' }, {
    interceptUndefined: true,
    interceptNull: true,
    interceptValues: true
});

$('#shared-input').on('change', function () {
    store.state.sharedValue = $(this).val();
});

const useSharedValue = createHook(store, state => state.sharedValue);

function SharedComponent() {
    const sharedValue = useSharedValue();

    return (
        <div>
            <h1>Shared Value in React: {valueOf(sharedValue)}</h1>
        </div>
    );
}

ReactDOM.render(<SharedComponent />, document.getElementById('react-component'));
```

In this example, the `morph-state` store allows both React and jQuery to interact with the same state seamlessly. The input field in the jQuery component updates the state, which then reflects in the React component.

## Contributing

Thank you for considering contributing to `morph-state`! Please fork the repository and submit a pull request with a detailed description of your changes. By contributing, you agree that your contributions will be licensed under the same license as the project, MIT License.

For major changes, please open an issue first to discuss what you would like to change.

## Conclusion

`morph-state` provides a powerful and flexible state management solution for React applications. By leveraging mutable operations while ensuring compliance with React principles, it offers an optimized, intuitive state management approach.