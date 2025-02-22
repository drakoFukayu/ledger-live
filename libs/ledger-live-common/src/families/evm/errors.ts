import { createCustomErrorClass } from "@ledgerhq/errors";

export const EtherscanAPIError = createCustomErrorClass("EtherscanAPIError");
export const GasEstimationError = createCustomErrorClass("GasEstimationError");
export const InsufficientFunds = createCustomErrorClass("InsufficientFunds");
