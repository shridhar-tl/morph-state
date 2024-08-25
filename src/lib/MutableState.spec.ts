import { createMutableState } from '../MutableState';
import { until } from './test-utils';
import { valueOf, withConfig } from './helpers';

const defaultNameValue = 'John';
const defaultAgeValue = 30;
const defaultDateValue = new Date();

describe('createMutableState', () => {
    let changeHandlerSpy: jest.Mock;
    let subscriberSpy: jest.Mock;
    let initialState: any;
    let mutableState: any;

    beforeEach(() => {
        changeHandlerSpy = jest.fn();
        subscriberSpy = jest.fn();
        initialState = {
            name: defaultNameValue,
            age: defaultAgeValue,
            address: {
                street: '123 Main St',
                city: 'New York'
            },
            hobbies: ['reading', 'travelling'],
            isActive: true,
            score: null,
            birthDate: new Date('1990-01-01'),
            metadata: new Map([['propName', { propA: true, propB: false }]]),
            uniqueTags: new Set(['tag1', 'tag2']),
            aNullValue: null,
            aNumber: 10.4,
            aZero: 0,
            aFalse: false,
            aTrue: true,
            aDate: defaultDateValue
        };
        mutableState = createMutableState(initialState, changeHandlerSpy);
        mutableState.subscribe(subscriberSpy);
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

        it('should call the changeHandler multiple times when multiple state changes', () => {
            mutableState.name = 'Jane';
            mutableState.spouseName = 'Some other Jane';
            mutableState.address.zipCode = 654321;
            expect(changeHandlerSpy).toHaveBeenCalledTimes(3);
        });

        it('should call the subscribe method when state changes', async () => {
            mutableState.name = 'Jane';
            await until();
            expect(subscriberSpy).toHaveBeenCalledTimes(1);
        });

        it('should call the subscribe only once even when multiple state changes', async () => {
            mutableState.name = 'Jane';
            mutableState.spouseName = 'Some other Jane';
            await until();
            expect(subscriberSpy).toHaveBeenCalledTimes(1);
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
        it('should notify root-level subscribers when any part of the state changes', async () => {
            const callback = jest.fn();
            mutableState.subscribe(callback);
            mutableState.name = 'Jane';
            await until();
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should notify property-level subscribers when the specific property changes', async () => {
            const callback = jest.fn();
            withConfig(mutableState, { interceptValues: true }).name.$subscribe(callback);
            mutableState.name = 'Jane';
            await until();
            expect(callback).toHaveBeenCalledTimes(1);
        });

        // More tests to ensure other properties' changes do not trigger this callback
    });

    describe('Data Type Handling Tests', () => {
        it('should handle string properties correctly', () => {
            const oldName = mutableState.name;
            expect(valueOf(oldName)).toBe(defaultNameValue);

            mutableState.name = 'Jane';

            const newName = mutableState.name;
            expect(valueOf(newName)).toBe('Jane');

            expect(oldName).not.toBe(newName);
        });

        it('should handle number properties correctly', () => {
            expect(valueOf(mutableState.age)).toBe(defaultAgeValue);
            mutableState.age = 25;
            expect(valueOf(mutableState.age)).toBe(25);
        });

        it('should handle boolean properties correctly', () => {
            expect(valueOf(mutableState.isActive)).toBe(true);
            mutableState.isActive = false;
            expect(valueOf(mutableState.isActive)).toBe(false);
        });

        it('should handle array properties correctly', () => {
            expect(valueOf(mutableState.hobbies)).toEqual(['reading', 'travelling']);
            mutableState.hobbies.push('cooking');
            expect(valueOf(mutableState.hobbies)).toContain('cooking');
        });

        it('should handle null properties correctly', () => {
            expect(valueOf(mutableState.score)).toBeNull();
            mutableState.score = 100;
            expect(valueOf(mutableState.score)).toBe(100);
        });

        it('should handle date properties correctly', () => {
            expect(valueOf(mutableState.birthDate)).toEqual(new Date('1990-01-01'));
            mutableState.birthDate = new Date('2000-01-01');
            expect(valueOf(mutableState.birthDate)).toEqual(new Date('2000-01-01'));
        });

        it('should handle set properties correctly', () => {
            expect(valueOf(mutableState.uniqueTags).has('tag1')).toBe(true);
            mutableState.uniqueTags.add('tag3');
            expect(valueOf(mutableState.uniqueTags).has('tag3')).toBe(true);
        });

        it('should handle map properties correctly', () => {
            expect(valueOf(mutableState.metadata).size).toBe(1);
            mutableState.metadata.key1 = 'value1';
            expect(valueOf(mutableState.metadata).get('key1')).toBe('value1');
        });

        // Additional tests for function properties, etc.
    });

    describe('Nested Property Tests', () => {
        it('should allow access and modification of nested properties', () => {
            expect(valueOf(mutableState.address.street)).toBe('123 Main St');
            mutableState.address.street = '456 Elm St';
            expect(valueOf(mutableState.address.street)).toBe('456 Elm St');
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

    describe('Test for config changes', () => {
        it('should return undefined value based on config', () => {
            expect(mutableState.nonExistentProperty).toBeUndefined(); // Validate it before using config

            expect(withConfig(mutableState, { interceptUndefined: false }).nonExistentProperty).toBeUndefined();

            const unknownProperty = withConfig(mutableState, { interceptUndefined: true }).nonExistentProperty.someOtherRandomProp.newRandomProp;

            expect(unknownProperty).not.toBeUndefined();
            expect(valueOf(unknownProperty)).toBeUndefined();

            expect(mutableState.nonExistentProperty).toBeUndefined(); // Validate it after using config
        });

        it('should return null value based on config', () => {
            expect(mutableState.aNullValue).toBeNull(); // Validate it before using config

            expect(withConfig(mutableState, { interceptNull: false }).aNullValue).toBeNull();

            const aNullProperty = withConfig(mutableState, { interceptNull: true }).aNullValue;

            expect(aNullProperty).not.toBeNull();
            expect(aNullProperty.someOtherRandomProp).toBeUndefined();
            expect(valueOf(aNullProperty)).toBeNull();

            expect(mutableState.aNullValue).toBeNull(); // Validate it after using config
        });

        it('should return mix of null and undefined value based on config', () => {
            expect(mutableState.aNullValue).toBeNull(); // Validate it before using config

            expect(withConfig(mutableState, { interceptNull: false }).aNullValue).toBeNull();

            const aNullProperty = withConfig(mutableState, { interceptNull: true, interceptUndefined: true }).aNullValue;

            expect(aNullProperty).not.toBeNull();
            expect(valueOf(aNullProperty.someOtherRandomProp.someDifferentProperty)).toBeUndefined();
            expect(valueOf(aNullProperty)).toBeNull();

            expect(mutableState.aNullValue).toBeNull(); // Validate it after using config
        });

        it('should return string value based on config', () => {
            expect(mutableState.name).toBe(defaultNameValue); // Validate it before using config

            expect(withConfig(mutableState, { interceptValues: false }).name).toBe(defaultNameValue);

            const aNameProperty = withConfig(mutableState, { interceptValues: true }).name;

            expect(aNameProperty).not.toBe(defaultNameValue);
            expect(aNameProperty.someOtherRandomProp).toBeUndefined();
            expect(valueOf(aNameProperty)).toBe(defaultNameValue);

            expect(mutableState.name).toBe(defaultNameValue); // Validate it after using config
        });

        it('should return numeric value based on config', () => {
            expect(mutableState.age).toBe(defaultAgeValue); // Validate it before using config

            expect(withConfig(mutableState, { interceptValues: false }).age).toBe(defaultAgeValue);

            const anAgeProperty = withConfig(mutableState, { interceptValues: true }).age;

            expect(anAgeProperty).not.toBe(defaultAgeValue);
            expect(anAgeProperty.someOtherRandomProp).toBeUndefined();
            expect(valueOf(anAgeProperty)).toBe(defaultAgeValue);

            expect(mutableState.age).toBe(defaultAgeValue); // Validate it after using config
        });

        it('should return numeric zero value based on config', () => {
            expect(mutableState.aZero).toBe(0); // Validate it before using config

            expect(withConfig(mutableState, { interceptValues: false }).aZero).toBe(0);

            const propertyValue = withConfig(mutableState, { interceptValues: true }).aZero;

            expect(propertyValue).not.toBe(0);
            expect(propertyValue.someOtherRandomProp).toBeUndefined();
            expect(valueOf(propertyValue)).toBe(0);

            expect(mutableState.aZero).toBe(0); // Validate it after using config
        });

        it('should return object value based on config', () => {
            const expectedValue = initialState.address;

            expect(mutableState.address).not.toEqual(expectedValue); // Validate it before using config
            expect(valueOf(mutableState.address)).toEqual(expectedValue); // Validate it before using config

            expect(withConfig(mutableState, { interceptObjects: false }).address).toEqual(expectedValue);

            const propertyValue = withConfig(mutableState, { interceptObjects: true }).address;

            expect(propertyValue).not.toEqual(expectedValue);
            expect(propertyValue.someOtherRandomProp).toBeUndefined();
            expect(valueOf(propertyValue)).toEqual(expectedValue);

            expect(mutableState.address).not.toEqual(expectedValue); // Validate it before using config
            expect(valueOf(mutableState.address)).toEqual(expectedValue); // Validate it before using config
        });

        it('should return array value based on config', () => {
            const expectedValue = initialState.hobbies;

            expect(mutableState.hobbies).not.toEqual(expectedValue); // Validate it before using config
            expect(valueOf(mutableState.hobbies)).toEqual(expectedValue); // Validate it before using config

            expect(withConfig(mutableState, { interceptArrays: false }).hobbies).toEqual(expectedValue);

            const propertyValue = withConfig(mutableState, { interceptArrays: true }).hobbies;

            expect(propertyValue).not.toEqual(expectedValue);
            expect(propertyValue.someOtherRandomProp).toBeUndefined();
            expect(valueOf(propertyValue)).toEqual(expectedValue);

            expect(mutableState.hobbies).not.toEqual(expectedValue); // Validate it before using config
            expect(valueOf(mutableState.hobbies)).toEqual(expectedValue); // Validate it before using config
        });

        it('should return set value based on config', () => {
            const expectedValue = initialState.uniqueTags;

            expect(mutableState.uniqueTags).not.toEqual(expectedValue); // Validate it before using config
            expect(valueOf(mutableState.uniqueTags)).toEqual(expectedValue); // Validate it before using config

            expect(withConfig(mutableState, { interceptSpecialObjects: false }).uniqueTags).toEqual(expectedValue);

            const propertyValue = withConfig(mutableState, { interceptSpecialObjects: true }).uniqueTags;

            expect(propertyValue).not.toEqual(expectedValue);
            expect(propertyValue.someOtherRandomProp).toBeUndefined();
            expect(valueOf(propertyValue)).toEqual(expectedValue);

            expect(mutableState.uniqueTags).not.toEqual(expectedValue); // Validate it before using config
            expect(valueOf(mutableState.uniqueTags)).toEqual(expectedValue); // Validate it before using config
        });

        it('should return map value based on config', () => {
            const expectedValue = initialState.metadata;

            expect(mutableState.metadata).not.toEqual(expectedValue); // Validate it before using config
            expect(valueOf(mutableState.metadata)).toEqual(expectedValue); // Validate it before using config

            expect(withConfig(mutableState, { interceptSpecialObjects: false }).metadata).toEqual(expectedValue);

            const propertyValue = withConfig(mutableState, { interceptSpecialObjects: true }).metadata;

            expect(propertyValue).not.toEqual(expectedValue);
            expect(propertyValue.someOtherRandomProp).toBeUndefined();
            expect(valueOf(propertyValue)).toEqual(expectedValue);

            expect(mutableState.metadata).not.toEqual(expectedValue); // Validate it before using config
            expect(valueOf(mutableState.metadata)).toEqual(expectedValue); // Validate it before using config
        });

        it('should return boolean false value based on config', () => {
            expect(mutableState.aFalse).toBe(false); // Validate it before using config

            expect(withConfig(mutableState, { interceptValues: false }).aFalse).toBe(false);

            const propertyValue = withConfig(mutableState, { interceptValues: true }).aFalse;

            expect(propertyValue).not.toBe(false);
            expect(propertyValue.someOtherRandomProp).toBeUndefined();
            expect(valueOf(propertyValue)).toBe(false);

            expect(mutableState.aFalse).toBe(false); // Validate it after using config
        });

        it('should return boolean true value based on config', () => {
            const expectedValue = true;
            expect(mutableState.aTrue).toBe(expectedValue); // Validate it before using config

            expect(withConfig(mutableState, { interceptValues: false }).aTrue).toBe(expectedValue);

            const propertyValue = withConfig(mutableState, { interceptValues: true }).aTrue;

            expect(propertyValue).not.toBe(expectedValue);
            expect(propertyValue.someOtherRandomProp).toBeUndefined();
            expect(valueOf(propertyValue)).toBe(expectedValue);

            expect(mutableState.aTrue).toBe(expectedValue); // Validate it after using config
        });

        it('should return date value based on config', () => {
            const expectedValue = defaultDateValue.getTime();
            expect(mutableState.aDate.getTime()).toBe(expectedValue); // Validate it before using config

            expect(withConfig(mutableState, { interceptValues: false }).aDate.getTime()).toBe(expectedValue);

            const propertyValue = withConfig(mutableState, { interceptValues: true }).aDate;

            expect(propertyValue).not.toBeInstanceOf(Date);
            expect(propertyValue).not.toBe(expectedValue);
            expect(propertyValue.someOtherRandomProp).toBeUndefined();
            expect(valueOf(propertyValue).getTime()).toBe(expectedValue);

            expect(mutableState.aDate.getTime()).toBe(expectedValue); // Validate it after using config
        });
    });

    describe('Edge Case Tests', () => {
        it('should handle non-existent property access gracefully', () => {
            expect(valueOf(mutableState.nonExistentProperty)).toBeUndefined();
        });

        it('should remove properties using the remove method', () => {
            mutableState.address.$remove();
            expect(valueOf(mutableState.address)).toBeUndefined();
        });
    });
});