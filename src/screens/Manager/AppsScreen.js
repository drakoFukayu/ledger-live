// @flow
import React, {
  useState,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import { useSortedFilteredApps } from "@ledgerhq/live-common/lib/apps/filtering";

import { TabView, TabBar } from "react-native-tab-view";
import Animated from "react-native-reanimated";

import i18next from "i18next";
import { Trans } from "react-i18next";

import colors from "../../colors";

import SearchModal from "./Modals/SearchModal";
import AppFilter from "./AppsList/AppFilter";
import UninstallAllButton from "./AppsList/UninstallAllButton";

import LText from "../../components/LText";

import { ManagerContext } from "./shared";

import DeviceCard from "./Device";
import AppsList from "./AppsList";
import AppUpdateAll from "./AppsList/AppUpdateAll";

const { interpolate, Extrapolate } = Animated;
const { width, height } = Dimensions.get("screen");
const initialLayout = { width, height };

type Props = { state: State, dispatch: Action => void };

const AppsScreen = ({ state, dispatch }: Props) => {
  const { apps, appByName, installed, installQueue } = state;

  const listRef = useRef();

  const { MANAGER_TABS } = useContext(ManagerContext);

  const [index, setIndex] = useState(0);
  const [routes] = React.useState([
    {
      key: MANAGER_TABS.CATALOG,
      title: i18next.t("manager.appsCatalog"),
    },
    {
      key: MANAGER_TABS.INSTALLED_APPS,
      title: i18next.t("manager.installedApps"),
    },
  ]);

  const [filters, setFilters] = useState([]);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState("asc");

  const [position] = useState(() => new Animated.Value(0));

  const searchOpacity = interpolate(position, {
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: Extrapolate.CLAMP,
  });

  const [scrollY, setScrollY] = useState(0);

  const onScroll = useCallback(
    evt => setScrollY(evt.nativeEvent.contentOffset.y),
    [setScrollY],
  );

  const onSwipeStart = useCallback(() => {
    if (scrollY > 280) listRef.current.scrollToIndex({ index: 2 });
  }, [scrollY]);

  const onUninstallAll = useCallback(() => dispatch({ type: "wipe" }), [
    dispatch,
  ]);

  /** installed apps sorted from most recent installed to the least */
  const installedApps = useMemo(
    () =>
      [...installQueue, ...installed.reverse()]
        .map((i: { name: string } | string) => appByName[i.name || i])
        .filter(Boolean)
        .filter(
          (app, i, apps) =>
            apps.findIndex(({ name }) => name === app.name) === i,
        ),
    [installed, installQueue, appByName],
  );

  const filterOptions = useMemo(
    () => ({
      query: "",
      installedApps: installed,
      type: filters,
    }),
    [installed, filters],
  );
  const sortOptions = useMemo(
    () => ({
      type: sort,
      order,
    }),
    [sort, order],
  );

  const sortedApps: Array<App> = useSortedFilteredApps(
    apps,
    filterOptions,
    sortOptions,
  );

  const renderNoResults = useCallback(
    () => (
      <TouchableOpacity
        onPress={() => setIndex(0)}
        activeOpacity={0.5}
        style={styles.noAppInstalledContainer}
      >
        <LText bold style={styles.noAppInstalledText}>
          <Trans i18nKey="manager.appList.noAppsInstalled" />
        </LText>
        <LText style={styles.noAppInstalledDescription}>
          <Trans i18nKey="manager.appList.noAppsDescription" />
        </LText>
      </TouchableOpacity>
    ),
    [setIndex],
  );

  const renderScene = ({ route }: *) => {
    switch (route.key) {
      case MANAGER_TABS.CATALOG:
        return (
          <AppsList
            tab={MANAGER_TABS.CATALOG}
            apps={sortedApps}
            state={state}
            dispatch={dispatch}
            active={index === 0}
          />
        );
      case MANAGER_TABS.INSTALLED_APPS:
        return (
          <>
            <View>
              {installedApps && installedApps.length > 0 && (
                <View style={[styles.searchBarContainer]}>
                  <LText style={styles.installedAppsText}>
                    <Trans
                      i18nKey="manager.storage.appsInstalled"
                      values={{ appsInstalled: installedApps.length }}
                    />
                  </LText>
                  <UninstallAllButton onUninstallAll={onUninstallAll} />
                </View>
              )}
            </View>
            <AppsList
              tab={MANAGER_TABS.INSTALLED_APPS}
              apps={installedApps}
              state={state}
              dispatch={dispatch}
              active={index === 1}
              renderNoResults={renderNoResults}
            />
          </>
        );
      default:
        return null;
    }
  };

  const elements = [
    <DeviceCard state={state} />,
    <AppUpdateAll state={state} dispatch={dispatch} />,
    <View>
      <TabBar
        position={position}
        navigationState={{ index, routes }}
        jumpTo={key => setIndex(key === MANAGER_TABS.CATALOG ? 0 : 1)}
        style={styles.tabBarStyle}
        indicatorStyle={styles.indicatorStyle}
        tabStyle={styles.tabStyle}
        activeColor={colors.darkBlue}
        inactiveColor={colors.grey}
        labelStyle={styles.labelStyle}
        contentContainerStyle={styles.contentContainerStyle}
      />
      <View style={styles.searchBar}>
        <Animated.View
          style={[
            styles.searchBarContainer,
            { opacity: searchOpacity, zIndex: index === 0 ? 2 : 0 },
          ]}
        >
          <SearchModal
            state={state}
            dispatch={dispatch}
            tab={MANAGER_TABS.CATALOG}
          />
          <View style={styles.filterButton}>
            <AppFilter
              filters={filters}
              setFilters={setFilters}
              sort={sort}
              setSort={setSort}
              order={order}
              setOrder={setOrder}
            />
          </View>
        </Animated.View>
        {installedApps.length > 0 && (
          <Animated.View
            style={[
              styles.searchBarContainer,
              styles.searchBarInstalled,
              { opacity: position, zIndex: index === 0 ? 0 : 2 },
            ]}
          >
            <SearchModal
              state={state}
              dispatch={dispatch}
              tab={MANAGER_TABS.INSTALLED_APPS}
              apps={installedApps}
              sortOptions={{ type: null, order: null }}
            />
          </Animated.View>
        )}
      </View>
    </View>,
    <TabView
      renderTabBar={() => null}
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      position={position}
      onSwipeStart={onSwipeStart}
      sceneContainerStyle={{}}
    />,
  ];

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        ref={listRef}
        onScroll={onScroll}
        scrollEventThrottle={50}
        data={elements}
        renderItem={({ item }) => item}
        keyExtractor={(_, i) => String(i)}
        stickyHeaderIndices={[2]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  searchBar: {
    width,
    backgroundColor: colors.white,
    height: 64,
  },
  searchBarContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    height: 64,
    borderBottomWidth: 1,
    borderColor: colors.lightFog,
    zIndex: 0,
  },
  searchBarInstalled: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    width,
  },
  listContainer: {
    width,
  },
  filterButton: {
    height: 64,
    width: 44,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderColor: colors.lightFog,
    zIndex: 1,
  },
  indicatorStyle: {
    height: 3,
    backgroundColor: colors.live,
  },
  tabBarStyle: {
    backgroundColor: colors.lightGrey,
    elevation: 0,
  },
  tabStyle: {
    backgroundColor: "transparent",
    width: "auto",
    paddingHorizontal: 16,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  labelStyle: {
    backgroundColor: "transparent",
    textTransform: "capitalize",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 19,
    margin: 0,
    paddingHorizontal: 0,
    textAlign: "left",
    width: "100%",
  },
  contentContainerStyle: {
    marginTop: 16,
    backgroundColor: "transparent",
  },
  installedAppsText: {
    fontSize: 14,
    color: colors.grey,
  },
  noAppInstalledContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 35,
    paddingVertical: 50,
  },
  noAppInstalledText: {
    fontSize: 17,
    lineHeight: 21,
    color: colors.darkBlue,
    marginVertical: 8,
  },
  noAppInstalledDescription: {
    fontSize: 14,
    lineHeight: 17,
    color: colors.grey,
    marginVertical: 8,
    textAlign: "center",
  },
});

export default AppsScreen;
