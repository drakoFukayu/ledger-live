import React, { useMemo } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { track } from "~/renderer/analytics/segment";
import TabBar from "~/renderer/components/TabBar";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils/index";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import swapRoutes from "./routes.json";

const Nav = styled.nav`
  background-color: ${p => p.theme.colors.palette.background.paper};

  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
`;

/*
 ** This component manages routing logic for swap screens and send
 ** tracking data to analytics.
 */
const Navbar = () => {
  const { pathname } = useLocation();
  const history = useHistory();

  const currentIndex = useMemo(() => {
    return swapRoutes.findIndex(route => route.path === pathname);
  }, [pathname]);

  const tabs = useMemo(
    () => swapRoutes.filter(route => !route.disabled).map(route => route.title),
    [],
  );

  const onWrappedTabChange = (nextIndex: number) => {
    if (currentIndex === nextIndex) return;
    const nextPathname = swapRoutes[nextIndex].path;
    history.push({
      pathname: nextPathname,
    });
  };
  return (
    <Nav>
      <TabBar tabs={tabs} onIndexChange={onWrappedTabChange} index={currentIndex} />
    </Nav>
  );
};
export default Navbar;
