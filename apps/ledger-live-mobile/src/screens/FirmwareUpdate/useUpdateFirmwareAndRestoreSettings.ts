import { log } from "@ledgerhq/logs";
import staxLoadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import staxFetchImage from "@ledgerhq/live-common/hw/staxFetchImage";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { createAction as createStaxLoadImageAction } from "@ledgerhq/live-common/hw/actions/staxLoadImage";
import { createAction as createStaxFetchImageAction } from "@ledgerhq/live-common/hw/actions/staxFetchImage";
import { createAction as createInstallLanguageAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { createAction as createConnectAppAction } from "@ledgerhq/live-common/hw/actions/app";
import { createAction as createConnectManagerAction } from "@ledgerhq/live-common/hw/actions/manager";
import { useUpdateFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import {
  UpdateFirmwareActionState,
  updateFirmwareActionArgs,
} from "@ledgerhq/live-common/deviceSDK/actions/updateFirmware";
import { Observable } from "rxjs";
import { useCallback, useMemo, useEffect, useState } from "react";
import { DeviceInfo, idsToLanguage, languageIds } from "@ledgerhq/types-live";

export type FirmwareUpdateParams = {
  device: Device;
  deviceInfo: DeviceInfo;
  updateFirmwareAction?: (
    args: updateFirmwareActionArgs,
  ) => Observable<UpdateFirmwareActionState>;
};

export type UpdateStep =
  | "start"
  | "appsBackup"
  | "imageBackup"
  | "firmwareUpdate"
  | "languageRestore"
  | "imageRestore"
  | "appsRestore"
  | "completed";

const installLanguageAction = createInstallLanguageAction(installLanguage);
const staxLoadImageAction = createStaxLoadImageAction(staxLoadImage);
const staxFetchImageAction = createStaxFetchImageAction(staxFetchImage);
const connectManagerAction = createConnectManagerAction(connectManager);
const connectAppAction = createConnectAppAction(connectApp);

export const useUpdateFirmwareAndRestoreSettings = ({
  updateFirmwareAction,
  device,
  deviceInfo,
}: FirmwareUpdateParams) => {
  const [updateStep, setUpdateStep] = useState<UpdateStep>("start");
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  // device action hooks only get triggered when they have a device passed to them
  // so in order to control the chaining of actions we use a step state and only
  // pass a device down the hook when we're at the correct step
  const connectManagerState = connectManagerAction.useHook(
    updateStep === "appsBackup" ? device : null,
    null,
  );

  const staxFetchImageRequest = useMemo(() => ({}), []);
  const staxFetchImageState = staxFetchImageAction.useHook(
    updateStep === "imageBackup" ? device : null,
    staxFetchImageRequest,
  );

  const { triggerUpdate, updateState: updateActionState } = useUpdateFirmware({
    deviceId: device?.deviceId ?? "",
    updateFirmwareAction,
  });

  const installLanguageRequest = useMemo(
    () => ({ language: idsToLanguage[deviceInfo.languageId ?? 0] }),
    [deviceInfo.languageId],
  );
  const installLanguageState = installLanguageAction.useHook(
    updateStep === "languageRestore" ? device : null,
    installLanguageRequest,
  );

  const staxLoadImageRequest = useMemo(
    () => ({
      hexImage: staxFetchImageState.hexImage ?? "",
      padImage: false,
    }),
    [staxFetchImageState.hexImage],
  );
  const staxLoadImageState = staxLoadImageAction.useHook(
    updateStep === "imageRestore" && staxFetchImageState.hexImage
      ? device
      : null,
    staxLoadImageRequest,
  );

  const restoreAppsRequest = useMemo(
    () => ({
      dependencies: installedApps.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
      allowPartialDependencies: true,
    }),
    [installedApps],
  );

  const restoreAppsState = connectAppAction.useHook(
    updateStep === "appsRestore" ? device : null,
    restoreAppsRequest,
  );

  const proceedToFirmwareUpdate = useCallback(() => {
    setUpdateStep("firmwareUpdate");
  }, []);

  const proceedToAppsBackup = useCallback(() => {
    setUpdateStep("appsBackup");
  }, []);

  const proceedToImageBackup = useCallback(() => {
    if (device.modelId === DeviceModelId.stax) {
      setUpdateStep("imageBackup");
    } else {
      proceedToFirmwareUpdate();
    }
  }, [device.modelId, proceedToFirmwareUpdate]);

  const proceedToUpdateCompleted = useCallback(() => {
    setUpdateStep("completed");
  }, []);

  const proceedToAppsRestore = useCallback(() => {
    if (installedApps.length > 0) {
      setUpdateStep("appsRestore");
    } else {
      proceedToUpdateCompleted();
    }
  }, [proceedToUpdateCompleted, installedApps.length]);

  const proceedToImageRestore = useCallback(() => {
    if (staxFetchImageState.hexImage) {
      setUpdateStep("imageRestore");
    } else {
      proceedToAppsRestore();
    }
  }, [proceedToAppsRestore, staxFetchImageState.hexImage]);

  const proceedToLanguageRestore = useCallback(() => {
    if (
      deviceInfo.languageId !== undefined &&
      deviceInfo.languageId !== languageIds.english
    ) {
      setUpdateStep("languageRestore");
    } else {
      proceedToImageRestore();
    }
  }, [proceedToImageRestore, deviceInfo.languageId]);

  // this hook controls the chaining of device actions by updating the current step
  // when needed. It basically implements a state macgine
  useEffect(() => {
    switch (updateStep) {
      case "start":
        proceedToAppsBackup();
        break;
      case "appsBackup":
        if (connectManagerState.result) {
          const installedAppsNames = connectManagerState.result.installed.map(
            ({ name }) => name,
          );
          setInstalledApps(installedAppsNames);
          proceedToImageBackup();
        }
        break;
      case "imageBackup":
        if (staxFetchImageState.imageFetched || staxFetchImageState.error) {
          if (staxFetchImageState.error)
            log(
              "FirmwareUpdate",
              "error while backing up stax image",
              staxFetchImageState.error,
            );
          proceedToFirmwareUpdate();
        }
        break;
      case "firmwareUpdate":
        if (updateActionState.step === "preparingUpdate") {
          triggerUpdate();
        } else if (updateActionState.step === "firmwareUpdateCompleted") {
          proceedToLanguageRestore();
        }
        break;
      case "languageRestore":
        if (
          installLanguageState.languageInstalled ||
          installLanguageState.error
        ) {
          if (installLanguageState.error)
            log(
              "FirmwareUpdate",
              "error while restoring language",
              installLanguageState.error,
            );
          proceedToImageRestore();
        }
        break;
      case "imageRestore":
        if (
          staxLoadImageState.imageLoaded ||
          staxLoadImageState.error ||
          !staxFetchImageState.hexImage
        ) {
          if (staxLoadImageState.error) {
            log(
              "FirmwareUpdate",
              "error while restoring stax image",
              staxLoadImageState.error,
            );
          }
          proceedToAppsRestore();
        }
        break;
      case "appsRestore":
        if (restoreAppsState.opened || restoreAppsState.error) {
          if (restoreAppsState.error) {
            log(
              "FirmwareUpdate",
              "error while restoring apps",
              restoreAppsState.error,
            );
          }
          proceedToUpdateCompleted();
        }
        break;
      default:
        break;
    }
  }, [
    device.modelId,
    deviceInfo.languageId,
    connectManagerState.result,
    installLanguageState.error,
    installLanguageState.languageInstalled,
    proceedToFirmwareUpdate,
    proceedToAppsRestore,
    proceedToImageBackup,
    proceedToImageRestore,
    proceedToLanguageRestore,
    proceedToUpdateCompleted,
    staxFetchImageState.error,
    staxFetchImageState.imageFetched,
    staxLoadImageState.error,
    staxLoadImageState.imageLoaded,
    triggerUpdate,
    updateActionState.step,
    updateStep,
    restoreAppsState.error,
    restoreAppsState.opened,
  ]);

  return {
    updateStep,
    staxFetchImageState,
    updateActionState,
    staxLoadImageState,
    installLanguageState,
    restoreAppsState,
    retryUpdate: triggerUpdate,
    noOfAppsToReinstall: installedApps.length,
  };
};
