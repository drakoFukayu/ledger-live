import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import type { Transaction as BitcoinTransaction } from "@ledgerhq/live-common/families/bitcoin/types";
import { CompositeScreenProps } from "@react-navigation/native";

import perFamily from "../generated/SendRowsFee";
import type { StackNavigatorProps } from "./RootNavigator/types/helpers";
import type { SendFundsNavigatorStackParamList } from "./RootNavigator/types/SendFundsNavigator";
import type { SignTransactionNavigatorParamList } from "./RootNavigator/types/SignTransactionNavigator";
import type { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";
import type { SwapNavigatorParamList } from "./RootNavigator/types/SwapNavigator";
import { EditTransactionParamList } from "../families/ethereum/EditTransactionNavigator";
import { ScreenName } from "../const";

type Props = {
  transaction: Transaction;
  account: AccountLike;
  parentAccount?: Account | null;
  status?: TransactionStatus;
  setTransaction: (..._: Array<Transaction>) => void;
  disabledStrategies?: Array<string>;
} & CompositeScreenProps<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      EthereumEditTransactionParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
<<<<<<< HEAD
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
=======
  | StackNavigatorProps<
      LendingEnableFlowParamsList,
      ScreenName.LendingEnableSummary
    >
  | StackNavigatorProps<
      LendingSupplyFlowNavigatorParamList,
      ScreenName.LendingSupplySummary
    >
  | StackNavigatorProps<
      LendingWithdrawFlowNavigatorParamList,
      ScreenName.LendingWithdrawSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>
  | StackNavigatorProps<EditTransactionParamList, ScreenName.SendSummary>,
>>>>>>> a325e08846 (rename edit tx navigator)
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default ({
  transaction,
  account,
  parentAccount,
  navigation,
  route,
  setTransaction,
  ...props
}: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  // eslint-disable-next-line no-prototype-builtins
  if (perFamily.hasOwnProperty(mainAccount.currency.family)) {
    const C = perFamily[mainAccount.currency.family as keyof typeof perFamily];
    // FIXME: looks like a hack, need to find how to handle networkInfo properly
    return (transaction as BitcoinTransaction)?.networkInfo ? (
      <C
        {...props}
        setTransaction={setTransaction}
        transaction={transaction}
        account={account}
        parentAccount={parentAccount}
        navigation={navigation}
        route={route}
      />
    ) : null;
  }

  return null;
};
