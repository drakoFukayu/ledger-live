import { checkQuote } from "@ledgerhq/live-common/exchange/swap/index";
import {
  usePollKYCStatus,
  useSwapProviders,
  useSwapTransaction,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  getKYCStatusFromCheckQuoteStatus,
  KYC_STATUS,
  shouldShowKYCBanner,
  shouldShowLoginBanner,
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { setSwapKYCStatus } from "~/renderer/actions/settings";
import {
  providersSelector,
  rateSelector,
  resetSwapAction,
  updateProvidersAction,
  updateRateAction,
  updateTransactionAction,
} from "~/renderer/actions/swap";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box";
import ButtonBase from "~/renderer/components/Button";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { swapKYCSelector } from "~/renderer/reducers/settings";
import KYC from "../KYC";
import Login from "../Login";
import MFA from "../MFA";
import { trackSwapError, useGetSwapTrackingProperties } from "../utils/index";
import SwapFormSelectors from "./FormSelectors";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import debounce from "lodash/debounce";
import { AccountLike, Feature } from "@ledgerhq/types-live";
import {
  ValidCheckQuoteErrorCodes,
  ValidKYCStatus,
} from "@ledgerhq/live-common/exchange/swap/types";
import BigNumber from "bignumber.js";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { DCAHistory } from "..";
const Wrapper = styled(Box).attrs({
  p: 20,
  mt: 12,
})`
  row-gap: 2rem;
  max-width: 37rem;
`;

const idleTime = 60 * 60000; // 1 hour

const Button = styled(ButtonBase)`
  justify-content: center;
`;
export const useProviders = () => {
  const dispatch = useDispatch();
  const { providers, error: providersError } = useSwapProviders();
  const storedProviders = useSelector(providersSelector);
  useEffect(() => {
    if (providers) dispatch(updateProvidersAction(providers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);
  useEffect(() => {
    if (providersError) dispatch(resetSwapAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersError]);
  return {
    storedProviders,
    providers,
    providersError,
  };
};

type Props = {
  addHistory: (newDCA: DCAHistory) => void;
};

type Interval = "10" | "daily" | "weekly";

const DCAForm = ({ addHistory }: Props) => {
  // FIXME: should use enums for Flow and Banner values
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"10" | "daily" | "weekly">("10");

  const swapDefaultTrack = useGetSwapTrackingProperties();
  const [idleState, setIdleState] = useState(false);
  const [error, setError] = useState<ValidCheckQuoteErrorCodes | undefined>();
  const dispatch = useDispatch();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const accounts = useSelector(shallowAccountsSelector);
  const { storedProviders, providersError } = useProviders();
  const exchangeRate = useSelector(rateSelector);
  const setExchangeRate = useCallback(
    rate => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );
  const showDexQuotes: Feature<boolean> | null = useFeature("swapShowDexQuotes");
  const onNoRates = useCallback(
    ({ toState }) => {
      track("error_message", {
        message: "no_rates",
        page: "Page Swap Form",
        ...swapDefaultTrack,
        sourceCurrency: toState.currency?.name,
      });
    },
    [swapDefaultTrack],
  );

  const swapTransaction = useSwapTransaction({
    accounts,
    setExchangeRate,
    onNoRates,
    ...(locationState as object),
    providers: storedProviders || undefined,
    includeDEX: showDexQuotes?.enabled || false,
  });
  const swapError = swapTransaction.fromAmountError;
  const swapKYC = useSelector(swapKYCSelector);
  const provider = exchangeRate?.provider;
  const providerKYC = (provider && swapKYC?.[provider]) || undefined;
  const kycStatus =
    (providerKYC && (providerKYC?.status as ValidKYCStatus | undefined)) || undefined;
  const idleTimeout = useRef<NodeJS.Timeout | undefined>();

  // On provider change, reset banner and flow
  useEffect(() => {
    setCurrentBanner(null);
    setCurrentFlow(null);
    setError(undefined);
  }, [provider]);

  useEffect(() => {
    // In case of error, don't show  login, kyc or mfa banner
    if (error) {
      // Don't show any flow banner on error to avoid double banner display
      setCurrentBanner(null);
      return;
    }

    // Don't display login nor kyc banner if user needs to complete MFA
    if (currentBanner === "MFA") {
      return;
    }
    if (
      shouldShowLoginBanner({
        provider,
        token: providerKYC?.id,
      })
    ) {
      setCurrentBanner("LOGIN");
      return;
    }

    // we display the KYC banner component if partner requiers KYC and is not yet approved
    // we don't display it if user needs to login first
    if (
      currentBanner !== "LOGIN" &&
      shouldShowKYCBanner({
        provider,
        kycStatus,
      })
    ) {
      setCurrentBanner("KYC");
    }
  }, [error, provider, providerKYC?.id, kycStatus, currentBanner]);

  const refreshIdle = useCallback(() => {
    idleState && setIdleState(false);
    idleTimeout.current && clearInterval(idleTimeout.current);
    idleTimeout.current = setTimeout(() => {
      setIdleState(true);
    }, idleTime);
  }, [idleState]);

  useEffect(() => {
    if (swapTransaction.swap.rates.status === "success") {
      refreshIdle();
    }
  }, [refreshIdle, swapTransaction.swap.rates.status]);

  useEffect(() => {
    dispatch(updateTransactionAction(swapTransaction.transaction));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapTransaction.transaction]);

  useEffect(() => {
    // Whenever an account is added, reselect the currency to pick a default target account.
    // (possibly the one that got created)
    if (swapTransaction.swap.to.currency && !swapTransaction.swap.to.account) {
      swapTransaction.setToCurrency(swapTransaction.swap.to.currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  // FIXME: update usePollKYCStatus to use checkQuote for KYC status (?)
  usePollKYCStatus(
    {
      provider,
      kyc: providerKYC,
      onChange: res => {
        dispatch(
          setSwapKYCStatus({
            provider: provider!, // provider should be defined - onChange is not supposed to be called if it's not
            id: res?.id,
            status: res?.status,
          }),
        );
      },
    },
    [dispatch],
  );

  // Track errors
  useEffect(
    () => {
      swapError &&
        trackSwapError(swapError, {
          page: "Page Swap Form",
          ...swapDefaultTrack,
          sourcecurrency: swapTransaction.swap.from.currency?.name,
          provider,
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swapError],
  );

  // close login widget once we get a bearer token (i.e: the user is logged in)
  useEffect(() => {
    if (providerKYC?.id && currentFlow === "LOGIN") {
      setCurrentFlow(null);
    }
  }, [providerKYC?.id, currentFlow]);

  /**
   * FIXME
   * Too complicated, seems to handle to much things (KYC status + non KYC related errors)
   * KYC related stuff should be handled in usePollKYCStatus
   */
  useEffect(() => {
    if (
      !provider ||
      !providerKYC?.id ||
      !exchangeRate?.rateId ||
      currentFlow === "KYC" ||
      currentFlow === "MFA"
    ) {
      return;
    }
    const userId = providerKYC.id;
    const handleCheckQuote = async () => {
      const status = await checkQuote({
        provider,
        quoteId: exchangeRate.rateId,
        bearerToken: userId,
      });

      // User needs to complete MFA on partner own UI / dedicated widget
      if (status.codeName === "MFA_REQUIRED") {
        setCurrentBanner("MFA");
        return;
      } else {
        // No need to show MFA banner for other cases
        setCurrentBanner(null);
      }
      if (status.codeName === "RATE_VALID") {
        // If trade can be done and KYC already approved, we are good
        // PS: this can't be checked before the `checkQuote` call since a KYC status can become expierd
        if (kycStatus === KYC_STATUS.approved) {
          return;
        }

        // If status is ok, close login, kyc and mfa widgets even if open
        setCurrentFlow(null);
        dispatch(
          setSwapKYCStatus({
            provider,
            id: userId,
            status: KYC_STATUS.approved,
          }),
        );
        return;
      }

      // Handle all KYC related errors
      if (status.codeName.startsWith("KYC_")) {
        const updatedKycStatus = getKYCStatusFromCheckQuoteStatus(status);
        if (updatedKycStatus !== kycStatus) {
          dispatch(
            setSwapKYCStatus({
              provider,
              id: userId,
              status: updatedKycStatus,
            }),
          );
        }
        return;
      }

      // If user is unauthenticated, reset login and KYC state
      if (status.codeName === "UNAUTHENTICATED_USER") {
        dispatch(
          setSwapKYCStatus({
            provider,
            id: undefined,
            status: undefined,
          }),
        );
        return;
      }

      // If RATE_NOT_FOUND it means the quote as expired, so we need to refresh the rates
      if (status.codeName === "RATE_NOT_FOUND") {
        swapTransaction?.swap?.refetchRates();
        return;
      }

      // All other statuses are considered errors
      setError(status.codeName);
    };
    handleCheckQuote();
    /**
     * Remove `swapTransaction` from dependency list because it seems to mess up
     * with the `checkQuote` call (the endpoint gets called too often)
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerKYC, exchangeRate, dispatch, provider, kycStatus, currentFlow]);

  const isSwapReady =
    !error &&
    !swapTransaction.bridgePending &&
    swapTransaction.transaction &&
    !providersError &&
    !swapError &&
    !currentBanner &&
    swapTransaction.swap.to.account &&
    swapTransaction.swap.from.amount &&
    swapTransaction.swap.from.amount.gt(0);

  const onSubmit = (
    fromAddressId: string | undefined,
    fromCurrency: TokenCurrency | CryptoCurrency | undefined,
    toAddress: string | undefined,
    toCurrency: TokenCurrency | CryptoCurrency | undefined,
    amount: BigNumber | undefined,
    interval: Interval,
  ) => {
    const from = swapTransaction.swap.from;
    const fromAddress = from.parentAccount?.id || from.account?.id;

    addHistory({
      from: { currency: fromCurrency?.name, address: fromAddressId?.split(":")[3] },
      to: { currency: toCurrency?.name, address: toAddress?.split(":")[3] },
      amount: `${amount ? amount.toString() : "0"} ${fromCurrency?.units[0].code}`,
      interval,
    });

    history.push({
      // This looks like an issue, the proper signature is: push(path, [state]) - (function) Pushes a new entry onto the history stack
      // It seems possible to also pass a LocationDescriptorObject but it does not expect extra properties
      pathname: "/dca/history",
      state: {
        returnTo: "/dca",
        accountId: fromAddress,
      },
    });
  };

  const sourceAccount = swapTransaction.swap.from.account;
  const targetCurrency = swapTransaction.swap.to.currency;

  useEffect(() => {
    if (!exchangeRate) {
      // @ts-expect-error This seems like a mistake? updateSelectedRate expects an ExchangeRate
      swapTransaction.swap.updateSelectedRate({});
      return;
    }
    swapTransaction.swap.updateSelectedRate(exchangeRate);
    // suppressing as swapTransaction is not memoized and causes infinite loop
    // eslint-disable-next-line
  }, [exchangeRate]);

  const debouncedSetFromAmount = useMemo(
    () =>
      debounce((amount: BigNumber) => {
        swapTransaction.setFromAmount(amount);
      }, 400),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swapTransaction.setFromAmount],
  );

  switch (currentFlow) {
    case "LOGIN":
      return <Login provider={provider} onClose={() => setCurrentFlow(null)} />;
    case "KYC":
      return (
        <KYC
          provider={provider}
          onClose={() => {
            setCurrentFlow(null);
            /**
             * Need to reset current banner in order to not display a KYC
             * banner after completion of Wyre KYC
             */
            setCurrentBanner(null);
          }}
        />
      );
    case "MFA":
      return <MFA provider={provider} onClose={() => setCurrentFlow(null)} />;
    default:
      break;
  }

  const setFromAccount = (account: AccountLike | undefined) => {
    swapTransaction.setFromAccount(account);
  };

  const setToCurrency = (currency: TokenCurrency | CryptoCurrency | undefined) => {
    swapTransaction.setToCurrency(currency);
  };

  const toggleMax = () => {
    swapTransaction.toggleMax();
  };

  return (
    <Wrapper>
      <SwapFormSelectors
        fromAccount={sourceAccount}
        fromAmount={swapTransaction.swap.from.amount}
        toAccount={swapTransaction.swap.to.account}
        toCurrency={targetCurrency}
        toAmount={exchangeRate?.toAmount}
        setFromAccount={setFromAccount}
        setFromAmount={debouncedSetFromAmount}
        setToCurrency={setToCurrency}
        isMaxEnabled={swapTransaction.swap.isMaxEnabled}
        toggleMax={toggleMax}
        fromAmountError={swapError}
        isSwapReversable={swapTransaction.swap.isSwapReversable}
        reverseSwap={swapTransaction.reverseSwap}
        provider={provider}
        loadingRates={swapTransaction.swap.rates.status === "loading"}
        isSendMaxLoading={swapTransaction.swap.isMaxLoading}
        updateSelectedRate={swapTransaction.swap.updateSelectedRate}
        interval={selectedInterval}
        onSetInterval={setSelectedInterval}
        amount={swapTransaction.swap.from.amount}
        setAmount={amount => swapTransaction.setFromAmount(new BigNumber(amount))}
      />

      <Box>
        You will swap {swapTransaction.swap.from.amount?.toString() || "0"}{" "}
        {swapTransaction.swap.from.currency?.units[0].code} for the equivalent in{" "}
        {swapTransaction.swap.to.currency?.name}{" "}
        {selectedInterval === "10" ? "every 10 seconds" : selectedInterval}
      </Box>

      <Box>
        <Button
          primary
          disabled={!isSwapReady}
          onClick={() =>
            onSubmit(
              swapTransaction.swap.from.account?.id,
              swapTransaction.swap.from.currency,
              swapTransaction.swap.to.account?.id,
              swapTransaction.swap.to.currency,
              swapTransaction.swap.from.amount,
              selectedInterval,
            )
          }
          data-test-id="exchange-button"
        >
          Launch DCA
        </Button>
      </Box>
    </Wrapper>
  );
};

export default DCAForm;
