import React from "react";
import styled from "styled-components";
import { Flex, Icons, ProgressLoader, Text } from "@ledgerhq/react-ui";
import { rgba } from "~/renderer/styles/helpers";
import Ellipsis from "~/renderer/components/Ellipsis";

const Wrapper = styled(Flex)<{ isSelected: boolean; alreadyApproved: boolean; sent: boolean }>`
  border: 1px solid
    ${p =>
      p.sent
        ? "p.theme.colors.neutral.c30"
        : p.alreadyApproved
        ? "green"
        : p.isSelected
        ? p.theme.colors.wallet
        : "transparent"};
  padding: 8px;
  border-radius: 4px;
  cursor: ${p => (p.alreadyApproved ? "inherit" : "pointer")};
`;
const Progress = styled(Flex)`
  padding: 10px;
  & > div {
    position: relative;
  }
`;
const Hash = styled(Flex)`
  border: 1px solid ${p => p.theme.colors.wallet};
  border-radius: 4px;
  background: ${p => rgba(p.theme.colors.wallet, 0.2)};
  max-width: 120px;
  padding: 4px;
  overflow: hidden;
  font-size: 10px;
  height: 25px;
  align-self: center;
`;

type Props = {
  memo: string;
  hash: string;
  validators: [number, number];

  isSelected: boolean;
  onClick: () => void;
  alreadyApproved?: boolean;
};

const Item = ({ alreadyApproved, memo, hash, validators, isSelected, onClick }: Props) => {
  const sent = (validators.length as unknown) === 3;
  return (
    <Wrapper
      p={2}
      my={4}
      isSelected={isSelected}
      onClick={alreadyApproved ? undefined : onClick}
      alignItems="center"
      alreadyApproved={!!alreadyApproved}
      sent={sent}
    >
      <Progress>
        {sent ? (
          <Icons.CheckAloneMedium color="success.c50" size={24} />
        ) : (
          <ProgressLoader
            showPercentage={false}
            radius={16}
            progress={(validators.length / 3) * 100}
          />
        )}
      </Progress>
      <Flex justifyContent="space-between" flex={1}>
        <Flex flexDirection="column" justifyContent="center">
          <Text variant="body">{memo}</Text>
          <Text variant="small" color="neutral.c70">
            {""}
          </Text>
        </Flex>
        <Hash>
          <Ellipsis>{hash}</Ellipsis>
        </Hash>
      </Flex>
    </Wrapper>
  );
};

export default Item;
