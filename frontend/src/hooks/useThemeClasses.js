import { useTheme } from '../contexts/ThemeContext';
import { getThemeButtonClasses, getThemeTextClasses, getThemeBgClasses, getThemeBorderClasses } from '../utils/themeClasses';

// Hook to get theme-aware class names
export const useThemeClasses = (isDark = false) => {
  const { colorTheme } = useTheme();
  
  return {
    button: getThemeButtonClasses(colorTheme, isDark),
    text: getThemeTextClasses(colorTheme, isDark),
    bg: getThemeBgClasses(colorTheme, isDark),
    border: getThemeBorderClasses(colorTheme, isDark),
    theme: colorTheme
  };
};

