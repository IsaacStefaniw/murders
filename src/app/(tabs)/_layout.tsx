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
/** Apple's minimum touch target. The tab bar is the most-touched control
 *  in the app and was under it. */
export const TAB_MIN_TOUCH = 44;

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

/**
 * Minimal text tab bar — four quiet words, no icon noise.
 *
 * ── TWO THINGS MEASURED AND FIXED ───────────────────────────────────────
 *
 * The tap target was about 29pt: a 21pt line with `Spacing.xs` (4) above
 * and below. Apple's floor is 44. This is the most-touched control in the
 * app, and `chip.tsx` carries a whole comment defending 44pt for a chip
 * while the tab bar quietly ignored it.
 *
 * And selection had to be READ rather than glanced. Focused and unfocused
 * differed only by font weight and a grey, at the same size, in the same
 * place — so finding where you are meant parsing four words. For somebody
 * giving the app four seconds, that is the wrong place to spend a second.
 *
 * The words stay: naming the content rather than a concept is the right
 * call and icons for "Week" and "Coaches" would be guesses. What changes
 * is that the active one is now in the accent colour with a short rule
 * above it — a shape to find, not a sentence to read.
 */
function MinimalTabBar({ state, navigation }: MinimalTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
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
            <View
              style={[
                styles.marker,
                { backgroundColor: focused ? theme.accent : 'transparent' },
              ]}
            />
            <AppText
              variant="secondary"
              style={{
                color: focused ? theme.accent : theme.textTertiary,
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
    paddingTop: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Apple's minimum. Was ~29pt: a 21pt line plus 4 above and below.
    minHeight: TAB_MIN_TOUCH,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  /** The shape that says which tab you are on, so it needn't be read. */
  marker: {
    height: 2,
    width: 18,
    borderRadius: 1,
  },
});
