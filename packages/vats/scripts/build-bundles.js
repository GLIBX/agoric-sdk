#! /usr/bin/env node
import '@endo/init';
import { createBundles } from '@agoric/deploy-script-support';
import url from 'url';

const dirname = url.fileURLToPath(new URL('.', import.meta.url));

const sourceToBundle = [
  [`../src/centralSupply.js`, `../bundles/bundle-centralSupply.js`],
  [`../src/mintHolder.js`, `../bundles/bundle-mintHolder.js`],
];

await createBundles(sourceToBundle, dirname);
