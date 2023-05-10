import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { isSwapOperationPending } from "@ledgerhq/live-common/exchange/swap/index";
import getCompleteSwapHistory from "@ledgerhq/live-common/exchange/swap/getCompleteSwapHistory";
import updateAccountSwapStatus from "@ledgerhq/live-common/exchange/swap/updateAccountSwapStatus";
import { SwapHistorySection } from "@ledgerhq/live-common/exchange/swap/types";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import useInterval from "~/renderer/hooks/useInterval";
import Box from "~/renderer/components/Box";
import { setDrawer } from "~/renderer/drawers/Provider";
import SwapOperationDetails from "~/renderer/drawers/SwapOperationDetails";
import HistoryLoading from "./HistoryLoading";
import HistoryPlaceholder from "./HistoryPlaceholder";
import { useHistory } from "react-router-dom";
import { DCAHistory } from "..";
import TableContainer from "~/renderer/components/TableContainer";
import { TableCell } from "~/renderer/screens/market/MarketList";
import { startCase } from "lodash";
import styled from "styled-components";
import { rgba } from "@ledgerhq/react-ui/styles";
import Button from "~/renderer/components/ButtonV3";

const History = ({ history: dcaHistory }: { history: DCAHistory[] }) => {
  const accounts = useSelector(accountsSelector);
  const [mappedSwapOperations, setMappedSwapOperations] = useState<
    SwapHistorySection[] | undefined | null
  >(null);

  const history = useHistory<{ swapId?: string }>();
  const dispatch = useDispatch();
  const defaultOpenedOnce = useRef(false);
  const defaultOpenedSwapOperationId = history?.location?.state?.swapId;

  useEffect(() => {
    (async function asyncGetCompleteSwapHistory() {
      if (!accounts) return;
      const sections = await getCompleteSwapHistory(flattenAccounts(accounts));
      setMappedSwapOperations(sections);
    })();
  }, [accounts]);

  useEffect(() => {
    if (defaultOpenedOnce.current || !defaultOpenedSwapOperationId) return;
    if (mappedSwapOperations) {
      defaultOpenedOnce.current = true;
      mappedSwapOperations.some(section => {
        const openedOperation = section.data.find(
          ({ swapId }) => swapId === defaultOpenedSwapOperationId,
        );
        if (openedOperation) {
          setDrawer(SwapOperationDetails, {
            mappedSwapOperation: openedOperation,
          });
        }
        return !!openedOperation;
      });
    }
  }, [mappedSwapOperations, defaultOpenedSwapOperationId]);

  const updateSwapStatus = useCallback(() => {
    let cancelled = false;
    async function fetchUpdatedSwapStatus() {
      const updatedAccounts = await Promise.all(accounts.map(updateAccountSwapStatus));
      if (!cancelled) {
        updatedAccounts.filter(Boolean).forEach(account => {
          account && dispatch(updateAccountWithUpdater(account.id, () => account));
        });
      }
    }
    fetchUpdatedSwapStatus();
    return () => (cancelled = true);
  }, [accounts, dispatch]);

  const hasPendingSwapOperations = useMemo(() => {
    if (mappedSwapOperations) {
      for (const section of mappedSwapOperations) {
        for (const swapOperation of section.data) {
          if (isSwapOperationPending(swapOperation.status)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [mappedSwapOperations]);

  useInterval(() => {
    if (hasPendingSwapOperations) {
      updateSwapStatus();
    }
  }, 10000);

  const TableRow = styled(Box)`
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
    color: #abadb6;
    cursor: pointer;
    padding: 20px;
    :hover {
      background: ${p => rgba(p.theme.colors.wallet, 0.04)};
    }
  `;

  return (
    <>
      {dcaHistory ? (
        dcaHistory.length ? (
          <TableContainer>
            <TableRow>
              <TableCell>Amount</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Interval</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>

            {dcaHistory.map(dca => (
              <TableRow key={`${dca.from.address}-${dca.to.address}-${dca.amount}`}>
                <TableCell>{dca.amount}</TableCell>
                <TableCell>{dca.to.currency}</TableCell>
                <TableCell>
                  {dca.interval === "10" ? "Every 10 seconds" : startCase(dca.interval)}
                </TableCell>
                <TableCell>
                  <Button>Unsuscribe</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableContainer>
        ) : (
          <HistoryPlaceholder />
        )
      ) : (
        <HistoryLoading />
      )}
    </>
  );
};

export default History;
