import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TAB_TITLES: Record<string, string> = {
  today: 'Today',
  plan: 'Plan',
  life: 'Life',
  data: 'Data',
  intent: 'Intent',
};

/** The slice of BottomTabBarProps this bar needs — structural, so we don't
 * depend on expo-router's vendored react-navigation internals. */
interface MinimalTabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

/** Minimal text tab bar — five quiet words, no icon noise. */
function MinimalTabBar({ state, navigation }: MinimalTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.md),
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const title = TAB_TITLES[route.name] ?? route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={title}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
          >
            <AppText
              variant="secondary"
              style={{
                color: focused ? theme.text : theme.textTertiary,
                fontWeight: focused ? '700' : '500',
              }}
            >
              {title}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <MinimalTabBar
          state={props.state}
          navigation={{ navigate: (name: string) => props.navigation.navigate(name as never) }}
        />
      )}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="life" />
      <Tabs.Screen name="data" />
      <Tabs.Screen name="intent" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
});
