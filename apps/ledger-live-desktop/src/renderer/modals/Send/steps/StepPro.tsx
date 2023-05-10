import React, { useState, useCallback, useEffect } from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { Alert, Divider, Flex } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Label from "~/renderer/components/Label";
import Item from "./Pro/Item";
import axios from "axios";
import { getCryptoCurrencyById } from "@ledgerhq/coin-framework/currencies";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";

const myPubKey = "2cdfa3ff8cf9b7cfe4d61d21dea82c20f83f43761f44b4c4daede52f9873e2a68";
const org = "test_hk_4";

const StepPro = ({
  status,
  selectedProIndex,
  setSelectedProIndex,
  pending,
  setPending,
  approvalData,
}: StepProps) => {
  const wrappedOnSetSelectedProIndex = useCallback(
    newIndex => {
      // Toggle if reclicked;
      setSelectedProIndex(selectedProIndex === newIndex ? null : newIndex);
    },
    [selectedProIndex, setSelectedProIndex],
  );

  useEffect(() => {
    axios
      .get(`https://ledger-live-pro.minivault.ledger-sbx.com/router/${org}/dashboard`)
      .then(response => {
        console.log(response.data);
        const transactions = response.data.pending_transactions;
        const pendingTransactions = transactions.map(transaction => {
          return {
            memo: transaction.memo,
            hash: transaction.raw_tx,
            validators: [transaction.approvals.length, 3],
          };
        });
        console.log(pendingTransactions);
        setPending(pendingTransactions);
      })
      .catch(error => {
        console.error(error);
      });
  }, [setPending]);

  if (!status) return null;

  return (
    <Box flow={4}>
      {/* <Alert type="secondary" title="Below is a summary of your pending approvals" /> */}
      {approvalData ? (
        <div>{approvalData}</div>
      ) : (
        <Box mt={5}>
          {pending.length ? (
            <>
              {" "}
              <Label>{"Pending approvals"}</Label>
              {pending.map(({ memo, memo2, hash, validators }, index) => (
                <>
                  <Item
                    isSelected={selectedProIndex === index}
                    key={hash}
                    hash={hash}
                    memo={memo}
                    memo2={memo2}
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
        </Box>
      )}
    </Box>
  );
};

export const StepProFooter = ({
  selectedProIndex,
  setProInitiateData,
  transitionTo,
  pending,
  closeModal,
}: StepProps) => {
  const dispatch = useDispatch();
  const onApprove = async () => {
    // transitionTo("device"); to do when we have the app
    // api call after the device thinigy

    const data = {
      pub_key: myPubKey,
      raw_tx: pending[selectedProIndex].hash,
      signature: "0xsig3",
    };
    axios
      .post(
        `https://ledger-live-pro.minivault.ledger-sbx.com/router/${org}/transaction/approve`,
        data,
      )
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error(error);
      });
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
    // transitionTo("recipient"); to do when we have the app
    // api call after the device thinigy
    const data = {
      memo: "test aljdasjdtxe",
      pub_key: myPubKey,
      raw_tx: "0xoeesdfrere",
      signature: "0xsig3",
    };
    // Ignoring the axios call below, once we have that info we need, set it on the Body.tsx
    // file <- so we can retrieve it on further steps, then move to the recipient one and
    // continue building the transaction.
    setProInitiateData("something");
    transitionTo("recipient"); // We will follow a normal send flow until the device step.

    // axios
    //   .post(
    //     `https://ledger-live-pro.minivault.ledger-sbx.com/router/${org}/transaction/initiate`,
    //     data,
    //   )
    //   .then(response => {
    //     console.log(response.data);
    //     // then approve tx
    //     const approveData = {
    //       pub_key: myPubKey,
    //       raw_tx: "0xoeereresd",
    //       signature: "0xsig3w",
    //     };
    //     axios
    //       .post(
    //         `https://ledger-live-pro.minivault.ledger-sbx.com/router/${org}/transaction/initiate`,
    //         approveData,
    //       )
    //       .then(response => {
    //         console.log(response.data);
    //         setProTx
    //       })
    //       .catch(error => {
    //         console.error(error);
    //       });
    //   })
    //   .catch(error => {
    //     console.error(error);
    //   });
  }, [setProInitiateData, transitionTo]);

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
