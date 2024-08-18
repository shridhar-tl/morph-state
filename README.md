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
5. [Advanced Usage](#advanced-usage)
    1. [Working with Nested Properties](#working-with-nested-properties)
    2. [Replacing the Entire State](#replacing-the-entire-state)
    3. [Resetting the State](#resetting-the-state)
    4. [Passing State to Child Components](#passing-state-to-child-components)
    5. [Using State as Change Handler](#using-state-as-change-handler)
    6. [Minimizing Re-renders](#minimizing-re-renders)
6. [React Standards Compliance](#react-standards-compliance)
7. [More Usage Examples](#more-usage-examples)
8. [Contributing](#contributing)
9. [Conclusion](#conclusion)

## Introduction

`morph-state` is a fine-grained mutable state management library for React built using TypeScript. It allows you to manage state at any nested property level efficiently, ensuring minimal re-renders. This library provides a hook called `useMutableState` to facilitate state management with easy mutation.

## Key Features

1. **Component-wise State**: Similar to `useState` in React, but allows deep property mutations.
2. **Mutable Nested Properties**: Directly mutate nested properties without triggering unnecessary re-renders.
3. **State Callbacks**: Execute a callback function on state changes, allowing you to control the mutation.
4. **Utility Methods**: Includes methods to reset the state, replace the state, and convert the state to a JSON object.
5. **React Standards Compliance**: Designed to work seamlessly with React without violating its principles.

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

To use the `useMutableState` hook, you can initialize it with an optional initial state and an optional change callback.

```typescript
import React from 'react';
import { useMutableState } from 'morph-state';

function App() {
    const state = useMutableState({ count: 0 }, (path, value, modifyValue, cancelChange) => {
        if (value < 0) {
            cancelChange();
        } else if (value > 10) {
            modifyValue(10); // Cap value to 10
        }
        console.log(`Changed ${path.join('.')} to ${value}`);
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

This approach allows state creation and usage outside of React components.

#### Example:

```typescript
import { createStore } from 'morph-state';

const initialState = {
    name: "Shridhar",
    age: 10,
    address: { stateCode: "TN", city: "Chennai" }
};

const callback = (path, value, modifyValue, cancelChange) => {
    console.log(`State change at ${path.join('.')} to ${value}`);
    if (path[0] === 'age' && value < 0) cancelChange(); // prevent negative age
};

const store = createStore(initialState, callback);

// Accessing state outside components
console.log(store.state.name); // Outputs: Shridhar
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

### Context Integration for Global State

This approach allows you to pass global state down the components tree without explicitly passing props.

#### Define Provider and Context Hooks:

Using the `MorphStateProvider` and `useMorphState` functions:

```typescript
import React from 'react';
import { MorphStateProvider, useMorphState } from 'morph-state';

const initialState = {
    name: "Shridhar",
    age: 10,
    address: { stateCode: "TN", city: "Chennai" }
};

const callback = (path, value, modifyValue, cancelChange) => {
    console.log(`State change at ${path.join('.')} to ${value}`);
};

function App() {
    return (
        <MorphStateProvider initialState={initialState} onChange={callback}>
            <RootComponent />
        </MorphStateProvider>
    );
}

function RootComponent() {
    const state = useMorphState();
    return (
        <div>
            <p>Global State Name: {state.name}</p>
            <ChildComponent />
        </div>
    );
}

function ChildComponent() {
    const age = useMorphState(state => state.age);
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
            <p>State Code: {stateCode}</p>
        </div>
    );
}
```

## Advanced Usage

### Working with Nested Properties

You can easily mutate nested properties:

```typescript
function App() {
    const state = useMutableState({
        user: {
            name: 'John',
            details: {
                age: 30,
                location: 'NY'
            }
        }
    });

    const changeUserName = state.user.name.useCallback();

    return (
        <div>
            <p>User Name: {state.user.name}</p>
            <button onClick={() => changeUserName('Doe')}>Change Name to Doe</button>
        </div>
    );
}
```

### Replacing the Entire State

Replace the entire state with a new object:

```typescript
function App() {
    const state = useMutableState({ count: 0 });

    return (
        <div>
            <p>Count: {state.count}</p>
            <button onClick={() => state.replace({ count: 100 })}>Set Count to 100</button>
        </div>
    );
}
```

### Resetting the State

Reset any changes made to the state:

```typescript
function App() {
    const state = useMutableState({ count: 0 });

    return (
        <div>
            <p>Count: {state.count}</p>
            <button onClick={() => state.count++}>Increment</button>
            <button onClick={() => state.reset()}>Reset</button>
        </div>
    );
}
```

### Passing State to Child Components

Passing state or a callback function from the state to child components:

```typescript
function Child({ onNameChange }) {
    return (
        <input type="text" placeholder="Enter name" onChange={(e) => onNameChange(e.target.value)} />
    );
}

function App() {
    const state = useMutableState({ user: { name: '', details: { age: 0 }} });

    return (
        <div>
            <Child onNameChange={state.user.name.useCallback()} />
            <p>User Name: {state.user.name}</p>
        </div>
    );
}
```

### Using State as Change Handler

Directly using a state property as a change handler for DOM elements:

```typescript
function App() {
    const state = useMutableState({ user: { name: 'John' } });

    return (
        <div>
            <input 
                type="text" 
                value={state.user.name} 
                onChange={state.user.name.changeHandler()} 
            />
            <p>User Name: {state.user.name}</p>
        </div>
    );
}
```

### Minimizing Re-renders

Each state mutation triggers targeted updates:
- Direct property assignments (`state.prop = value`) trigger updates only for affected properties.
- Nested updates do not cascade unnecessary re-renders, improving performance.
- Callback and change handler methods return memoized functions preventing unnecessary re-renders when passed as props.

Example to minimize re-renders:

```typescript
function RerenderCountDisplay(props) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        setCount(c => c + 1);
    }, [props]);

    return <div>Re-render Count: {count}</div>;
}

function App() {
    const state = useMutableState({
        user: {
            name: 'John'
        },
    });

    return (
        <div>
            <RerenderCountDisplay onChange={state.user.name.useCallback()} />
            <input value={state.user.name} onChange={state.user.name.changeHandler()} />
            <p>User Name: {state.user.name}</p>
        </div>
    );
}
```

## React Standards Compliance

This library is built to align with React’s principles:
- **Declarative Approach**: Mutations are declarative and controlled.
- **Efficient Updates**: Only the necessary components re-render on state changes, ensuring performance.
- **Hook Usage**: Leverages React hooks to manage state within functional components.

## More Usage Examples

### Directly Mutate Properties

```typescript
function DirectModification() {
    const state = useMutableState({ counter: 0 });
    state.counter++;
}
```

### Callback Usage

```typescript
const callback = (path, value, modifyValue, cancelChange) => {
    if (value < 0) {
        cancelChange();
    }
};

// Initialize state with callback
const state = useMutableState({ count: 0 }, callback);
```

## Contributing

Thank you for considering contributing to the Mutable State Management Library! Please fork the repository and submit a pull request with a detailed description of your changes. By contributing, you agree that your contributions will be licensed under the same license as the project, MIT License with Redistribution Restriction.

For major changes, please open an issue first to discuss what you would like to change.

## Conclusion

This mutable state management library is a powerful and comprehensive tool for managing both component-wise and global mutable state within React applications for efficiently managing complex state. It provides a straightforward API to handle deep mutations and ensures performance by minimizing unnecessary re-renders. It adheres to React standards and promotes best practices for maintaining a reactive and efficient application.

This approach is particularly beneficial in applications with highly nested states, reducing boilerplate code and enhancing code readability. By ensuring adjustable mutations with granular callbacks, it provides additional flexibility and control.