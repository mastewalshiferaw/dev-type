'use client';

import { useEffect } from 'react';
import { syncTheme } from '@/lib/theme';

/** Keeps <html data-theme> following the saved preference and OS changes after load. */
export default function ThemeSync() {
  useEffect(syncTheme, []);
  return null;
}
