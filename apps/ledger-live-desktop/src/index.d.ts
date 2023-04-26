declare const __APP_VERSION__: string;
declare const INDEX_URL: string;
declare const __SENTRY_URL__: string;
declare const __APP_VERSION__: string;
declare const __GIT_REVISION__: string;
declare const __PRERELEASE__: string;
declare const __CHANNEL__: string;
declare const __static: string;

declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.webm";

type ReplaySubject = import("rxjs").ReplaySubject;
type ListAppResult = import("@ledgerhq/live-common/apps/types").ListAppsResult;
type TransactionRaw = import("@ledgerhq/live-common/generated/types").TransactionRaw;
type Transaction = import("@ledgerhq/live-common/generated/types").Transaction;

interface RawEvents {
  [key: string]: RawEvents | RawEvents[];
}

declare namespace Electron {
  interface BrowserWindow {
    name?: string;
  }

  interface App {
    dirname?: string;
  }
}

interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;

  api?: {
    appLoaded: () => void;
    reloadRenderer: () => void;
    openWindow: (id: number) => void;
  };

  // for debugging purposes
  // eslint-disable-next-line
  ledger: any;

  // used for the analytics, initialized in the index.html
  // eslint-disable-next-line
  analytics: any;

  // for mocking purposes apparently?
  // eslint-disable-next-line
  mock: {
    fromTransactionRaw: (rawTransaction: TransactionRaw) => Transaction;
    events: {
      test: number;
      queue: Record<string, unknown>[];
      history: Record<string, unknown>[];
      subject: ReplaySubject;
      parseRawEvents: (rawEvents: RawEvents, maybeKey?: string) => unknown;
      emitter: any;
      mockDeviceEvent: (...args: RawEvents[]) => void;
      exposed: {
        mockListAppsResult: (
          appDesc: string,
          installedDesc: string,
          deviceInfo: import("@ledgerhq/types-live").DeviceInfo,
          deviceModelId?: import("@ledgerhq/types-devices").DeviceModelId,
        ) => ListAppResult;
        deviceInfo155: any;
      };
    };
  };
}
