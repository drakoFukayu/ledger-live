import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box/Box";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import { FormLabel } from "./FormLabel";
import { toSelector } from "~/renderer/actions/swap";
import { useSelector } from "react-redux";
import {
  usePickDefaultCurrency,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  SwapSelectorStateType,
  SwapTransactionType,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type Props = {
  fromAccount: SwapSelectorStateType["account"];
  toAccount: SwapSelectorStateType["account"];
  toCurrency: SwapSelectorStateType["currency"];
  setToCurrency: SwapTransactionType["setToCurrency"];
  toAmount: SwapSelectorStateType["amount"];
  provider: string | undefined | null;
  loadingRates: boolean;
  updateSelectedRate: SwapDataType["updateSelectedRate"];
};

function ToRow({ toCurrency, setToCurrency, fromAccount, updateSelectedRate }: Props) {
  const fromCurrencyId = fromAccount ? getAccountCurrency(fromAccount).id : undefined;
  const allCurrencies = useSelector(toSelector)(fromCurrencyId);

  const currencies = useSelectableCurrencies({
    allCurrencies,
  }).filter(currency => currency.type === "CryptoCurrency" && currency.family === "ethereum");

  usePickDefaultCurrency(currencies, toCurrency, setToCurrency);

  const setCurrencyAndTrack = (currency: CryptoOrTokenCurrency | null | undefined) => {
    updateSelectedRate();

    setToCurrency(currency || undefined);
  };

  return (
    <>
      <Box horizontal color={"palette.text.shade40"} fontSize={3} mb={1}>
        <FormLabel>
          <Trans i18nKey="swap2.form.to.title" />
        </FormLabel>
      </Box>
      <Box horizontal>
        <Box flex="1" data-test-id="destination-currency-dropdown">
          <SelectCurrency
            currencies={currencies}
            onChange={setCurrencyAndTrack}
            value={toCurrency}
            isDisabled={!fromAccount}
          />
        </Box>
      </Box>
    </>
  );
}

export default React.memo<Props>(ToRow);
