import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * What each tab is called, and why these words.
 *
 * The bar used to read Today · Plan · Life · Data · Intent. Three of those
 * were abstract nouns that could have covered any screen in the app, and
 * one was the product's own name — a tab called Intent tells a first-time
 * user precisely nothing about what is behind it, and it was also the
 * thinnest of the five. Its contents answered the same question this
 * "Progress" tab already asks, so it merged into it and the bar lost a
 * word that needed explaining.
 *
 * The rule the remaining four follow: name the CONTENT, not the concept.
 * "Week" is a calendar. "Coaches" is where the seven coaches live. Neither
 * needs a sentence underneath it.
 */
const TAB_TITLES: Record<string, string> = {
  today: 'Today',
  plan: 'Week',
  life: 'Coaches',
  data: 'Progress',
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
