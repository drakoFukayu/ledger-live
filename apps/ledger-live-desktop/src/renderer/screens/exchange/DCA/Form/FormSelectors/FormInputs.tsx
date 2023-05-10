import React from "react";
import Box, { Tabbable } from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ArrowsUpDown from "~/renderer/icons/ArrowsUpDown";
import styled from "styled-components";
import FromRow from "./FromRow";
import ToRow from "./ToRow";
import {
  SwapSelectorStateType,
  SwapTransactionType,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";

import Input from "~/renderer/components/Input";
import Hide from "~/renderer/components/MainSideBar/Hide";
import BigNumber from "bignumber.js";

type FormInputsProps = {
  fromAccount: SwapSelectorStateType["account"];
  toAccount: SwapSelectorStateType["account"];
  fromAmount: SwapSelectorStateType["amount"];
  toCurrency: SwapSelectorStateType["currency"];
  toAmount: SwapSelectorStateType["amount"];
  setFromAccount: SwapTransactionType["setFromAccount"];
  setFromAmount: SwapTransactionType["setFromAmount"];
  setToCurrency: SwapTransactionType["setToCurrency"];
  toggleMax: SwapTransactionType["toggleMax"];
  reverseSwap: SwapTransactionType["reverseSwap"];
  isMaxEnabled?: boolean;
  fromAmountError?: Error;
  isSwapReversable: boolean;
  provider: string | undefined | null;
  loadingRates: boolean;
  isSendMaxLoading: boolean;
  interval: "10" | "daily" | "weekly";
  onSetInterval: (interval: "10" | "daily" | "weekly") => void;
  updateSelectedRate: SwapDataType["updateSelectedRate"];
  amount: BigNumber | undefined;
  setAmount: (amount: string) => void;
};

const RoundButton = styled(Button)`
  padding: 8px;
  border-radius: 9999px;
  height: initial;
`;

const Main = styled.section`
  display: flex;
  flex-direction: column;
  row-gap: 12px;
  margin-bottom: 5px;
`;

type SwapButtonProps = {
  onClick: SwapTransactionType["reverseSwap"];
  disabled: boolean;
};

function SwapButton({ onClick, disabled }: SwapButtonProps): JSX.Element {
  return (
    <RoundButton
      lighterPrimary
      disabled={disabled}
      onClick={onClick}
      data-test-id="swap-reverse-pair-button"
    >
      <ArrowsUpDown size={14} />
    </RoundButton>
  );
}

export default function FormInputs({
  fromAccount = undefined,
  toAccount,
  fromAmount = undefined,
  isMaxEnabled = false,
  setFromAccount,
  setFromAmount,
  toCurrency,
  toAmount,
  setToCurrency,
  toggleMax,
  fromAmountError,
  isSwapReversable,
  provider,
  loadingRates,
  isSendMaxLoading,
  updateSelectedRate,
  interval,
  onSetInterval,
  amount,
  setAmount,
}: FormInputsProps) {
  return (
    <Main>
      <Box style={{ gap: 8 }}>
        <FromRow
          fromAccount={fromAccount}
          setFromAccount={setFromAccount}
          fromAmount={fromAmount}
          setFromAmount={setFromAmount}
          isMaxEnabled={isMaxEnabled}
          toggleMax={toggleMax}
          fromAmountError={fromAmountError}
          provider={provider}
          isSendMaxLoading={isSendMaxLoading}
          updateSelectedRate={updateSelectedRate}
        />
        <Input
          placeholder="Amount"
          value={amount ? amount.toString() : ""}
          onChange={amount => setAmount(amount || "0")}
        />
      </Box>
      <Hide visible={false}>
        <SwapButton disabled={!isSwapReversable} onClick={() => null} />
      </Hide>
      <Box
        style={{
          marginTop: "-23px",
        }}
      >
        <ToRow
          toCurrency={toCurrency}
          setToCurrency={setToCurrency}
          toAmount={toAmount}
          fromAccount={fromAccount}
          provider={provider}
          toAccount={toAccount}
          loadingRates={loadingRates}
          updateSelectedRate={updateSelectedRate}
        />
      </Box>

      <Box horizontal justifyContent="center" flexWrap="wrap" gap="16px">
        <FrequencyWrapper
          id="10"
          color={interval === "10" ? "palette.primary.main" : "palette.primary.c10"}
          onClick={() => onSetInterval("10")}
        >
          Every 10 sec
        </FrequencyWrapper>
        <FrequencyWrapper
          id="daily"
          color={interval === "daily" ? "palette.primary.main" : "palette.primary.c10"}
          onClick={() => onSetInterval("daily")}
        >
          Daily
        </FrequencyWrapper>
        <FrequencyWrapper
          id="weekly"
          color={interval === "weekly" ? "palette.primary.main" : "palette.primary.c10"}
          onClick={() => onSetInterval("weekly")}
        >
          Weekly
        </FrequencyWrapper>
      </Box>
    </Main>
  );
}

const FrequencyWrapper = styled(Tabbable)`
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  border: ${p =>
    `1px solid ${
      p?.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.divider
    }`};
  padding: 20px 16px;
  font-family: "Inter";
  border-radius: 4px;
  width: 140px;
  ${p => (p.disabled ? `background: ${p.theme.colors.palette.background.default};` : "")};

  &:hover {
    cursor: ${p => (p.disabled ? "unset" : "pointer")};
  }
`;
