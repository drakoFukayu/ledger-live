import { TFunction } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ethereum/types";
export type StepId = "amount" | "connectDevice" | "confirmation";
export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: AccountLike;
  parentAccount: Account;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: (key: string, config?: unknown) => void;
  optimisticOperation: any;
  bridgeError: Error | undefined | null;
  transactionError: Error | undefined | null;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  onUpdateTransaction: (updater: any) => void;
};
export type St = Step<StepId, StepProps>;
