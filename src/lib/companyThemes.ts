// Theme configuration for company landing pages
// Each theme has distinct colors, layouts, and styling

export type ThemeStyle = 'modern' | 'classic' | 'bold' | 'minimal' | 'elegant';

export interface ThemeConfig {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    card: string;
    cardForeground: string;
    border: string;
  };
  layout: {
    heroStyle: 'left-aligned' | 'centered' | 'split' | 'overlay' | 'minimal';
    servicesGrid: 'grid-3' | 'grid-2' | 'list' | 'cards' | 'tiles';
    contactLayout: 'side-by-side' | 'stacked' | 'split' | 'centered' | 'minimal';
    headerStyle: 'standard' | 'centered' | 'minimal' | 'bold' | 'transparent';
    footerStyle: 'standard' | 'minimal' | 'centered' | 'dark' | 'gradient';
  };
  typography: {
    headingWeight: 'bold' | 'extrabold' | 'black' | 'semibold' | 'medium';
    bodySize: 'base' | 'lg' | 'sm';
    rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  };
  effects: {
    shadows: boolean;
    gradients: boolean;
    blur: boolean;
    borders: boolean;
  };
}

export const THEME_CONFIGS: Record<ThemeStyle, ThemeConfig> = {
  modern: {
    name: 'Modern',
    description: 'Clean, contemporary design with subtle shadows and gradients',
    colors: {
      primary: '199 89% 48%',      // Cyan blue
      secondary: '210 40% 96%',
      accent: '199 89% 48%',
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      border: '214.3 31.8% 91.4%',
    },
    layout: {
      heroStyle: 'left-aligned',
      servicesGrid: 'grid-3',
      contactLayout: 'side-by-side',
      headerStyle: 'standard',
      footerStyle: 'standard',
    },
    typography: {
      headingWeight: 'bold',
      bodySize: 'base',
      rounded: 'lg',
    },
    effects: {
      shadows: true,
      gradients: true,
      blur: true,
      borders: true,
    },
  },
  classic: {
    name: 'Classic',
    description: 'Traditional, professional look with navy blue and warm accents',
    colors: {
      primary: '221 83% 33%',      // Navy blue
      secondary: '45 93% 47%',     // Gold
      accent: '45 93% 47%',
      background: '40 33% 98%',    // Warm white
      foreground: '221 39% 11%',
      muted: '60 9% 94%',
      mutedForeground: '25 5% 45%',
      card: '0 0% 100%',
      cardForeground: '221 39% 11%',
      border: '221 20% 80%',
    },
    layout: {
      heroStyle: 'centered',
      servicesGrid: 'grid-2',
      contactLayout: 'stacked',
      headerStyle: 'centered',
      footerStyle: 'dark',
    },
    typography: {
      headingWeight: 'semibold',
      bodySize: 'base',
      rounded: 'md',
    },
    effects: {
      shadows: false,
      gradients: false,
      blur: false,
      borders: true,
    },
  },
  bold: {
    name: 'Bold',
    description: 'High contrast, vibrant colors with strong visual impact',
    colors: {
      primary: '0 84% 60%',        // Vibrant red
      secondary: '45 100% 51%',    // Bright yellow
      accent: '45 100% 51%',
      background: '0 0% 7%',       // Near black
      foreground: '0 0% 98%',
      muted: '0 0% 15%',
      mutedForeground: '0 0% 70%',
      card: '0 0% 12%',
      cardForeground: '0 0% 98%',
      border: '0 0% 20%',
    },
    layout: {
      heroStyle: 'overlay',
      servicesGrid: 'tiles',
      contactLayout: 'split',
      headerStyle: 'bold',
      footerStyle: 'gradient',
    },
    typography: {
      headingWeight: 'black',
      bodySize: 'lg',
      rounded: 'xl',
    },
    effects: {
      shadows: true,
      gradients: true,
      blur: false,
      borders: false,
    },
  },
  minimal: {
    name: 'Minimal',
    description: 'Ultra-clean, whitespace-focused with understated elegance',
    colors: {
      primary: '0 0% 9%',          // Almost black
      secondary: '0 0% 96%',
      accent: '0 0% 9%',
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      muted: '0 0% 96%',
      mutedForeground: '0 0% 45%',
      card: '0 0% 100%',
      cardForeground: '0 0% 9%',
      border: '0 0% 90%',
    },
    layout: {
      heroStyle: 'minimal',
      servicesGrid: 'list',
      contactLayout: 'minimal',
      headerStyle: 'minimal',
      footerStyle: 'minimal',
    },
    typography: {
      headingWeight: 'medium',
      bodySize: 'base',
      rounded: 'none',
    },
    effects: {
      shadows: false,
      gradients: false,
      blur: false,
      borders: true,
    },
  },
  elegant: {
    name: 'Elegant',
    description: 'Sophisticated design with deep purples and rose gold accents',
    colors: {
      primary: '271 81% 56%',      // Deep purple
      secondary: '20 60% 60%',     // Rose gold
      accent: '20 60% 60%',
      background: '270 50% 98%',   // Soft lavender white
      foreground: '271 51% 16%',
      muted: '270 30% 94%',
      mutedForeground: '271 20% 50%',
      card: '0 0% 100%',
      cardForeground: '271 51% 16%',
      border: '270 20% 85%',
    },
    layout: {
      heroStyle: 'split',
      servicesGrid: 'cards',
      contactLayout: 'centered',
      headerStyle: 'transparent',
      footerStyle: 'centered',
    },
    typography: {
      headingWeight: 'semibold',
      bodySize: 'base',
      rounded: '2xl',
    },
    effects: {
      shadows: true,
      gradients: true,
      blur: true,
      borders: false,
    },
  },
};

export const getThemeConfig = (themeStyle: ThemeStyle): ThemeConfig => {
  return THEME_CONFIGS[themeStyle] || THEME_CONFIGS.modern;
};

export const THEME_OPTIONS = Object.entries(THEME_CONFIGS).map(([key, config]) => ({
  value: key as ThemeStyle,
  label: config.name,
  description: config.description,
}));
