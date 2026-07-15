import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  InputBase,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import {
  Sun,
  Moon,
  Monitor,
  Search,
  Cloud,
  LogOut,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { useThemeContext } from '../../theme/ThemeContext';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLogout: () => void;
  isLoggedIn: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onLogout,
  isLoggedIn
}) => {
  const { preference, mode, toggleTheme } = useThemeContext();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky" sx={{ zIndex: 1200 }}>
      <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 4 }, gap: 2 }}>
        {/* Brand Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 180 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(103, 80, 164, 0.3)'
            }}
          >
            <Cloud size={26} strokeWidth={2.2} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              PocketCloud
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              Termux + Ngrok Server
            </Typography>
          </Box>
        </Box>

        {/* Search Input Pill */}
        {isLoggedIn && (
          <Box
            sx={{
              flex: 1,
              maxWidth: 520,
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'surface.containerHighest',
              borderRadius: 28, // Material 3 search bar shape
              px: 2.5,
              py: 0.75,
              transition: 'box-shadow 0.2s, background-color 0.2s',
              '&:focus-within': {
                bgcolor: 'background.paper',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                border: '1px solid',
                borderColor: 'primary.main'
              }
            }}
          >
            <Search size={18} style={{ opacity: 0.6, marginRight: 12 }} />
            <InputBase
              placeholder="Search files or folders..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              fullWidth
              sx={{ fontSize: '0.95rem' }}
            />
          </Box>
        )}

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          <Tooltip title="Termux Wakelock Active">
            <Chip
              icon={<ShieldCheck size={14} />}
              label="Tunneled 24/7"
              size="small"
              color="success"
              variant="outlined"
              sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderRadius: 12, fontWeight: 500 }}
            />
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={`Current Theme: ${preference.toUpperCase()} (Click to toggle)`}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                bgcolor: 'surface.containerHigh',
                color: 'text.primary',
                '&:hover': { bgcolor: 'surface.containerHighest' }
              }}
            >
              {preference === 'system' ? (
                <Monitor size={20} />
              ) : mode === 'dark' ? (
                <Moon size={20} />
              ) : (
                <Sun size={20} />
              )}
            </IconButton>
          </Tooltip>

          {/* Account Profile / Logout */}
          {isLoggedIn && (
            <>
              <Tooltip title="Storage Server Profile">
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: 'secondary.light',
                    color: 'secondary.contrastText',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}
                >
                  <HardDrive size={20} />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: '16px',
                    minWidth: 180,
                    mt: 1,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <MenuItem disabled sx={{ opacity: 0.8 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Signed in as Admin
                  </Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    onLogout();
                  }}
                  sx={{ color: 'error.main', mt: 0.5 }}
                >
                  <ListItemIcon sx={{ color: 'error.main' }}>
                    <LogOut size={18} />
                  </ListItemIcon>
                  Lock & Log Out
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
