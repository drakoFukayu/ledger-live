import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { FTXProviders, getFTXURL } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { swapKYCSelector } from "~/renderer/reducers/settings";
import SwapConnectWidget from "../SwapConnectWidget";
import { WebviewTag } from "~/renderer/components/Web3AppWebview/types";

type Props = {
  onClose: () => void;
  provider: FTXProviders;
};

const FTXKYC = ({ onClose, provider }: Props) => {
  const webviewRef = useRef<WebviewTag | null>(null);
  const url = useMemo(
    () =>
      getFTXURL({
        type: "kyc",
        provider,
      }),
    [provider],
  );
  const swapKYC = useSelector(swapKYCSelector);
  const providerKYC = swapKYC?.[provider];
  const authToken = providerKYC?.id;
  const handleExecuteJavaScript = useCallback(() => {
    const webview = webviewRef.current;
    if (webview && authToken) {
      webview.executeJavaScript(`localStorage.setItem('authToken', "${authToken}")`);
    }
  }, [authToken]);
  useEffect(() => {
    const webview = webviewRef.current;
    if (webview && authToken) {
      webview.addEventListener("dom-ready", handleExecuteJavaScript);
    }
    return () => {
      if (webview && authToken) {
        webview.removeEventListener("dom-ready", handleExecuteJavaScript);
      }
    };
  }, [authToken, handleExecuteJavaScript]);
  return <SwapConnectWidget provider={provider} onClose={onClose} url={url} ref={webviewRef} />;
};
export default FTXKYC;
