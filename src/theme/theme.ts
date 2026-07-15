import { createTheme, PaletteMode } from '@mui/material';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary?: any;
    surface?: any;
  }
  interface PaletteOptions {
    tertiary?: any;
    surface?: any;
  }
}

export const getM3Theme = (mode: PaletteMode) => {
  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#D0BCFF' : '#6750A4',
        light: mode === 'dark' ? '#E8DEF8' : '#7F67BE',
        dark: mode === 'dark' ? '#4F378B' : '#4F378B',
        contrastText: mode === 'dark' ? '#381E72' : '#FFFFFF',
      },
      secondary: {
        main: mode === 'dark' ? '#CCC2DC' : '#625B71',
        light: mode === 'dark' ? '#E8DEF8' : '#7E768C',
        dark: mode === 'dark' ? '#4A4458' : '#4A4458',
        contrastText: mode === 'dark' ? '#332D41' : '#FFFFFF',
      },
      tertiary: {
        main: mode === 'dark' ? '#EFB8C8' : '#7D5260',
        light: '#FFD8E4',
        dark: '#633B48',
        contrastText: mode === 'dark' ? '#492532' : '#FFFFFF',
      } as any,
      background: {
        default: mode === 'dark' ? '#141218' : '#FEF7FF',
        paper: mode === 'dark' ? '#1D1B20' : '#F3EDF7',
      },
      surface: {
        main: mode === 'dark' ? '#1D1B20' : '#F3EDF7',
        container: mode === 'dark' ? '#211F26' : '#F3EDF7',
        containerHigh: mode === 'dark' ? '#2B2930' : '#ECE6F0',
        containerHighest: mode === 'dark' ? '#36343B' : '#E6E0E9',
      } as any,
      text: {
        primary: mode === 'dark' ? '#E6E1E5' : '#1C1B1F',
        secondary: mode === 'dark' ? '#CAC4D0' : '#49454F',
      },
      divider: mode === 'dark' ? 'rgba(202, 196, 208, 0.12)' : 'rgba(73, 69, 79, 0.12)',
    },
    shape: {
      borderRadius: 16, // Material 3 baseline
    },
    typography: {
      fontFamily: `'Roboto', 'Outfit', sans-serif`,
      h1: { fontSize: '2.5rem', fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' },
      h3: { fontSize: '1.5rem', fontWeight: 500 },
      h4: { fontSize: '1.25rem', fontWeight: 500 },
      h5: { fontSize: '1.1rem', fontWeight: 500 },
      h6: { fontSize: '1rem', fontWeight: 500 },
      body1: { fontSize: '0.95rem', lineHeight: 1.5 },
      body2: { fontSize: '0.85rem', lineHeight: 1.4 },
      button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.02em' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20, // Pill shaped MD3 buttons
            padding: '8px 20px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 6px rgba(0,0,0,0.15)',
            },
          },
          containedPrimary: {
            backgroundColor: mode === 'dark' ? '#D0BCFF' : '#6750A4',
            color: mode === 'dark' ? '#381E72' : '#FFFFFF',
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0px 4px 12px rgba(0,0,0,0.5)'
              : '0px 4px 12px rgba(103, 80, 164, 0.25)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28, // MD3 large dialog surface
            padding: '8px',
            backgroundColor: mode === 'dark' ? '#2B2930' : '#ECE6F0',
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundColor: mode === 'dark' ? '#211F26' : '#F3EDF7',
            backgroundImage: 'none',
            boxShadow: 'none',
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#141218' : '#FEF7FF',
            color: mode === 'dark' ? '#E6E1E5' : '#1C1B1F',
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          },
        },
      },
    },
  });
};
