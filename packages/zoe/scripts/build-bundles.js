#! /usr/bin/env node
import '@endo/init';
import { createBundles } from '@agoric/deploy-script-support';
import url from 'url';

const dirname = url.fileURLToPath(new URL('.', import.meta.url));

const sourceToBundle = [
  ['../src/contractFacet/vatRoot.js', '../bundles/bundle-contractFacet.js'],
];

await createBundles(sourceToBundle, dirname);
