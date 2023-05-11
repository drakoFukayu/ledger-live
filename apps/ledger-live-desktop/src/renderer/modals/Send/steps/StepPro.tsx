import React, { useCallback, useEffect, useState } from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { Alert, Divider, Flex, Text } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Label from "~/renderer/components/Label";
import Item from "./Pro/Item";
import axios from "axios";
import { getCryptoCurrencyById } from "@ledgerhq/coin-framework/currencies";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { fromOperationRaw } from "@ledgerhq/live-common/account/index";
import { from } from "rxjs";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import { OperationRaw } from "@ledgerhq/types-live";

const urlBase = "https://ledger-live-pro.minivault.ledger-sbx.com/router";
const myPubKey =
  process.env.PUBKEY || "2cdfa3ff8cf9b7cfe4d61d21dea82c20f83f43761f44b4c4daede52f9873e2a68";
const org = process.env.ORG || "demo_hk7";

const StepPro = ({
  status,
  selectedProIndex,
  setSelectedProIndex,
  pending,
  setPending,
  account,
  parentAccount,
  approvalData,
  setApprovalData,
  setApproved,
  approved,
  setApproving,
  transaction,
  transitionTo,
  onTransactionError,
  onOperationBroadcasted,
  approving,
}: StepProps) => {
  const [signature, setSignature] = useState("");
  const [signedShit, setSignedShit] = useState("");
  const [finalAPDUS, setFinalAPDUS] = useState<string[] | undefined>([]);
  const [parsedOperation, setParsedOperation] = useState<any>();

  const broadcast = useBroadcast({
    account,
    parentAccount,
  });

  const wrappedOnSetSelectedProIndex = useCallback(
    newIndex => {
      // Toggle if reclicked;
      setSelectedProIndex(selectedProIndex === newIndex ? null : newIndex);
    },
    [selectedProIndex, setSelectedProIndex],
  );

  const fetchDashboard = useCallback(() => {
    let removed = false;
    async function asyncFetch() {
      axios
        .get(`${urlBase}/${org}/dashboard`)
        .then(response => {
          if (removed) return;
          const transactions = response.data.pending_transactions;
          const pendingTransactions = transactions.map(transaction => {
            return {
              memo: transaction.memo,
              hash: transaction.hash,
              raw_tx: transaction.raw_tx,
              validators: transaction.approvals,
            };
          });
          setPending(pendingTransactions);

          const approvedTransactions = response.data.broadcasted_transactions.map(transaction => {
            return {
              memo: transaction.memo,
              hash: transaction.hash,
              validators: transaction.approvals,
            };
          });
          setApproved(approvedTransactions);
        })
        .catch(error => {
          console.error(error);
        });
    }

    asyncFetch();
    return () => {
      removed = true;
    };
  }, [setApproved, setPending]);

  useEffect(() => {
    if (
      !finalAPDUS ||
      finalAPDUS.length === 0 ||
      selectedProIndex === null ||
      selectedProIndex === undefined
    )
      return;

    let unmounted = false;

    async function sendApdus() {
      // Send the data to the device
      let signature: any;
      if (!finalAPDUS) return;

      for (let i = 0; i < finalAPDUS.length; i++) {
        if (unmounted) return;

        signature = await withDevice("")(transport => {
          console.log("APDU <=", finalAPDUS[i]);
          const apdu = Buffer.from(finalAPDUS[i], "hex");
          if (!apdu) return;
          return from(transport.exchange(apdu));
        }).toPromise();
        console.log("APDU =>", signature.toString("hex"));
      }

      if (unmounted) return;

      // console.log("wadus", { parsedOperation });
      // parsedOperation.date = new Date().toISOString();

      // const operation = fromOperationRaw(
      //   parsedOperation as OperationRaw,
      //   "js:2:cosmos:cosmos174fmh8kscmyckzet8zelrr490yz85p5kmpgjr5:", // Hardcoded because no time
      // );

      // console.log("wadus", { operation });
      const rawTx = pending[selectedProIndex || 0].raw_tx;
      // broadcast({ operation, signature }).then(
      //   operation => {
      //     onOperationBroadcasted(operation);
      //     transitionTo("confirmation");
      //   },
      //   error => {
      //     onTransactionError(error);
      //     transitionTo("confirmation");
      //   },
      // );

      // Tell backend we are done.
      const postData = {
        pub_key: myPubKey,
        raw_tx: rawTx,
      };

      console.log("DONE", { postData });

      axios.post(`${urlBase}/${org}/transaction/DONE`, postData);
      console.log("DONE", { postData });
      setSignedShit(signature);
      setFinalAPDUS(undefined);
    }
    sendApdus();
    return () => {
      unmounted = true;
    };
  }, [
    account,
    broadcast,
    finalAPDUS,
    onOperationBroadcasted,
    onTransactionError,
    parsedOperation,
    pending,
    selectedProIndex,
    transitionTo,
  ]);

  useEffect(() => {
    // We are approving, we know the apdus that we need to send and we hope there's a device
    // connected at this point, just send the apdus and get the response. With that response
    // we can submit it to the backend again.
    if (!approving || !pending || selectedProIndex === null || selectedProIndex === undefined)
      return;

    const rawTx = pending[selectedProIndex].raw_tx;
    let finished = false;
    // Straight away try to send apdus to the device and get the response a signer.
    console.log("should send", rawTx);
    async function sendApdus() {
      let signature: any = "";
      for (let i = 0; i < rawTx.length; i++) {
        if (finished) return;
        signature = await withDevice("")(transport => {
          console.log("sending", rawTx[i]);
          return from(transport.exchange(Buffer.from(rawTx[i], "hex")));
        }).toPromise();
      }

      // TODO on the last one, set some flag to reflect in the UI that we need to approve
      const postData = {
        pub_key: myPubKey,
        raw_tx: rawTx,
        signature: signature.toString("hex"),
      };

      console.log(postData);

      axios
        .post(`${urlBase}/${org}/transaction/approve`, postData)
        .then(response => {
          fetchDashboard();
          setApproving(false);

          // The third approval returns an apdu array, if it's present, we can
          // send them to get a signed transaction and broadcast straightaway.
          if (response.data.apdus) {
            setFinalAPDUS(response.data.apdus);
            setParsedOperation(response.data.operation);
          }
        })
        .catch(error => {
          console.error(error);
        });

      setSignature(signature.toString("hex"));
      // No error handling, but we need to send the approval thingie now
    }
    sendApdus();

    return () => {
      console.log("unmounting");
      finished = true;
    };
  }, [approving, fetchDashboard, pending, selectedProIndex, setApproving]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!approvalData) return;
    // Once we have the approval data, notify the backend. For the approval flow we already have
    // all the information and just need to send the apdus and get the response, so it's going to
    // be a separate step, or handled here, no idea.
    const data = JSON.parse(approvalData);

    // eslint-disable-next-line camelcase
    const raw_tx = data.rawApdus.reverse();

    const postData = {
      memo: "A unique identifier for the tx",
      pub_key: myPubKey,
      raw_tx,
      signature: data.signatureResponse,
    };

    axios
      .post(`${urlBase}/${org}/transaction/initiate`, postData)
      .then(response => {
        // FIXME, do we need to do anything with the response?
        fetchDashboard();
      })
      .catch(error => {
        console.error(error);
      });

    setApprovalData(undefined);
  }, [approvalData, fetchDashboard, setApprovalData]);

  if (!status) return null;

  return (
    <Box flow={4}>
      {signedShit ? (
        <Flex flexDirection="column" flex={1}>
          <Alert type="success" title="Transaction signed in quorum awesomely" />
          <Text mt={4} textAlign="center" variant="h2" style={{ wordBreak: "break-all" }}>
            {signedShit}
          </Text>
        </Flex>
      ) : approving ? (
        <Alert type="secondary" title={signature || "Approve on your device"} />
      ) : (
        <>
          {approvalData ? (
            <Flex flexDirection="column" flex={1}>
              <Alert
                type="warning"
                title="This is the device response, no idea what to do with it."
              />
              <Text mt={4} variant="body" style={{ wordBreak: "break-all" }}>
                {approvalData}
              </Text>
            </Flex>
          ) : (
            <Box mt={5}>
              {pending.length ? (
                <>
                  {" "}
                  <Label>{"Pending approvals"}</Label>
                  {pending.map(({ memo, hash, validators }, index) => (
                    <>
                      <Item
                        alreadyApproved={validators.some(
                          validator => validator.device === myPubKey,
                        )}
                        isSelected={selectedProIndex === index}
                        key={hash}
                        hash={hash}
                        memo={memo}
                        validators={validators}
                        onClick={() => wrappedOnSetSelectedProIndex(index)}
                      />
                      {index === pending.length - 1 ? null : <Divider />}
                    </>
                  ))}
                </>
              ) : (
                <Alert type="info" title="There are no pending approvals, try creating one" />
              )}
              {approved.length ? (
                <Box mt={5}>
                  <Label>{"Broadcasted:"}</Label>
                  {approved.map(({ memo, hash, validators }, index) => (
                    <>
                      <Item
                        alreadyApproved={validators.some(
                          validator => validator.device === myPubKey,
                        )}
                        isSelected={selectedProIndex === index}
                        key={hash}
                        hash={hash}
                        memo={memo}
                        validators={validators}
                        onClick={() => wrappedOnSetSelectedProIndex(index)}
                      />
                      {index === approved.length - 1 ? null : <Divider />}
                    </>
                  ))}
                </Box>
              ) : null}
              <Text onClick={fetchDashboard}>{"Refresh"}</Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export const StepProFooter = ({
  selectedProIndex,
  setProInitiateData,
  transitionTo,
  closeModal,
  setApproving,
  approving,
}: StepProps) => {
  const dispatch = useDispatch();

  const onApprove = async () => {
    setApproving(true);
  };

  const onAddAccount = useCallback(() => {
    // Simply close this modal and start the add account one with a pro flag,
    // this means the account will be marked as a pro account and will be
    // selectable from the pro shit menu.
    closeModal();
    dispatch(
      openModal("MODAL_ADD_ACCOUNTS", {
        currency: getCryptoCurrencyById("cosmos"),
        pro: true,
      }),
    );
  }, [closeModal, dispatch]);

  const onNewTransaction = useCallback(() => {
    // The API call is done when we get the data from the device, not now.
    setProInitiateData("something");
    transitionTo("recipient"); // We will follow a normal send flow until the device step.
  }, [setProInitiateData, transitionTo]);

  if (approving) return null;

  return (
    <Flex justifyContent="space-between">
      <Button id={"send-pro-continue-button"} mr={2} onClick={onAddAccount}>
        {"Add PRO account"}
      </Button>
      {selectedProIndex !== null ? (
        <Button id={"send-pro-continue-button"} primary onClick={onApprove}>
          {"Approve operation"}
        </Button>
      ) : (
        <Button id={"send-pro-continue-button"} primary onClick={onNewTransaction}>
          {"New transaction"}
        </Button>
      )}
    </Flex>
  );
};

export default withV3StyleProvider(StepPro);
