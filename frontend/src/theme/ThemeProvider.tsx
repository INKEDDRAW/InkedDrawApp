/**
 * Theme Provider for Inked Draw
 * Provides theme context throughout the application
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { theme, Theme } from './index';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hook to get theme directly
export const useInkedTheme = () => {
  const { theme } = useTheme();
  return theme;
};
