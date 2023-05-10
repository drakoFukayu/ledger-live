import React, { useState, useCallback, useEffect } from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { Alert, Text, Divider, Flex } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import Label from "~/renderer/components/Label";
import Item from "./Pro/Item";
import axios from "axios";

const myPubKey = "2cdfa3ff8cf9b7cfe4d61d21dea82c20f83f43761f44b4c4daede52f9873e2a68";
const org = "test_hk_4";

const StepPro = ({
  status,
  selectedProIndex,
  setSelectedProIndex,
  pending,
  setPending,
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
  }, []);

  if (!status) return null;

  return (
    <Box flow={4}>
      {/* <Alert type="secondary" title="Below is a summary of your pending approvals" /> */}
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
    </Box>
  );
};

export const StepProFooter = ({ selectedProIndex, transitionTo, pending }: StepProps) => {
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

  const onNewTransaction = async () => {
    // transitionTo("recipient"); to do when we have the app
    // api call after the device thinigy
    const data = {
      memo: "test aljdasjdtxe",
      pub_key: myPubKey,
      raw_tx: "0xoeesdfrere",
      signature: "0xsig3",
    };
    axios
      .post(
        `https://ledger-live-pro.minivault.ledger-sbx.com/router/${org}/transaction/initiate`,
        data,
      )
      .then(response => {
        console.log(response.data);
        // then approve tx
        const approveData = {
          pub_key: myPubKey,
          raw_tx: "0xoeereresd",
          signature: "0xsig3w",
        };
        axios
          .post(
            `https://ledger-live-pro.minivault.ledger-sbx.com/router/${org}/transaction/initiate`,
            approveData,
          )
          .then(response => {
            console.log(response.data);
            // then approve tx
          })
          .catch(error => {
            console.error(error);
          });
      })
      .catch(error => {
        console.error(error);
      });
  };

  return (
    <>
      {selectedProIndex !== null ? (
        <Button id={"send-pro-continue-button"} primary onClick={onApprove}>
          {"Approve operation"}
        </Button>
      ) : (
        <Button id={"send-pro-continue-button"} primary onClick={onNewTransaction}>
          {"New transaction"}
        </Button>
      )}
    </>
  );
};

export default withV3StyleProvider(StepPro);
