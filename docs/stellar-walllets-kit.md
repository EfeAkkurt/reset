# Wallet Integration

## Stellar Wallet Kit

A simple-to-use wallet kit to manage integration to multiple Stellar ecosystem wallet. Learn more about how to integrate this library from the Stellar Wallets Kit Docs.

The Stellar Wallets Kit supports many wallets including:

Albedo
Freighter
Hana
Ledger Hardware Wallet
Trezor Handware Wallet
Lobstr
Rabet
WalletConnect
xBull
HOT Wallet
Account Viewer
A stripped-down wallet where you can check an account’s XLM balance and send simple payments on Testnet and Mainnet. Account Viewer's source code is also useful and instructive for developers building wallet-related features into their applications.

Freighter Wallet
SDF’s flagship non-custodial wallet extension that allows users to sign Stellar transactions via their browser. Freighter wallet's codebase is open sourced here: https://github.com/stellar/freighter.

NEAR Intents
NEAR Intents is a multichain transaction protocol for wallets that allows users or AI agents to simply state the outcome they want (like swapping Token A for Token B), and then lets a network of off‑chain market makers (called solvers) compete to fulfill that request; once the best solution is selected, it is sent to the user for approval, then execution is verified and executed through a Verifier smart contract on NEAR.

Read the docs.

Stellar Wallet Sponsorship Calculator
Estimates the XLM requirements for wallets looking to use sponsored reserves and fee-bump transactions to cover account creation, transaction fees, trustlines, and more.

Simplified spreadsheet
Tutorial article and video
Dfns
A wallet-as-a-service platform that streamlines digital asset operations, offering full wallet feature support, including automatic detection of asset and NFT balances (when applicable), on-chain transfer history, asset transfers, transaction broadcasting, and signature generation.

View the docs.

Privy
Wallet infrastructure that enables users to programmatically create a new wallet within their applications.

Follow this guide to create a Stellar wallet.

---

# Stellar Wallets Kit

All Stellar Wallets with just one library
Forget about reading the wallets' documentation, just support all of them at once with this kit.

## Getting started

You can use our library and interact with wallets in multiple ways, here is the shortest way but depending on the logic of you app you might need to do something different, check the documentation for more details.

Here are the steps to install, start and sign a transaction with our kit:

## Install the package

npx jsr add @creit-tech/stellar-wallets-kit

## Start the kit

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';

StellarWalletsKit.init({modules: defaultModules()});

## Create the authentication button

const buttonWrapper = document.querySelector('#buttonWrapper');
StellarWalletsKit.createButton(buttonWrapper);
Sign a transaction

const {address} = await StellarWalletsKit.getAddress();

const {signedTxXdr} = await StellarWalletsKit.signTransaction(tx.toXDR(), {
networkPassphrase: Networks.PUBLIC,
address,
});

console.log("Signed Transaction:", signedTxXdr);
And that's it! you just added support to all Stellar wallets and signed a transaction that is ready to go to the public network with just a few lines of code 🙌

You need something more complex? Maybe listening to updates from the kit or manually handling the connection yourself? Check the documentation for more details.

Compatible Wallets:
xBull Wallet (Both PWA and extension version)
Albedo
Freighter
Rabet (extension version)
WalletConnect
Lobstr
Hana
Hot Wallet
Klever Wallet

---

# DOCS

Installing the library
The library is hosted in a JSR repository, install it with the command:

npx jsr add @creit-tech/stellar-wallets-kit

pnpm add jsr:@creit-tech/stellar-wallets-kit

deno add jsr:@creit-tech/stellar-wallets-kit
Users updating from V1
The first version of the library was hosted in NPM with a different workspace: @creit.tech vs the new @creit-tech user in JSR. To be compatible with old installations we are also pushing new code to the NPM package but be aware that at some point we will stop doing it, we suggest migrating to the new JSR workspace.

Pager

# stucture

The kit's structure
The library is separated into three different places: The SDK and its modules, the State of the library and the built-in Components.

Almost everything is exported at the root level but wallet's modules are exported separately unless you import the default list which includes wallets that don't require extra configuration or dependencies.

For example, you can import the kit and the default dark theme like this:

import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import { SwkAppDarkTheme } from '@creit-tech/stellar-wallets-kit/types'
or just do it directly from the root level (which will import everything that is imported at the root level too unless your bundler clears them):

import { StellarWalletsKit, SwkAppDarkTheme } from '@creit-tech/stellar-wallets-kit'
Wallets modules
On the other hand, wallet modules are not exported at the root level so you will need to import them like this:

import { StellarWalletsKit, SwkAppDarkTheme } from '@creit-tech/stellar-wallets-kit'
import { AlbedoModule } from "@creit-tech/stellar-wallets-kit/modules/albedo";
import { FreighterModule } from "@creit-tech/stellar-wallets-kit/modules/freighter";
import { LobstrModule } from "@creit-tech/stellar-wallets-kit/modules/lobstr";
import { xBullModule } from "@creit-tech/stellar-wallets-kit/modules/xbull";

StellarWalletsKit.init({
theme: SwkAppDarkTheme,
modules: [
new AlbedoModule(),
new FreighterModule(),
new LobstrModule(),
new xBullModule(),
],
});
There are more wallets included in the default list but we didn't include them in this example to keep it short

Or if you're ok with supporting all the default wallets, just import them like this but be aware that there might be more options that are not included in the default list like Wallet Connect, Ledger and others:

import { StellarWalletsKit, SwkAppDarkTheme } from '@creit-tech/stellar-wallets-kit'
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';

StellarWalletsKit.init({
theme: SwkAppDarkTheme,
modules: defaultModules(),
});

# the easy way

The easy way
Before we go into more details about what each method of the kit does, we wanted to show you which method we recommend and the one that should make the process easier for you.

Step 1: Start the kit
The first step is, of course, starting the kit. Make sure you do this in a browser environment, so if, for example, your site uses SSR or has a pre-rendering process, then skip starting the kit until you know it's in the browser. Once you know, you can start it. Do it like this:

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { SwkAppDarkTheme } from "@creit-tech/stellar-wallets-kit/types";
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';

StellarWalletsKit.init({
theme: SwkAppDarkTheme,
modules: defaultModules(),
});
At this point, the kit will be ready to be used, but keep in mind that the default list of modules doesn't include all the wallets. Please check this page if you need to learn how to include all of them.

Step 2: Insert the built-in connection button
Now that the kit is ready, insert the built-in button, which will take care of opening the authentication modal or the profile modal based on the current kit's state. This is the button your users will click when they want to connect their wallets:

// First fetch the html element that will contain it
const buttonWrapper = document.querySelector('#buttonWrapper');
// Then insert the button
StellarWalletsKit.createButton(buttonWrapper);
This will insert a new component to the website and this component will listen to events from the user and the kit. It will follow the current theme of the kit so you can update its styles by updating the styles in the kit. Check the custom styles guide for more details.

Or if you prefer to, you can also just remove all the styles from the button so you can just user regular CSS to update its appearance like this:

import { ButtonMode } from '@creit-tech/stellar-wallets-kit/components';

StellarWalletsKit.createButton(buttonWrapper, {
mode: ButtonMode.free,
classes: 'btn btn-primary'
});
Step 3: Listen to the kit's updates
Because you don't know when the user will click on the button we just created, you need to listen to the updates the kit will send every time something happens. This way, when the user has connected the wallet, you can update it in your website's logic

import { KitEventType } from "@creit-tech/stellar-wallets-kit/types";

const sub1 = StellarWalletsKit.on(KitEventType.STATE_UPDATED, event => {
// We update our website's logic with the new address: event.payload.address
});

const sub2 = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
// We log out the user
});
Be aware that you should call the subscription when you don't longer need them, this will clear the subscription and avoid memory leaks.

Step 4: Do whatever you want
Now that the kit is ready, the user has a button to interact with and you are listening to updates, you can continue with your website's logic. For example, if the user needs to sign a transaction, you can:

// We fetch the active address just to be sure we have the last one available
const {address} = await StellarWalletsKit.getAddress();

// We request the signature for the transaction `tx` using the PUBLIC network and the address we just fetched.
const {signedTxXdr} = await StellarWalletsKit.signTransaction(tx.toXDR(), {
networkPassphrase: Networks.PUBLIC,
address,
});

// Now we just submit the tx to the network
And you are ready to go, check the rest of the documentation if you need more options but what you just saw in this page will cover the vast majority of situations.

Pager

# Starting the kit

The first step is starting the kit, this process will load and start everything that is needed to interact with all wallets. The only required value is defining your list of supported modules, you can either import just the specific modules you want or just going with the default list of modules that don't require any extra configuration. Here is an example:

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';

StellarWalletsKit.init({modules: defaultModules()});
The parameters you can provide when starting the kit are:

export interface StellarWalletsKitInitParams {
modules: ModuleInterface[];
selectedWalletId?: string;
network?: Networks;
theme?: SwkAppTheme;

authModal?: {
showInstallLabel?: boolean;
hideUnsupportedWallets?: boolean;
};
}
Pager

# "Authenticate" the user (connect a wallet)

Before you can fetch the wallet address or request a signature, you need to let the user pick the wallet they want to use and connect with it, we call this "authentication" in the idea of allowing the kit to interact with the user's wallet.

No special authentication logic is done here besides just requesting access to the wallet in some cases, you still should authenticate your users with something extra based on your app's logic.

To do this, you need to show the user the "authentication modal" where the user will pick the wallet they want to connect. You will get the active address from the wallet after it selects the option. You can do it like this:

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";

const {address} = await StellarWalletsKit.authModal();
After the user has picked the wallet and you have received the address, the kit will keep it until the user calls the disconnect button from the profile modal. So the next time the user loads the website, you won't need to open the Auth modal and instead can just request get the address directly.

Auth modal params

export type AuthModalParams = {
container?: HTMLElement;
};
If you want to, you can define the container where the modal should be inserted; most likely, you won't need to do this, but the option is there in case it is needed.

# Get Wallet Address

To get the current active address you can do it with:

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";

const {address} = await StellarWalletsKit.getAddress();
Keep in mind that if no active address is available this method will throw an error.

Pager

# Get a signature

If you need to request the user to sign a transaction, an auth entry or a message you can do it with three different methods. Call them like this:

const {signedTxXdr} = await StellarWalletsKit.signTransaction(tx.toXDR(), {
networkPassphrase: Networks.PUBLIC,
address: 'THE_STELLAR_ADDRESS',
});
IMPORTANT: Not all wallets support all methods, for example you can not request to sign a message or an authorization entry with Wallet Connect.

These are the current methods the kit support related to signatures:

interface StellarWalletsKit {
signTransaction(
xdr: string,
opts?: { networkPassphrase?: string; address?: string; path?: string; submit?: boolean; submitUrl?: string },
): Promise<{ signedTxXdr: string; signerAddress?: string }>;

signAuthEntry(
authEntry: string,
opts?: { networkPassphrase?: string; address?: string; path?: string },
): Promise<{ signedAuthEntry: string; signerAddress?: string }>;

signMessage(
message: string,
opts?: { networkPassphrase?: string; address?: string; path?: string },
): Promise<{ signedMessage: string; signerAddress?: string }>
}
Pager

# Kit events

You can listen to updates from the kit, like for example if the user has disconnected from the kit, if it updated the address or picked another wallet. To do that, use the on method of the kit like this:

import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";

const sub = StellarWalletsKit.on(KitEventType.STATE_UPDATED, event => {
console.log(`Address updated:`, event.payload.address);
});

// To unsubscribe from the updates, do this: `sub()`
The available event types and expected payloads are:

export enum KitEventType {
STATE_UPDATED = "STATE_UPDATE",
WALLET_SELECTED = "WALLET_SELECTED",
DISCONNECT = "DISCONNECT",
}

export type KitEventStateUpdated = {
eventType: KitEventType.STATE_UPDATED;
payload: {
address: string | undefined;
networkPassphrase: string;
};
};
export type KitEventWalletSelected = {
eventType: KitEventType.WALLET_SELECTED;
payload: {
id: string | undefined;
};
};
export type KitEventDisconnected = {
eventType: KitEventType.DISCONNECT;
payload: Record<PropertyKey, never>;
};

export type KitEvent = KitEventStateUpdated | KitEventWalletSelected | KitEventDisconnected;
Pager

# Wallet Connect

To import and include the module you can do it like this:

import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';
import { WalletConnectModule } from "@creit-tech/stellar-wallets-kit/modules/wallet-connect";

StellarWalletsKit.init({
modules: [
...defaultModules(),
new WalletConnectModule({
projectId: "YOUR_PROJECT_ID",
metadata: {
name: "YOUR_APP_NAME",
description: "DESCRIPTION_OF_YOUR_APP",
icons: [ "LOGO_OF_YOUR_APP" ],
url: 'YOUR_APP_URL',
}
}),
],
});
Required parameters
The WalletConnect library requires some parameters to be define before it can be loaded, here are the parameter your can provide:

import type { SignClientTypes } from "@walletconnect/types";
import type { CreateAppKit } from "@reown/appkit/core";

export type TWalletConnectModuleParams = {
projectId: string;
metadata: Required<CreateAppKit>["metadata"];
allowedChains?: WalletConnectTargetChain[];
signClientOptions?: SignClientTypes.Options;
appKitOptions?: CreateAppKit;
};

export enum WalletConnectTargetChain {
PUBLIC = "stellar:pubnet",
TESTNET = "stellar:testnet",
}

# Wallet Developers

If you're a wallet developer and you want your wallet to be added to the kit, you can do it by creating a "module" compatible with the kit.

This module needs to follow this interface:

/\*\*

- A module is a "plugin" we can use within the kit so is able to handle a
- specific type of wallet/service. There are some modules that are already
- in the kit but any wallet developer can create their own modules
  \*/
  export interface ModuleInterface {
  /\*\*
  - The Module type is used for filtering purposes, define the correct one in
  - your module so we display it accordingly
    \*/
    moduleType: ModuleType;

/\*\*

- This ID of the module, you should expose this ID as a constant variable
- so developers can use it to show/filter this module if they need to.
  \*/
  productId: string;

/\*\*

- This is the name the kit will show in the builtin Modal.
  \*/
  productName: string;

/\*\*

- This is the URL where users can either download, buy and just know how to
- get the product.
  \*/
  productUrl: string;

/\*\*

- This icon will be displayed in the builtin Modal along with the product name.
  \*/
  productIcon: string;

/\*\*

- This function should return true is the wallet is installed and/or available.
- If for example this wallet/service doesn't need to be installed to be used,
- return `true`.
-
- Important:
- Your wallet/library needs to be able to answer this function in less than 1000ms.
- Otherwise, the kit will show it as unavailable
  \*/
  isAvailable(): Promise<boolean>;

/\*\*

- This method is optional and is only used if the wallet can handle changes in its state.
- For example if the user changes the current state of the wallet like it switches to another network, this should be triggered
  \*/
  onChange?(callback: (event: IOnChangeEvent) => void): void;

/\*\*

- Function used to request the public key from the active account or
- specific path on a wallet.
-
- IMPORTANT: This method will do everything that is needed to get the address, in some wallets this could mean opening extra components for the user to pick (hardware wallets for example)
-
- @param params
- @param params.path - The path to tell the wallet which position to ask. This is commonly used in hardware wallets.
-
- @return Promise<{ address: string }>
  \*/
  getAddress(params?: { path?: string; skipRequestAccess?: boolean }): Promise<{ address: string }>;

/\*\*

- A function to request a wallet to sign a built transaction in its XDR mode
-
- @param xdr - A Transaction or a FeeBumpTransaction
- @param opts - Options compatible with https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md#signtransaction
- @param opts.networkPassphrase - The Stellar network to use when signing
- @param opts.address - The public key of the account that should be used to sign
- @param opts.path - This options is added for special cases like Hardware wallets
-
- @return Promise<{ signedTxXdr: string; signerAddress: string }>
  \*/
  signTransaction(
  xdr: string,
  opts?: {
  networkPassphrase?: string;
  address?: string;
  path?: string;
  submit?: boolean;
  submitUrl?: string;
  },
  ): Promise<{ signedTxXdr: string; signerAddress?: string }>;

/\*\*

- A function to request a wallet to sign an AuthEntry XDR.
-
- @param authEntry - An XDR string version of `HashIdPreimageSorobanAuthorization`
- @param opts - Options compatible with https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md#signauthentry
- @param opts.networkPassphrase - The Stellar network to use when signing
- @param opts.address - The public key of the account that should be used to sign
- @param opts.path - This options is added for special cases like Hardware wallets
-
- @return - Promise<{ signedAuthEntry: string; signerAddress: string }>
  \*/
  signAuthEntry(
  authEntry: string,
  opts?: {
  networkPassphrase?: string;
  address?: string;
  path?: string;
  },
  ): Promise<{ signedAuthEntry: string; signerAddress?: string }>;

/\*\*

- A function to request a wallet to sign an AuthEntry XDR.
-
- @param message - An arbitrary string rather than a transaction or auth entry
- @param opts - Options compatible with https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0043.md#signmessage
- @param opts.networkPassphrase - The Stellar network to use when signing
- @param opts.address - The public key of the account that should be used to sign
- @param opts.path - This options is added for special cases like Hardware wallets
-
- @return - Promise<{ signedMessage: string; signerAddress: string }>
  \*/
  signMessage(
  message: string,
  opts?: {
  networkPassphrase?: string;
  address?: string;
  path?: string;
  },
  ): Promise<{ signedMessage: string; signerAddress?: string }>;

/\*\*

- A function to request the current selected network in the wallet. This comes
- handy when you are dealing with a wallet that doesn't allow you to specify which network to use (For example Lobstr and Rabet)
-
- @return - Promise<{ network: string; networkPassphrase: string }>
  \*/
  getNetwork(): Promise<{ network: string; networkPassphrase: string }>;

/\*\*

- This method should be included if your wallet have some sort of async connection, for example WalletConnect
- Once this method is called, the module should clear all connections
  \*/
  disconnect?(): Promise<void>;
  }
  After your module is done, open a PR with the module and we will review. Make sure to list if your module requires some extra dependency like for example a polyfill of Buffer .

Pager

# Default Theme

The kit includes two default themes one for light and one for dark styles and can be imported and defined like this:

import { SwkAppDarkTheme } from "@creit-tech/stellar-wallets-kit/types";

StellarWalletsKit.init({theme: SwkAppDarkTheme});
If no theme is provided, the kit will use the default light theme.

Default light theme

export const SwkAppLightTheme: SwkAppTheme = {
"background": "#fcfcfcff",
"background-secondary": "#f8f8f8ff",
"foreground-strong": "#000000",
"foreground": "#161619ff",
"foreground-secondary": "#2d2d31ff",
"primary": "#3b82f6",
"primary-foreground": "#ffffff",
"transparent": "rgba(0, 0, 0, 0)",
"lighter": "#fcfcfc",
"light": "#f8f8f8",
"light-gray": "oklch(0.800 0.006 286.033)",
"gray": "oklch(0.600 0.006 286.033)",
"danger": "oklch(57.7% 0.245 27.325)",
"border": "rgba(0, 0, 0, 0.15)",
"shadow": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
"border-radius": "0.5rem",
"font-family": "sans-serif",
};

# Default dark theme

export const SwkAppDarkTheme: SwkAppTheme = {
"background": "oklch(0.333 0 89.876)",
"background-secondary": "oklch(0 0 0)",
"foreground-strong": "#fff",
"foreground": "oklch(0.985 0 0)",
"foreground-secondary": "oklch(0.97 0 0)",
"primary": "#e0e0e0",
"primary-foreground": "#1e1e1e",
"transparent": "rgba(0, 0, 0, 0)",
"lighter": "#fcfcfc",
"light": "#f8f8f8",
"light-gray": "oklch(0.800 0.006 286.033)",
"gray": "oklch(0.600 0.006 286.033)",
"danger": "oklch(57.7% 0.245 27.325)",
"border": "rgba(58,58,58,0.15)",
"shadow": "0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -4px rgba(255, 255, 255, 0.1)",
"border-radius": "0.5rem",
"font-family": "sans-serif",
};
Pager
