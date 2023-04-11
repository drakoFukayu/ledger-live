import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";

import { navigationRef } from "../rootnavigation";

export type Args = {
  headerShown?: boolean;
  title?: string;
  headerLeft?: (() => React.ReactElement) | null;
  headerRight?: (() => React.ReactElement) | null;
  header?: () => React.ReactElement;
};

type InitialHeaderOptions = {
  headerShown: boolean;
  headerTitle: (() => React.ReactElement) | null;
  headerLeft: (() => React.ReactElement) | null;
  headerRight: (() => React.ReactElement) | null;
  title: string;
};

/**
 * Hook to update dynamically the react-navigation header
 *
 * Safe on react-navigation "screen" components.
 * 
 * Warning: do not use this hook inside 2 consecutive "non screen" components (A rendered -> A not rendered and B rendered)
 * because the header options won't be reset correctly to their initial values.
 * Use this hook in a parent of those 2 components (for ex in the screen component rendering those 2 components).
 * The reason: navigationRef.current?.getCurrentOptions() is updated asynchronously
 *
  The header is reset to its initial options/settings when the component calling this hook is unmounted.
 * 
 * @param headerShown true (default): header is displayed, false: header is not displayed
 * @param title string displayed as the title of the header.
 * @param headerLeft function returning a ReactElement displayed on the left of the header.
 *   `components/NavigationHeaderBackButton` should be used for basic back arrow.
 *   Set to `undefined` in order to reset to the default headerLeft, or `null` to display nothing.
 * @param headerRight function returning a ReactElement displayed on the right of the header.
 *   `components/NavigationHeaderCloseButton` should be used for basic close button.
 *   Set to `undefined` in order to reset to the default headerRight, or `null` to display nothing.
 * @param header function returning a ReactElement displayed as the entire header.
 *  It overrides every other params.
 *  Set to `undefined` in order to reset to the default header.
 *  `null` is forbidden. Use `headerShown` to disable the header.
 */
export const useSetNavigationHeader = ({
  headerShown = true,
  title,
  headerLeft,
  headerRight,
  header,
}: Args) => {
  const navigation = useNavigation();

  const [initialHeaderOptions, setInitialHeaderOptions] =
    useState<null | InitialHeaderOptions>(null);

  // Gets and sets the initial header options
  useEffect(() => {
    const {
      headerShown: initialHeaderShown,
      headerTitle: initialHeaderTitle,
      headerLeft: initialHeaderLeft,
      headerRight: initialHeaderRight,
      title: initialTitle,
    } =
      // getCurrentOptions is not typed ...
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigationRef.current?.getCurrentOptions() as any;

    const currentOptions: InitialHeaderOptions = {
      headerShown: initialHeaderShown,
      headerTitle: initialHeaderTitle,
      headerLeft: initialHeaderLeft,
      headerRight: initialHeaderRight,
      title: initialTitle,
    };

    setInitialHeaderOptions(currentOptions);
  }, []);

  // Updates header on dynamic changes
  useEffect(() => {
    // Does not do anything until the initial options are set
    if (!initialHeaderOptions) return () => undefined;

    // header overrides every other params
    if (header !== undefined) {
      navigation.setOptions({
        headerShown:
          headerShown === undefined
            ? initialHeaderOptions.headerShown
            : headerShown,
        header,
      });
    } else {
      // Checks on `undefined`:
      // if anOption = undefined, anOption resulting from { ...initialHeaderOptions, anOption } is set to undefined
      // which results, in the case of react-navigation, in using the default value for anOption,
      // which can be different than the one set initially before rendering the associated component.
      // Wanted behavior: if `undefined`, then initial value
      navigation.setOptions({
        header: undefined,
        headerShown:
          headerShown === undefined
            ? initialHeaderOptions.headerShown
            : headerShown,
        title: title === undefined ? initialHeaderOptions.title : title,
        headerLeft:
          headerLeft === undefined
            ? initialHeaderOptions.headerLeft
            : headerLeft,
        headerRight:
          headerRight === undefined
            ? initialHeaderOptions.headerRight
            : headerRight,
      });
    }

    // Resets to initial header options/settings.
    // No need to reset on react-navigation navigate because the new screen that we navigate to
    // always defines a (default) header that is going to overwrite this.
    return () => {
      navigation.setOptions(initialHeaderOptions);
    };
  }, [
    headerLeft,
    headerShown,
    headerRight,
    navigation,
    title,
    initialHeaderOptions,
    header,
  ]);
};
