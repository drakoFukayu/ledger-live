import React, { useEffect, useCallback, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation, Trans } from "react-i18next";
import styled from "styled-components";
import { submitKYC, countries, USStates } from "@ledgerhq/live-common/exchange/swap/index";
import { getFlag } from "@ledgerhq/live-common/react";
import { KYCData, KYCStatus } from "@ledgerhq/live-common/exchange/swap/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Card from "~/renderer/components/Box/Card";
import Input from "~/renderer/components/Input";
import Select from "~/renderer/components/Select";
import Alert from "~/renderer/components/Alert";
import useIsUpdateAvailable from "~/renderer/components/Updater/useIsUpdateAvailable";
import Pending from "./Pending";
import IconWyre from "~/renderer/icons/providers/Wyre";
import { swapKYCSelector } from "~/renderer/reducers/settings";
import { setSwapKYCStatus } from "~/renderer/actions/settings";
import Tabbable from "~/renderer/components/Box/Tabbable";
import AngleLeft from "~/renderer/icons/AngleLeft";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { openURL } from "~/renderer/linking";
import IconExternalLink from "~/renderer/icons/ExternalLink";
import FakeLink from "~/renderer/components/FakeLink";
import { useDynamicUrl } from "~/renderer/terms";

const Footer = styled.div`
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  display: flex;
  padding: 24px;
`;
const FooterBackLink = styled(Tabbable)`
  cursor: pointer;
  &:hover,
  &:hover ${Text} {
    color: ${p => p.theme.colors.palette.text.shade80};
  }
  &:active,
  &:active ${Text} {
    color: ${p => p.theme.colors.palette.text.shade100};
  }
`;
const Disclaimer = styled(Text)`
  flex: 1 1 auto;
  margin-left: 14px;
  margin-right: 14px;
  font-size: 12px;
  line-height: 18px;
  color: ${p => p.theme.colors.palette.text.shade50};
`;

const renderCountry = (option: {
  data: {
    value: string;
    label: string;
  };
}) => {
  if (!option) return null;
  const Icon = getFlag(option.data.value);
  return (
    <Box horizontal alignItems={"center"}>
      {Icon ? <Icon size={20} /> : null}
      <Text ml={15}>{option.data.label}</Text>
    </Box>
  );
};

const WyreKYC = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, Error | null | undefined>>({});
  const isUpdateAvailable = useIsUpdateAvailable();
  const [APIError, setAPIError] = useState<Error | null | undefined>(null);
  const [isLoading, setLoading] = useState(false);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const privacyPolicyUrl = useDynamicUrl("privacyPolicy");
  const swapKYC = useSelector(swapKYCSelector);
  const dispatch = useDispatch();
  const stateOptions = Object.entries(USStates).map(([value, label]) => ({
    value,
    label,
  }));
  const countryOptions = Object.entries(countries).map(([value, label]) => ({
    value,
    label,
  }));

  // Sanity validation
  const [minDOB, maxDOB] = useMemo(() => [new Date("1900-01-01"), new Date()], []);

  // TODO Might need a better setup if this form gets more complicated
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState<typeof countryOptions[0] | null | undefined>(
    countryOptions[0],
  );
  const [postalCode, setPostalCode] = useState("");
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const requiredFields = useMemo(
    () => ({
      firstName,
      lastName,
      dateOfBirth,
      street1,
      city,
      state,
      postalCode,
    }),
    [city, dateOfBirth, firstName, lastName, postalCode, state, street1],
  );
  // @ts-expect-error country.value can be null or undefined and KYCData expects a non-nullable value :/
  const kycData: KYCData = useMemo(
    () => ({
      firstName,
      lastName,
      dateOfBirth,
      residenceAddress: {
        street1,
        street2,
        city,
        state,
        country: country?.value,
        postalCode,
      },
    }),
    [city, country?.value, dateOfBirth, firstName, lastName, postalCode, state, street1, street2],
  );
  const onValidateFields = useCallback(() => {
    const errors = {};
    for (const field in requiredFields) {
      if (!requiredFields[field as keyof typeof requiredFields]) {
        errors[field as keyof typeof errors] = t(`swap2.kyc.wyre.form.${field}Error`);
      }
      if (field === "dateOfBirth") {
        const date = new Date(requiredFields[field]);
        if (minDOB > date || maxDOB < date) {
          errors[field as keyof typeof errors] = t(
            `swap2.kyc.wyre.form.dateOfBirthValidationError`,
          );
        }
      }
    }
    return errors;
  }, [maxDOB, minDOB, requiredFields, t]);
  useEffect(() => {
    setErrors(onValidateFields);
  }, [onValidateFields, requiredFields, t]);
  const onUpdateField = useCallback((updater: (value: string) => void) => {
    return (value: string) => updater(value);
  }, []);
  const onSubmit = useCallback(() => {
    setHasSubmittedOnce(true);
    if (!Object.entries(errors).length) {
      let cancelled = false;
      async function onSubmitKYC() {
        setLoading(true);
        const res = await submitKYC("wyre", kycData);
        if ("error" in res && res.error) {
          setAPIError(res.error);
        } else if (!cancelled) {
          dispatch(
            setSwapKYCStatus({
              provider: "wyre",
              id: (res as KYCStatus)?.id,
              status: (res as KYCStatus).status,
            }),
          );
          setAPIError(undefined);
        }
        setLoading(false);
      }
      onSubmitKYC();
      return () => {
        cancelled = true;
      };
    }
  }, [dispatch, errors, kycData]);
  return (
    <Card justifyContent={"space-between"}>
      {swapKYC.wyre ? (
        <Pending onClose={onClose} />
      ) : (
        <>
          <TrackPage category="Swap" name="KYC Form" {...swapDefaultTrack} />
          <Box px={40} pt={40} mb={16} alignSelf={"normal"} alignItems={"center"}>
            <IconWyre size={32} />
            <Text ff="Inter|SemiBold" fontSize={18} color="palette.text.shade100">
              <Trans i18nKey={"swap2.kyc.wyre.title"} />
            </Text>
            <Text ff="Inter|Regular" fontSize={12} color="palette.text.shade70">
              <Trans i18nKey={"swap2.kyc.wyre.subtitle"} />
            </Text>
            {APIError ? (
              <Box mt={10} flex={1}>
                <Alert type={"error"} flex={1}>
                  {isUpdateAvailable ? (
                    <Trans i18nKey={"swap2.kyc.updateRequired"} />
                  ) : (
                    APIError.message
                  )}
                </Alert>
              </Box>
            ) : null}
            <Box horizontal alignSelf={"stretch"} mt={32}>
              <Box flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.firstName"} />
                </Text>
                <Input
                  disabled={isLoading}
                  onChange={setFirstName}
                  placeholder={t("swap2.kyc.wyre.form.firstNamePlaceholder")}
                  error={hasSubmittedOnce && errors.firstName}
                  maxLength={30}
                />
              </Box>
              <Box ml={24} flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.lastName"} />
                </Text>
                <Input
                  disabled={isLoading}
                  onChange={setLastName}
                  placeholder={t("swap2.kyc.wyre.form.lastNamePlaceholder")}
                  error={hasSubmittedOnce && errors.lastName}
                  maxLength={30}
                />
              </Box>
            </Box>
            <Box horizontal alignSelf={"stretch"} mt={20}>
              <Box flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.dateOfBirth"} />
                </Text>
                <Input
                  type={"date"}
                  disabled={isLoading}
                  onChange={setDateOfBirth}
                  error={hasSubmittedOnce && errors.dateOfBirth}
                />
              </Box>
              <Box ml={24} flex={1} />
            </Box>
            <Box horizontal alignSelf={"stretch"} mt={20}>
              <Box flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.street1"} />
                </Text>
                <Input
                  disabled={isLoading}
                  onChange={setStreet1}
                  placeholder={t("swap2.kyc.wyre.form.street1Placeholder")}
                  error={hasSubmittedOnce && errors.street1}
                  maxLength={50}
                />
              </Box>
              <Box ml={24} flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.street2"} />
                </Text>
                <Input
                  disabled={isLoading}
                  onChange={setStreet2}
                  placeholder={t("swap2.kyc.wyre.form.street2Placeholder")}
                  maxLength={50}
                />
              </Box>
            </Box>
            <Box horizontal alignSelf={"stretch"} mt={20}>
              <Box flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.city"} />
                </Text>
                <Input
                  disabled={isLoading}
                  onChange={onUpdateField(setCity)}
                  placeholder={t("swap2.kyc.wyre.form.cityPlaceholder")}
                  error={hasSubmittedOnce && errors.city}
                  maxLength={30}
                />
              </Box>
              <Box ml={24} flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.postalCode"} />
                </Text>
                <Input
                  disabled={isLoading}
                  onChange={setPostalCode}
                  placeholder={t("swap2.kyc.wyre.form.postalCodePlaceholder")}
                  error={hasSubmittedOnce && errors.postalCode}
                  maxLength={10}
                />
              </Box>
            </Box>
            <Box horizontal alignSelf={"stretch"} mt={20} mb={10}>
              <Box flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.state"} />
                </Text>
                <Select
                  isDisabled={isLoading}
                  onChange={option => setState(option?.value || "")}
                  error={(hasSubmittedOnce && errors.state) || undefined}
                  options={stateOptions}
                />
              </Box>
              <Box ml={24} flex={1}>
                <Text ff="Inter|Medium" mr={1} fontSize={13} color="palette.text.shade70" mb={1}>
                  <Trans i18nKey={"swap2.kyc.wyre.form.country"} />
                </Text>
                <Select
                  isDisabled
                  onChange={setCountry}
                  value={country}
                  options={countryOptions}
                  renderValue={renderCountry}
                />
              </Box>
            </Box>
          </Box>
          <Footer>
            <FooterBackLink horizontal alignItems="center" onClick={onClose}>
              <AngleLeft size={14} />
              <Text ff="Inter|SemiBold" fontSize={4} color="palette.text.shade50" ml={1}>
                {t("common.back")}
              </Text>
            </FooterBackLink>
            <Box flex={1} />
            <Disclaimer ff="Inter|Regular">
              <Trans i18nKey={"swap.kyc.wyre.disclaimer"} />{" "}
              <FakeLink
                underline
                fontSize={3}
                color="palette.primary.main"
                onClick={e => {
                  e.preventDefault();
                  openURL(privacyPolicyUrl);
                }}
                style={{
                  textTransform: "capitalize",
                  display: "inline-flex",
                }}
              >
                <Trans i18nKey="swap.kyc.wyre.policy" />
                <Box ml={1}>
                  <IconExternalLink size={12} />
                </Box>
              </FakeLink>
            </Disclaimer>
            <Button isLoading={isLoading} primary onClick={onSubmit}>
              <Trans i18nKey={"swap2.kyc.wyre.cta"} />
            </Button>
          </Footer>
        </>
      )}
    </Card>
  );
};
export default WyreKYC;
