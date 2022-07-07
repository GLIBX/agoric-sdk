import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';
import { AmountMath } from '@agoric/ertp';
import buildManualTimer from '../../../tools/manualTimer.js';

const { quote: q, details: X } = assert;

const mintInto = (kit, purse, value) =>
  E(kit.mint)
    .mintPayment(AmountMath.make(kit.brand, value))
    .then(p => E(purse).deposit(p));

const mintPayment = (kit, value) =>
  E(kit.mint).mintPayment(AmountMath.make(kit.brand, value));

const offerCall = async (zoe, creatorFacet, kits, timer, give, want) => {
  const { doubloonsKit, bucksKit } = kits;
  const ccMakerInvitation = await E(creatorFacet).makeInvitation();
  return E(zoe).offer(
    ccMakerInvitation,
    harden({
      give: { Doubloons: AmountMath.make(doubloonsKit.brand, give) },
      want: { Bucks: AmountMath.make(bucksKit.brand, want) },
      exit: {
        afterDeadline: {
          deadline: 10n,
          timer,
        },
      },
    }),
    { Doubloons: mintPayment(doubloonsKit, give) },
  );
};

const acceptCall = async (zoe, invitation, kits, give, want) => {
  const { doubloonsKit, bucksKit } = kits;
  return E(zoe).offer(
    invitation,
    harden({
      give: { Bucks: AmountMath.make(bucksKit.brand, give) },
      want: { Doubloons: AmountMath.make(doubloonsKit.brand, want) },
      exit: { onDemand: null },
    }),
    { Bucks: mintPayment(bucksKit, give) },
  );
};

const depositPayout = (seat, keyword, purse, expectedAmount) => {
  console.log(`BOOT   DP  seat  ${seat}`);
  return E(seat)
    .getPayout(keyword)
    .then(
      payout => {
        console.log(`BOO    DP   ${q(payout)}`);
        return E(purse).deposit(payout);
      },
      e => console.log(`BOO  DP  fail  ${e}`),
    )
    .then(
      depositAmount => {
        console.log(`BOO DP deposited  ${q(depositAmount)}`);
        assert(
          AmountMath.isEqual(depositAmount, expectedAmount),
          X`amounts don't match: ${q(depositAmount)}, ${q(expectedAmount)}`,
        );
      },
      e => console.log(`BOO DP   fail depositAmount ${e}`),
    );
};

const printAmount = async (issuer, payment) => {
  const amount = await E(issuer).getAmountOf(payment);
  return ` ${q(amount)}`;
};

const printPayoutAmounts = async (
  seat,
  bucksKit,
  doubloonsKit,
  label = 'FOO',
) => {
  const bucksPay = await E(seat).getPayout('Bucks');
  const doubloonsPay = await E(seat).getPayout('Doubloons');
  console.log(
    `UPGRADE ${label} bucks: ${await printAmount(bucksKit.issuer, bucksPay)}`,
  );
  console.log(
    `UPGRADE ${label} doubloons: ${await printAmount(
      doubloonsKit.issuer,
      doubloonsPay,
    )}`,
  );
};

export const buildRootObject = () => {
  let vatAdmin;
  let zoe;
  let instanceAdmin2;
  let ertpService;
  let doubloonsKit;
  let bucksKit;
  let invitation2B;
  let creator2;
  let kits;
  let issuerReccord;
  let doubloons;
  let bucks;
  const timer = buildManualTimer(console.log);
  let installation;

  return Far('root', {
    bootstrap: async (vats, devices) => {
      await timer.tick('bootstrap');
      vatAdmin = await E(vats.vatAdmin).createVatAdminService(devices.vatAdmin);
      [zoe, ertpService] = await Promise.all([
        E(vats.zoe).buildZoe(vatAdmin),
        E(vats.ertp).getErtpService(),
      ]);

      doubloonsKit = await E(ertpService).makeIssuerKit('Doubloons');
      bucksKit = await E(ertpService).makeIssuerKit('Bucks');
      kits = { doubloonsKit, bucksKit };
      doubloons = v => AmountMath.make(doubloonsKit.brand, v);
      bucks = v => AmountMath.make(bucksKit.brand, v);

      const v2BundleId = await E(vatAdmin).getBundleIDByName('coveredCallV2');
      assert(v2BundleId, 'bundleId must not be empty');
      installation = await E(zoe).installBundleID(v2BundleId);

      issuerReccord = harden({
        Bucks: bucksKit.issuer,
        Doubloons: doubloonsKit.issuer,
      });
    },

    buildV1: async () => {
      console.log(`BOOT starting buildV1`);
      await timer.tick('buildV1');
      // build the contract vat from ZCF and the contract bundlecap

      const doubloonPurse = await E(doubloonsKit.issuer).makeEmptyPurse();
      await mintInto(doubloonsKit, doubloonPurse, 20n);

      // Complete round-trip without upgrade
      const facets1 = await E(zoe).startInstance(installation, issuerReccord);
      const creator1 = facets1.creatorFacet;
      const seat1A = await offerCall(zoe, creator1, kits, timer, 15n, 30n);
      const invitation1B = await E(seat1A).getOfferResult(seat1A);
      const seat1B = await acceptCall(zoe, invitation1B, kits, 30n, 15n);
      const doubloonsPurse = E(doubloonsKit.issuer).makeEmptyPurse();
      console.log(`UPGRADE  1A ${await E(seat1A).getOfferResult()}`);
      console.log(`UPGRADE  1B  ${await E(seat1B).getOfferResult()}`);
      await printPayoutAmounts(seat1A, bucksKit, doubloonsKit, '1A');
      await printPayoutAmounts(seat1B, bucksKit, doubloonsKit, '1B');
      await depositPayout(seat1B, 'Doubloons', doubloonsPurse, doubloons(15n));

      // Create the call, and hand off the invitation for exercise after upgrade
      const facets2 = await E(zoe).startInstance(installation, issuerReccord);
      ({ adminFacet: instanceAdmin2 } = facets2);
      creator2 = facets2.creatorFacet;
      const seat2A = await offerCall(zoe, creator2, kits, timer, 22n, 42n);
      const invitation2BP = E(seat2A).getOfferResult();
      invitation2BP.then(
        option => console.log(`BOOT   got option ${option}`),
        e => console.log('BOOT  option fail', e),
      );

      E(seat2A)
        .getOfferResult()
        .then(async r => {
          console.log(`UPGRADE 2A  Success: ${r}`);
          await printPayoutAmounts(seat2A, bucksKit, doubloonsKit, '2A');
        });

      invitation2B = await invitation2BP;
      return true;
    },

    upgradeV2: async () => {
      await timer.tick('upgradeV2');
      const v3BundleId = await E(vatAdmin).getBundleIDByName('coveredCallV3');
      const doubloonsPurse = await E(doubloonsKit.issuer).makeEmptyPurse();
      const bucksPurse = await E(bucksKit.issuer).makeEmptyPurse();

      await E(instanceAdmin2).upgradeContract(v3BundleId);

      // exercise an invitation from before the upgrade
      const seat2BP = acceptCall(zoe, invitation2B, kits, 42n, 22n);
      seat2BP.then(
        seat => console.log(`Boot   upgrade  seat2b  ${seat}`),
        e => console.log(` BOOT  upgrade  seat2b fail:  ${e}`),
      );
      const seat2B = await seat2BP;

      console.log(`UPGRADE 2B  ${await E(seat2B).getOfferResult()}`);
      await printPayoutAmounts(seat2B, bucksKit, doubloonsKit, '2B');
      const payoutResult = depositPayout(
        seat2B,
        'Bucks',
        bucksPurse,
        bucks(42n),
      );
      payoutResult.then(
        r => console.log(`BOOOT   result  ${r}`),
        e => console.log(`BOOT  fail pauoutResult ${e}`),
      );
      await payoutResult;

      console.log(`BOOT  deposited`);

      // Complete round-trip after upgrade
      const facets3 = await E(zoe).startInstance(installation, issuerReccord);
      const creator3 = facets3.creatorFacet;
      const seat3A = await offerCall(zoe, creator3, kits, timer, 41n, 73n);
      const invitation3B = await E(seat3A).getOfferResult(seat3A);
      const seat3B = await acceptCall(zoe, invitation3B, kits, 73n, 41n);
      await printPayoutAmounts(seat3A, bucksKit, doubloonsKit, '3A');
      await printPayoutAmounts(seat3B, bucksKit, doubloonsKit, '3B');
      await depositPayout(seat3B, 'Doubloons', doubloonsPurse, doubloons(41n));

      return true;
    },
  });
};
