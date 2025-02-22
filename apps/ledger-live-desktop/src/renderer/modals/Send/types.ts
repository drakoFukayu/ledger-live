import { TFunction } from "react-i18next";
import { BigNumber } from "bignumber.js";
import {
  Account,
  AccountBridge,
  AccountLike,
  Operation,
  TransactionCommon,
} from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
export type StepId = "warning" | "recipient" | "amount" | "summary" | "device" | "confirmation";
export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  openedFromAccount: boolean;
  device: Device | undefined | null;
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  bridgePending: boolean;
  error: Error | undefined | null;
  optimisticOperation: Operation | undefined | null;
  closeModal: (a: void) => void;
  openModal: (b: string, a: any) => void;
  onChangeAccount: (b?: AccountLike | null, a?: Account | null) => void;
  onChangeTransaction: (a: AccountBridge<TransactionCommon> | Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onRetry: (a: void) => void;
  setSigned: (a: boolean) => void;
  signed: boolean;
  maybeRecipient?: string;
  onResetMaybeRecipient: () => void;
  maybeAmount?: BigNumber;
  onResetMaybeAmount: () => void;
  updateTransaction: (updater: any) => void;
  onConfirmationHandler: Function;
  onFailHandler: Function;
  currencyName: string | undefined | null;
  isNFTSend?: boolean;
  walletConnectProxy?: boolean;
  maybeNFTId?: string;
  maybeNFTCollection?: string;
  onChangeQuantities: (a: any) => void;
  onChangeNFT: (a: any) => void;
};
export type St = Step<StepId, StepProps>;
