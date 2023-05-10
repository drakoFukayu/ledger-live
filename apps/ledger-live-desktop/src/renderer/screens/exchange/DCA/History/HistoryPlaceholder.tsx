import React from "react";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import styled from "styled-components";

const Wrapper = styled(Box).attrs(() => ({
  justifyContent: "center",
  alignItems: "center",
}))`
  min-height: 438px;
  row-gap: 5px;
`;
const HistoryPlaceholder = () => {
  return (
    <Wrapper>
      <Text ff="Inter|SemiBold" fontSize={16} color="palette.text.shade100">
        {"Your Dollar Cost average history will appear here"}
      </Text>
      <Text ff="Inter|Regular" fontSize={12} color="palette.text.shade50">
        {"Click on DCA to schedule your first program"}
      </Text>
    </Wrapper>
  );
};

export default HistoryPlaceholder;
