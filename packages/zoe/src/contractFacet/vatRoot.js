// @ts-check

// This is the Zoe contract facet. Each time we make a new instance of a
// contract we will start by creating a new vat and running this code in it. In
// order to install this code in a vat, Zoe needs to import a bundle containing
// this code. We will eventually have an automated process, but for now, every
// time this file is edited, the bundle must be manually rebuilt with
// `yarn build-zcfBundle`.

import { Far } from '@endo/marshal';
import { E } from '@endo/far';

import '../../exported.js';
import '../internal-types.js';

import { makeZCFZygote } from './zcfZygote.js';

const { details: X } = assert;

/**
 * @param {VatPowers & { testJigSetter: TestJigSetter }} powers
 * @param {{contractBundleCap: BundleCap, zoeService: ZoeService, invitationIssuer: Issuer}} vatParameters
 * @param {import('@agoric/vat-data').Baggage} baggage
 */
// * @returns {{ executeContract: ExecuteContract}}
export async function buildRootObject(powers, vatParameters, baggage) {
  // Currently, there is only one function, `executeContract` called
  // by the Zoe Service. However, when there is kernel support for
  // zygote vats (essentially freezing and then creating copies of
  // vats), `makeZCFZygote`, `zcfZygote.evaluateContract` and
  // `zcfZygote.startContract` should exposed separately.
  const { testJigSetter } = powers;
  const { contractBundleCap } = vatParameters;
  assert(
    contractBundleCap !== undefined,
    X`expected vatParameters.contractBundleCap ${vatParameters}`,
  );
  let { zoeService, invitationIssuer } = vatParameters;
  const didStart = baggage.has('DidStart');
  if (didStart) {
    assert(!zoeService);
    assert(!invitationIssuer);
    zoeService = baggage.get('zoeService');
    invitationIssuer = baggage.get('invitationIssuer');
  } else {
    baggage.init('DidStart', true);
    baggage.init('zoeService', zoeService);
    baggage.init('invitationIssuer', invitationIssuer);
  }

  // make zcfZygote with contract-general state and kinds initialized
  console.log(`VatRoot  ${Array.from(baggage.keys())}`);
  const zcfZygote = await makeZCFZygote(
    powers,
    zoeService,
    invitationIssuer,
    testJigSetter,
    contractBundleCap,
    baggage,
  );

  // snapshot zygote here //////////////////

  return Far('contractRunner', {
    // initialize instance-specific state of the contract (1st time)
    startContract: (
      zoeInstanceAdmin, // in 1st message post-clone
      instanceRecordFromZoe, // in 1st msg post-clone (could split out installation)
      // terms might change on upgrade?
      issuerStorageFromZoe, // instance specific; stored in baggage
      privateArgs = undefined, // instance specific; stored in baggage;
      // upgrade might supplement this
    ) => {
      assert(!didStart);
      // bikeshed: the outer and inner messages shouldn't both be startContract
      /** @type {ZCFZygote} */
      return E(zcfZygote).startContract(
        zoeInstanceAdmin,
        instanceRecordFromZoe,
        issuerStorageFromZoe,
        privateArgs,
      );
    },
    // re-initialize instance-specific state of the contract (not 1st time)
    restartContract: (
      zoeInstanceAdmin, // in 1st message post-clone
      instanceRecordFromZoe, // in 1st msg post-clone (could split out installation)
      // terms might change on upgrade?
      issuerStorageFromZoe, // instance specific; stored in baggage
      privateArgs = undefined, // instance specific; stored in baggage;
      // upgrade might supplement this
    ) => {
      assert(!didStart);
      /** @type {ZCFZygote} */
      return E(zcfZygote).restartContract(privateArgs);
    },
  });
}

harden(buildRootObject);
