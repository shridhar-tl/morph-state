import { unstable_batchedUpdates as dom_unstable_batchedUpdates } from 'react-dom';
//import { unstable_batchedUpdates as native_unstable_batchedUpdates } from 'react-native';

// eslint-disable-next-line @typescript-eslint/ban-types
let unstable_batchedUpdates: Function = (func: Function) => func();

if (typeof window !== 'undefined' && window.document) {
    unstable_batchedUpdates = dom_unstable_batchedUpdates;
} else {
    //  unstable_batchedUpdates = native_unstable_batchedUpdates;
}

export { unstable_batchedUpdates };