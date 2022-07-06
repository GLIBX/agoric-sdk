/* global globalThis */

import { assert } from '@agoric/assert';
import {
  M,
  makeScalarMapStore,
  makeScalarWeakMapStore,
  makeScalarSetStore,
  makeScalarWeakSetStore,
  provide,
} from '@agoric/store';

export {
  M,
  makeScalarMapStore,
  makeScalarWeakMapStore,
  makeScalarSetStore,
  makeScalarWeakSetStore,
};

/** @type {import('./types').VatData} */
let VatDataGlobal;
if ('VatData' in globalThis) {
  assert(globalThis.VatData, 'VatData defined in global as null or undefined');
  VatDataGlobal = globalThis.VatData;
} else {
  // XXX this module has been known to get imported (transitively) in cases that
  // never use it so we make a version that will satisfy module resolution but
  // fail at runtime.
  const unvailable = () => assert.fail('VatData unavailable');
  VatDataGlobal = {
    defineKind: unvailable,
    defineKindMulti: unvailable,
    defineDurableKind: unvailable,
    defineDurableKindMulti: unvailable,
    makeKindHandle: unvailable,
    providePromiseWatcher: unvailable,
    watchPromise: unvailable,
    makeScalarBigMapStore: unvailable,
    makeScalarBigWeakMapStore: unvailable,
    makeScalarBigSetStore: unvailable,
    makeScalarBigWeakSetStore: unvailable,
    isDurableObject: unvailable,
  };
}

export const {
  defineKind,
  defineKindMulti,
  defineDurableKind,
  defineDurableKindMulti,
  makeKindHandle,
  providePromiseWatcher,
  watchPromise,
  makeScalarBigMapStore,
  makeScalarBigWeakMapStore,
  makeScalarBigSetStore,
  makeScalarBigWeakSetStore,
  isDurableObject,
} = VatDataGlobal;

/**
 * When making a multi-facet kind, it's common to pick one facet to expose. E.g.,
 *
 *     const makeFoo = (a, b, c, d) => makeFooBase(a, b, c, d).self;
 *
 * This helper reduces the duplication:
 *
 *     const makeFoo = pickFacet(makeFooBase, 'self');
 *
 * @type {import('./types').PickFacet}
 */
export const pickFacet =
  (maker, facetName) =>
  (...args) =>
    maker(...args)[facetName];
// @ts-expect-error TODO statically recognize harden
harden(pickFacet);

/**
 * Assign the values of all of the enumerable own properties from the source
 * object to their keys in the target object.
 *
 * @template {{}} T
 * @param {T} target
 * @param {Partial<T>} source
 */
export const partialAssign = (target, source) => {
  Object.assign(target, source);
};
// @ts-expect-error TODO statically recognize harden
harden(partialAssign);

export const provideDurableMapStore = (baggage, name) =>
  provide(baggage, name, () => makeScalarBigMapStore(name, { durable: true }));
// @ts-expect-error TODO statically recognize harden
harden(provideDurableMapStore);

export const provideDurableWeakMapStore = (baggage, name) =>
  provide(baggage, name, () =>
    makeScalarBigWeakMapStore(name, { durable: true }),
  );
// @ts-expect-error TODO statically recognize harden
harden(provideDurableWeakMapStore);

export const provideDurableSetStore = (baggage, name) =>
  provide(baggage, name, () => makeScalarBigSetStore(name, { durable: true }));
// @ts-expect-error TODO statically recognize harden
harden(provideDurableSetStore);
