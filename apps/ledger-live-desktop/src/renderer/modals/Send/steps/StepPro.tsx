import React, { useCallback, useEffect } from "react";
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
  approvalData,
}: StepProps) => {
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
    }

    asyncFetch();
    return () => {
      removed = true;
    };
  }, [setPending]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!approvalData) return;
    // Once we have the approval data, notify the backend. For the approval flow we already have
    // all the information and just need to send the apdus and get the response, so it's going to
    // be a separate step, or handled here, no idea.
    const data = JSON.parse(approvalData);
    const signature = data.signatureResponse.slice(4, -4);
    // eslint-disable-next-line camelcase
    const raw_tx = data.rawApdus.reverse();

    const postData = {
      memo: "Some memo",
      pub_key: myPubKey,
      raw_tx,
      signature,
    };

    console.log(postData);

    axios
      .post(`${urlBase}/${org}/transaction/initiate`, postData)
      .then(response => {
        // FIXME, do we need to do anything with the response?
        fetchDashboard();
      })
      .catch(error => {
        console.error(error);
      });
  }, [approvalData, fetchDashboard]);

  if (!status) return null;

  return (
    <Box flow={4}>
      {/* <Alert type="secondary" title="Below is a summary of your pending approvals" /> */}
      {approvalData ? (
        <Flex flexDirection="column" flex={1}>
          <Alert type="warning" title="This is the device response, no idea what to do with it." />
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
  closeModal,
  setApproving,
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
