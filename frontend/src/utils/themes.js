// Theme definitions
export const themes = {
  indigo: {
    name: 'Indigo',
    primary: 'indigo',
    colors: {
      light: {
        primary: 'indigo-600',
        primaryHover: 'indigo-700',
        primaryBg: 'indigo-50',
        primaryText: 'indigo-600',
      },
      dark: {
        primary: 'indigo-500',
        primaryHover: 'indigo-400',
        primaryBg: 'indigo-900/30',
        primaryText: 'indigo-400',
      }
    }
  },
  blue: {
    name: 'Blå',
    primary: 'blue',
    colors: {
      light: {
        primary: 'blue-600',
        primaryHover: 'blue-700',
        primaryBg: 'blue-50',
        primaryText: 'blue-600',
      },
      dark: {
        primary: 'blue-500',
        primaryHover: 'blue-400',
        primaryBg: 'blue-900/30',
        primaryText: 'blue-400',
      }
    }
  },
  emerald: {
    name: 'Grön',
    primary: 'emerald',
    colors: {
      light: {
        primary: 'emerald-600',
        primaryHover: 'emerald-700',
        primaryBg: 'emerald-50',
        primaryText: 'emerald-600',
      },
      dark: {
        primary: 'emerald-500',
        primaryHover: 'emerald-400',
        primaryBg: 'emerald-900/30',
        primaryText: 'emerald-400',
      }
    }
  },
  purple: {
    name: 'Lila',
    primary: 'purple',
    colors: {
      light: {
        primary: 'purple-600',
        primaryHover: 'purple-700',
        primaryBg: 'purple-50',
        primaryText: 'purple-600',
      },
      dark: {
        primary: 'purple-500',
        primaryHover: 'purple-400',
        primaryBg: 'purple-900/30',
        primaryText: 'purple-400',
      }
    }
  },
  rose: {
    name: 'Röd',
    primary: 'rose',
    colors: {
      light: {
        primary: 'rose-600',
        primaryHover: 'rose-700',
        primaryBg: 'rose-50',
        primaryText: 'rose-600',
      },
      dark: {
        primary: 'rose-500',
        primaryHover: 'rose-400',
        primaryBg: 'rose-900/30',
        primaryText: 'rose-400',
      }
    }
  },
  amber: {
    name: 'Amber',
    primary: 'amber',
    colors: {
      light: {
        primary: 'amber-600',
        primaryHover: 'amber-700',
        primaryBg: 'amber-50',
        primaryText: 'amber-600',
      },
      dark: {
        primary: 'amber-500',
        primaryHover: 'amber-400',
        primaryBg: 'amber-900/30',
        primaryText: 'amber-400',
      }
    }
  }
};

// Get theme class names
export const getThemeClasses = (themeName, isDark) => {
  const theme = themes[themeName] || themes.indigo;
  const mode = isDark ? 'dark' : 'light';
  return theme.colors[mode];
};

// Apply theme to document
export const applyTheme = (themeName) => {
  const root = document.documentElement;
  const theme = themes[themeName] || themes.indigo;
  
  // Set data-theme attribute for CSS variable support
  root.setAttribute('data-theme', themeName);
  
  // Store theme in localStorage
  localStorage.setItem('app-theme', themeName);
};

// Get current theme from localStorage
export const getCurrentTheme = () => {
  return localStorage.getItem('app-theme') || 'indigo';
};

