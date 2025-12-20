import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, applyTheme, getCurrentTheme } from '../utils/themes';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [colorTheme, setColorTheme] = useState(getCurrentTheme());

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = getCurrentTheme();
    setColorTheme(savedTheme);
    applyTheme(savedTheme);
    // Also set data-theme attribute
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const changeTheme = (themeName) => {
    setColorTheme(themeName);
    applyTheme(themeName);
    // Set data-theme attribute for CSS variable support
    document.documentElement.setAttribute('data-theme', themeName);
  };

  const getThemeClasses = (isDark = false) => {
    const theme = themes[colorTheme] || themes.indigo;
    const mode = isDark ? 'dark' : 'light';
    return theme.colors[mode];
  };

  const value = {
    colorTheme,
    changeTheme,
    getThemeClasses,
    currentTheme: themes[colorTheme] || themes.indigo
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

