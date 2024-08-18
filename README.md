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
6. [React Standards Compliance and Justification for Mutations](#react-standards-compliance-and-justification-for-mutations)
    1. [Why Mutations?](#why-mutations)
    2. [Ensuring React Principles](#ensuring-react-principles)
7. [More Usage Examples](#more-usage-examples)
8. [Contributing](#contributing)
9. [Conclusion](#conclusion)

## Introduction

`morph-state` is a comprehensive mutable state management library for React built using TypeScript. It offers three distinct ways to manage state efficiently: component-wise, global state outside of components, and context-based global state. By leveraging proxy objects, it allows for fine-grained mutations at any nested property level while ensuring optimal performance.

## Key Features

1. **Component-wise State Management**:
   - Similar to React’s `useState` but allows for deeper property mutations.
   - Optimized to prevent unnecessary re-renders.
   - Features callback mechanisms for controlled state changes.
2. **Global State Outside Components**:
   - Initializing and modifying state outside of React components.
   - Provides hooks to access and mutate state within components efficiently.
3. **Context-based Global State**:
   - Global state management using React Context API.
   - Provides `<MorphStateProvider>` and `useMorphState` hooks for accessing and modifying state deeply nested within the component tree.

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

### Why Mutations?

In most programming paradigms, immutability is considered a best practice to ensure predictable and maintainable code. However, JavaScript's lack of intrinsic immutability at the language level often necessitates extensive copy operations, especially within deeply nested structures. This can lead to boilerplate code, reduced readability.

`morph-state` uses mutations to provide a convenient, intuitive, and more natural API for state management. This approach avoids the overhead of deep cloning objects and reduces the complexity of managing deeply nested properties while still adhering to predictable state updates.

### Ensuring React Principles

Despite using mutations internally, `morph-state` is designed to comply with React principles. Here's how it achieves this:

1. **Controlled Mutations**: State mutations trigger controlled updates via proxies, ensuring that React only re-renders components when necessary. This fine-grained control helps optimize performance and adheres to React’s rendering lifecycle.
  
2. **Efficient Updates**: The proxy mechanism efficiently communicates state changes while preventing unnecessary deep copies. This approach leverages JavaScript's strengths and allows seamless integration with React's reactivity model.

3. **Component Isolation**: Each component subscribes only to the specific state properties it needs. This isolation minimizes the impact of state changes, reducing the scope of re-renders and promoting efficient rendering.

4. **Declarative State Management**: Even though mutations are used behind the scenes, the state management interface remains declarative. This ensures that the component logic remains clear, predictable, and easy to reason about.

5. **Memoization**: By memoizing handlers and callbacks, `morph-state` ensures that changes propagate efficiently through props, avoiding unnecessary re-renders and maintaining React's performance integrity.

In conclusion, while `morph-state` uses mutations to manage state, it ensures that these mutations are controlled, efficient, and aligned with React's principles. This provides the best of both worlds: the convenience and performance of mutable operations with the predictable and declarative nature of React.

This approach is particularly beneficial in applications with highly nested states, reducing boilerplate code and enhancing code readability. By ensuring adjustable mutations with granular callbacks, it provides additional flexibility and control.For major changes, please open an issue first to discuss what you would like to change

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
