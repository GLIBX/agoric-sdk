// @ts-check

import { makeWeakStore } from '@agoric/store';
import { ToFarFunction } from '@endo/marshal';
import { isDurableObject, provideDurableWeakMapStore } from '@agoric/vat-data';

import { defineDurableHandle } from '../makeHandle.js';

export const makeOfferHandlerStorage = zcfBaggage => {
  const makeInvitationHandle = defineDurableHandle(zcfBaggage, 'Invitation');
  /** @type {WeakStore<InvitationHandle, OfferHandler>} */
  const invitationHandleToEphemeralHandler = makeWeakStore('invitationHandle');
  /** @type {WeakStore<InvitationHandle, OfferHandler>} */
  const invitationHandleToDurableHandler = provideDurableWeakMapStore(
    zcfBaggage,
    'invitationHandle',
  );

  /** @type {(offerHandler: OfferHandler) => InvitationHandle} */
  const storeOfferHandler = offerHandler => {
    const invitationHandleToHandler = isDurableObject(offerHandler)
      ? invitationHandleToDurableHandler
      : invitationHandleToEphemeralHandler;

    const farOfferHandler = ToFarFunction('offerHandler', offerHandler);
    const invitationHandle = makeInvitationHandle();
    invitationHandleToHandler.init(invitationHandle, farOfferHandler);
    return invitationHandle;
  };

  /**
   * @type {(invitationHandle: InvitationHandle, details?: Details) => OfferHandler}
   */
  const takeOfferHandler = (
    invitationHandle,
    details = 'offerHandler may not have survived upgrade',
  ) => {
    let invitationHandleToHandler;
    if (invitationHandleToDurableHandler.has(invitationHandle)) {
      invitationHandleToHandler = invitationHandleToDurableHandler;
    } else {
      assert(invitationHandleToEphemeralHandler.has(invitationHandle), details);
      invitationHandleToHandler = invitationHandleToEphemeralHandler;
    }
    const offerHandler = invitationHandleToHandler.get(invitationHandle);
    invitationHandleToHandler.delete(invitationHandle);
    return offerHandler;
  };

  return harden({
    storeOfferHandler,
    takeOfferHandler,
  });
};
