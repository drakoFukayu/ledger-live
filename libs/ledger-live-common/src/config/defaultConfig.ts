import { CosmosCurrencyConfig } from "../families/cosmos/types";

const defaultConfig = {
  config: {
    cosmos: {
      axelar: {
        lcd: "https://axelar-api.polkachu.com",
        minGasPrice: 0.07,
      },
      cosmos: {
        lcd: "https://cosmoshub4.coin.ledger.com",
        ledgerValidator: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
        minGasPrice: 0.025,
      },
      desmos: {
        lcd: "https://desmos-api.ibs.team",
        minGasPrice: 0.0025,
      },
      nyx: {
        lcd: "https://api.nyx.nodes.guru",
        minGasPrice: 0,
      },
      onomy: {
        lcd: "https://rest-mainnet.onomy.io",
        minGasPrice: 0.003,
      },
      osmo: {
        lcd: "https://osmosis-api.polkachu.com",
        ledgerValidator: "osmovaloper17cp6fxccqxrpj4zc00w2c7u6y0umc2jajsyc5t",
        minGasPrice: 0.025,
      },
      persistence: {
        lcd: "https://rest-persistence.architectnodes.com",
        minGasPrice: 0.025,
      },
      quicksilver: {
        lcd: "https://lcd.quicksilver.zone",
        minGasPrice: 0.0025,
      },
      secret_network: {
        lcd: "https://lcd.secret.express",
        minGasPrice: 0.25,
      },
      stargaze: {
        lcd: "https://stargaze-api.polkachu.com",
        minGasPrice: 0.0025,
      },
      umee: {
        lcd: "https://umee-api.polkachu.com",
        minGasPrice: 0.1,
      },
    } as { [currency: string]: CosmosCurrencyConfig },
  },
};

export default defaultConfig;
