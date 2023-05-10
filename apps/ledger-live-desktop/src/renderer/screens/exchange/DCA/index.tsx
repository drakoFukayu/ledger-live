import React, { useState } from "react";
import { Route } from "react-router-dom";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import DCAForm from "./Form";
import DCAHistory from "./History";
import SwapNavbar from "./Navbar";

const Body = styled(Box)`
  flex: 1;
`;

const Main = styled.main`
  display: flex;
  justify-content: center;
  flex: 1;

  background-color: ${p => p.theme.colors.palette.background.paper};

  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  box-shadow: 0px 4px 6px rgba(20, 37, 51, 0.04);
  border-top: 1px solid ${p => p.theme.colors.palette.divider};

  & > * {
    width: 100%;
  }
`;

export type DCAHistory = {
  from: { currency?: string; address?: string };
  to: { currency?: string; address?: string };
  amount: string;
  interval: string;
};

const Swap2 = () => {
  const [history, setHistory] = useState<DCAHistory[]>([]);

  const addHistory = (newDCA: DCAHistory) => setHistory(historyState => [...historyState, newDCA]);

  return (
    <>
      <Text mb={20} ff="Inter|SemiBold" fontSize={7} color="palette.text.shade100">
        {"Dollar Cost Average"}
      </Text>
      <Body>
        <SwapNavbar />
        <Main>
          <Route path="/dca" exact>
            <DCAForm addHistory={addHistory} />
          </Route>
          <Route path="/dca/history" exact>
            <DCAHistory history={history} />
          </Route>
        </Main>
      </Body>
    </>
  );
};

export default Swap2;
