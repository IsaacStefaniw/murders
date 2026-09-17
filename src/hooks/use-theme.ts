import { createContext, createElement, useContext, type ReactNode } from 'react';

import { Colors, type Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * A palette swap for one subtree.
 *
 * ── Why a context and not a prop ────────────────────────────────────────
 *
 * The breakout frame inverts the surface, and a dark surface is useless if
 * everything drawn on it is still dark ink. Every `AppText`, `Card`,
 * `Button`, `Chip` and `Field` in this app already asks `useTheme()` for
 * its colours — so the cheapest correct answer is to change what that
 * question returns inside the frame, rather than threading a variant prop
 * through every control and every screen that might sit in one.
 *
 * `breakout.tsx`'s own docstring says the frame exists "so that the next
 * one is the cheap option". This is the line that makes that true: a new
 * breakout screen is written exactly like an ordinary screen and comes out
 * correct.
 */
const Override = createContext<Theme | null>(null);

export function ThemeOverride({ value, children }: { value: Theme; children: ReactNode }) {
  return createElement(Override.Provider, { value }, children);
}

export function useTheme(): Theme {
  const override = useContext(Override);
  const scheme = useColorScheme();
  if (override) return override;
  return scheme === 'dark' ? Colors.dark : Colors.light;
}

/** The inverted palette for the surface a breakout paints. */
export function useBreakoutTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.breakoutDark : Colors.breakoutLight;
}
