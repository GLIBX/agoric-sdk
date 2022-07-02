import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';

export const buildRootObject = () => {
  let vatAdmin;
  let zoeService;
  let instanceAdmin;
  console.log(`BOOT start`);

  return Far('root', {
    bootstrap: async (vats, devices) => {
      vatAdmin = await E(vats.vatAdmin).createVatAdminService(devices.vatAdmin);
      zoeService = await E(vats.zoe).buildZoe(vatAdmin);
    },

    buildV1: async () => {
      console.log(`BOOT starting buildV1`);
      // build the contract vat from ZCF and the contract bundlecap
      const v2BundleId = await E(vatAdmin).getBundleIDByName('coveredCallV2');

      assert(v2BundleId);

      const installation = await E(zoeService).installBundleID(v2BundleId);

      const facets = await E(zoeService).startInstance(installation);
      const { creatorFacet } = facets;
      ({ adminFacet: instanceAdmin } = facets);

      return true;
    },

    upgradeV2: async () => {
      const v3BundleId = await E(vatAdmin).getBundleIDByName('coveredCallV3');
      // exercise revived contract

      await E(instanceAdmin).upgradeContract(v3BundleId);

      // exercise existing covered call and make a new one.

      return true;
    },
  });
};
