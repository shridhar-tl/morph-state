import React from 'react';
import { MorphStateProvider, useMorphState } from '../Context';
import { createStore, createHook } from '../store';
import { useMutableState } from '../useMutableState';
import { ExampleProps } from './types';
import { valueOf } from '../lib/utils';

export const examples: ExampleProps[] = [
    {
        name: 'Simple useMutableState',
        code: `
import React from "react";
import { useMutableState } from "morph-state";

const ComponentExample = () => {
    const state = useMutableState({ name: "John", age: 25 });

    return (
        <div>
            <h3>Component State Example</h3>
            <input
                type="text"
                value={valueOf(state.name)}
                onChange={e => state.name = e.target.value}
            />
            <p>{valueOf(state.name)}</p>
            <p>{valueOf(state.age)}</p>
        </div>
    );
};

export default ComponentExample;
        `,
        component: () => {
            const state = useMutableState({ name: "John", age: 25 });
            return (
                <div>
                    <h3>Component State Example</h3>
                    <input
                        type="text"
                        value={valueOf(state.name)}
                        onChange={e => state.name = e.target.value}
                    />
                    <p>{valueOf(state.name)}</p>
                    <p>{valueOf(state.age)}</p>
                </div>
            );
        }
    },
    {
        name: 'Simple createStore',
        code: `
import React from "react";
import { createStore, createHook } from "morph-state";

const store = createStore({ name: "Jane", age: 30 });
const useGlobalState = createHook(store);

const GlobalStoreExample = () => {
    const state = useGlobalState();
    const age = useGlobalState(s => s.age, true);

    return (
        <div>
            <h3>Global Store Example</h3>
            <input
                type="text"
                value={valueOf(state.name)}
                onChange={e => state.name = e.target.value}
            />
            <p>Name: {valueOf(state.name)}</p>
            <p>Age: {age}</p>
        </div>
    );
};

export default GlobalStoreExample;
        `,
        component: () => {
            const store = React.useMemo(() => createStore({ name: "Jane", age: 30 }), []);
            const useGlobalState = React.useMemo(() => createHook(store), [store]);
            const state = useGlobalState();
            const age = useGlobalState(s => s.age, true);

            return (
                <div>
                    <h3>Global Store Example</h3>
                    <input
                        type="text"
                        value={valueOf(state.name)}
                        onChange={e => state.name = e.target.value}
                    />
                    <p>Name: {valueOf(state.name)}</p>
                    <p>Age: {age}</p>
                </div>
            );
        }
    },
    {
        name: 'Simple MorphStateProvider',
        code: `
import React from "react";
import { MorphStateProvider, useMorphState } from "morph-state";

const initialState = {
    name: "Doe",
    age: 20
};

const ContextExample = () => {
    const state = useMorphState();

    return (
        <div>
            <h3>Context Example</h3>
            <input
                type="text"
                value={valueOf(state.name)}
                onChange={e => state.name = e.target.value}
            />
            <p>{valueOf(state.name)}</p>
            <p>{valueOf(state.age)}</p>
        </div>
    );
};

const App = () => (
    <MorphStateProvider initialState={initialState}>
        <ContextExample />
    </MorphStateProvider>
);

export default App;
        `,
        component: () => {
            const initialState = { name: "Doe", age: 20 };

            const ContextExample = () => {
                const state = useMorphState();
                const age = useMorphState(s => s.age, true);

                return (
                    <div>
                        <h3>Context Example</h3>
                        <input
                            type="text"
                            value={valueOf(state.name)}
                            onChange={e => state.name = e.target.value}
                        />
                        <p>{valueOf(state.name)}</p>
                        <p>{age}</p>
                    </div>
                );
            };

            return (
                <MorphStateProvider initialState={initialState}>
                    <ContextExample />
                </MorphStateProvider>
            );
        }
    }
];