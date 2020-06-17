// @flow
import React from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import {
  closableStackNavigatorConfig,
  defaultNavigationOptions,
} from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import RedelegationSelectValidator from "./01-SelectValidator";
import RedelegationAmount from "../shared/02-SelectAmount";
import RedelegationConnectDevice from "./03-ConnectDevice";
import RedelegationValidation from "./04-Validation";
import RedelegationValidationError from "./04-ValidationError";
import RedelegationValidationSuccess from "./04-ValidationSuccess";

function RedelegationFlow() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...closableStackNavigatorConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.CosmosRedelegationValidator}
        component={RedelegationSelectValidator}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.validator")}
              subtitle={t("cosmos.redelegation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: () => null,
          headerStyle: {
            ...defaultNavigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationAmount}
        component={RedelegationAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.amountTitle", {
                from: route.params?.validatorSrc?.name ?? "",
                to: route.params?.validator?.name ?? "",
              })}
              subtitle={t("cosmos.redelegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationConnectDevice}
        component={RedelegationConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.connectDevice")}
              subtitle={t("cosmos.redelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationValidation}
        component={RedelegationValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.redelegation.stepperHeader.verification")}
              subtitle={t("cosmos.redelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: null,
          headerRight: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationValidationError}
        component={RedelegationValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosRedelegationValidationSuccess}
        component={RedelegationValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { RedelegationFlow as component, options };

const Stack = createStackNavigator();
