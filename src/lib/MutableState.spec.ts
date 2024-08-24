import { createMutableState } from '../MutableState';

describe('createMutableState', () => {
    let changeHandlerSpy: jest.Mock;
    let initialState: any;
    let mutableState: any;

    beforeEach(() => {
        changeHandlerSpy = jest.fn();
        initialState = {
            name: 'John',
            age: 30,
            address: {
                street: '123 Main St',
                city: 'New York'
            },
            hobbies: ['reading', 'travelling'],
            isActive: true,
            score: null,
            birthDate: new Date('1990-01-01'),
            metadata: new Map(),
            uniqueTags: new Set(['tag1', 'tag2']),
        };
        mutableState = createMutableState(initialState, changeHandlerSpy);
    });

    describe('Initialization Tests', () => {
        it('should initialize with an empty state if no initial state is provided', () => {
            const emptyState = createMutableState();
            expect(emptyState.toJSON()).toEqual({});
        });

        it('should initialize with the provided initial state', () => {
            expect(mutableState.toJSON()).toEqual(initialState);
        });

        it('should call the changeHandler when state changes', () => {
            mutableState.name = 'Jane';
            expect(changeHandlerSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Basic Functional Tests', () => {
        it('should return the current state with toJSON method', () => {
            const currentState = mutableState.toJSON();
            expect(currentState).toEqual(initialState);
        });

        it('should replace the state with a new state using replace method', () => {
            const newState = { newProp: 'newValue' };
            mutableState.replace(newState);
            expect(mutableState.toJSON()).toEqual(newState);
        });

        it('should reset the state to the initial state using reset method', () => {
            mutableState.name = 'Jane';
            mutableState.reset();
            expect(mutableState.toJSON()).toEqual(initialState);
        });
    });

    describe('Subscribe Tests', () => {
        it('should notify root-level subscribers when any part of the state changes', () => {
            const callback = jest.fn();
            mutableState.subscribe(callback);
            mutableState.name = 'Jane';
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should notify property-level subscribers when the specific property changes', () => {
            const callback = jest.fn();
            mutableState.name.$subscribe(callback);
            mutableState.name = 'Jane';
            expect(callback).toHaveBeenCalledTimes(1);
        });

        // More tests to ensure other properties' changes do not trigger this callback
    });

    describe('Data Type Handling Tests', () => {
        it('should handle string properties correctly', () => {
            const oldName = mutableState.name;
            expect(oldName.$value()).toBe('John');

            mutableState.name = 'Jane';

            const newName = mutableState.name;
            expect(newName.$value()).toBe('Jane');

            expect(oldName).not.toBe(newName);
        });

        it('should handle number properties correctly', () => {
            expect(mutableState.age.$value()).toBe(30);
            mutableState.age = 25;
            expect(mutableState.age.$value()).toBe(25);
        });

        it('should handle boolean properties correctly', () => {
            expect(mutableState.isActive.$value()).toBe(true);
            mutableState.isActive = false;
            expect(mutableState.isActive.$value()).toBe(false);
        });

        it('should handle array properties correctly', () => {
            expect(mutableState.hobbies.$value()).toEqual(['reading', 'travelling']);
            mutableState.hobbies.push('cooking');
            expect(mutableState.hobbies.$value()).toContain('cooking');
        });

        it('should handle null properties correctly', () => {
            expect(mutableState.score.$value()).toBeNull();
            mutableState.score = 100;
            expect(mutableState.score.$value()).toBe(100);
        });

        it('should handle date properties correctly', () => {
            expect(mutableState.birthDate.$value()).toEqual(new Date('1990-01-01'));
            mutableState.birthDate = new Date('2000-01-01');
            expect(mutableState.birthDate.$value()).toEqual(new Date('2000-01-01'));
        });

        it('should handle set properties correctly', () => {
            expect(mutableState.uniqueTags.$value().has('tag1')).toBe(true);
            mutableState.uniqueTags.add('tag3');
            expect(mutableState.uniqueTags.$value().has('tag3')).toBe(true);
        });

        it('should handle map properties correctly', () => {
            expect(mutableState.metadata.$value().size).toBe(0);
            mutableState.metadata.$value().set('key1', 'value1');
            expect(mutableState.metadata.$value().get('key1')).toBe('value1');
        });

        // Additional tests for function properties, etc.
    });

    describe('Nested Property Tests', () => {
        it('should allow access and modification of nested properties', () => {
            expect(mutableState.address.street.$value()).toBe('123 Main St');
            mutableState.address.street = '456 Elm St';
            expect(mutableState.address.street.$value()).toBe('456 Elm St');
        });

        it('should return the same proxy instance for the same nested property access', () => {
            const firstAccess = mutableState.address.street;
            const secondAccess = mutableState.address.street;
            expect(firstAccess).toBe(secondAccess);
        });

        it('should update the instance when nested property is modified', () => {
            const streetProxy = mutableState.address.street;
            mutableState.address.street = '789 Park Ave';
            expect(streetProxy).not.toBe(mutableState.address.street);
        });
    });

    describe('Edge Case Tests', () => {
        it('should handle non-existent property access gracefully', () => {
            expect(mutableState.nonExistentProperty.someOtherRandomProp.newRandomProp.$value()).toBeUndefined();
        });

        it('should remove properties using the remove method', () => {
            mutableState.address.$remove();
            expect(mutableState.address.$value()).toBeUndefined();
        });
    });

});