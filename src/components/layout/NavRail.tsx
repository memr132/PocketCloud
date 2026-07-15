import React from 'react';
import {
  Box,
  Typography,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  List,
  ListItemButton
} from '@mui/material';
import {
  Plus,
  Upload,
  FolderPlus,
  Folder,
  HardDrive,
  BookOpen,
  ShieldAlert,
  Activity,
  Users
} from 'lucide-react';

export type TabType = 'files' | 'system' | 'storage' | 'users' | 'docs';

interface NavRailProps {
  onOpenUpload: () => void;
  onOpenNewFolder: () => void;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole?: string;
}

export const NavRail: React.FC<NavRailProps> = ({
  onOpenUpload,
  onOpenNewFolder,
  activeTab,
  onSelectTab,
  userRole = 'owner'
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleFabClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 240 },
        flexShrink: 0,
        bgcolor: 'surface.main',
        borderRight: { xs: 'none', md: 1 },
        borderBottom: { xs: 1, md: 'none' },
        borderColor: 'divider',
        p: { xs: 1.5, md: 3 },
        display: 'flex',
        flexDirection: { xs: 'row', md: 'column' },
        alignItems: { xs: 'center', md: 'stretch' },
        gap: { xs: 2, md: 3 },
        overflowX: { xs: 'auto', md: 'visible' }
      }}
    >
      {/* Primary Material 3 Floating Action Button (FAB) */}
      <Box sx={{ flexShrink: 0 }}>
        <Fab
          variant="extended"
          color="primary"
          onClick={handleFabClick}
          sx={{
            width: { xs: 'auto', md: '100%' },
            height: { xs: 48, md: 56 },
            borderRadius: 4,
            fontWeight: 600,
            fontSize: { xs: '0.85rem', md: '0.95rem' },
            px: { xs: 2, md: 3 },
            boxShadow: '0 4px 12px rgba(103, 80, 164, 0.25)'
          }}
        >
          <Plus size={20} style={{ marginRight: 8 }} />
          New Action
        </Fab>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              borderRadius: '20px',
              minWidth: 210,
              mt: 1,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
            }
          }}
        >
          <MenuItem
            onClick={() => {
              handleClose();
              onOpenUpload();
            }}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <Upload size={20} />
            </ListItemIcon>
            <ListItemText primary="Upload Files" secondary="Chunked multi-GB support" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              handleClose();
              onOpenNewFolder();
            }}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <FolderPlus size={20} />
            </ListItemIcon>
            <ListItemText primary="New Folder" secondary="Create local directory" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Navigation Links */}
      <List sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: { xs: 'nowrap', md: 'nowrap' }, gap: 0.5, flex: 1, p: 0, overflowX: { xs: 'auto', md: 'visible' } }}>
        <ListItemButton
          selected={activeTab === 'files'}
          onClick={() => onSelectTab('files')}
          sx={{
            borderRadius: 20,
            py: 1.25,
            px: 2,
            whiteSpace: 'nowrap',
            '&.Mui-selected': {
              bgcolor: 'secondary.light',
              color: 'secondary.contrastText',
              '&:hover': { bgcolor: 'secondary.light' }
            }
          }}
        >
          <Folder size={18} style={{ marginRight: 10 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            File Manager
          </Typography>
        </ListItemButton>

        {userRole === 'owner' && (
          <ListItemButton
            selected={activeTab === 'system'}
            onClick={() => onSelectTab('system')}
            sx={{
              borderRadius: 20,
              py: 1.25,
              px: 2,
              whiteSpace: 'nowrap',
              '&.Mui-selected': {
                bgcolor: 'secondary.light',
                color: 'secondary.contrastText'
              }
            }}
          >
            <Activity size={18} style={{ marginRight: 10 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              System Health
            </Typography>
          </ListItemButton>
        )}

        {userRole === 'owner' && (
          <ListItemButton
            selected={activeTab === 'users'}
            onClick={() => onSelectTab('users')}
            sx={{
              borderRadius: 20,
              py: 1.25,
              px: 2,
              whiteSpace: 'nowrap',
              '&.Mui-selected': {
                bgcolor: 'secondary.light',
                color: 'secondary.contrastText'
              }
            }}
          >
            <Users size={18} style={{ marginRight: 10 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Guest Accounts
            </Typography>
          </ListItemButton>
        )}

        <ListItemButton
          selected={activeTab === 'storage'}
          onClick={() => onSelectTab('storage')}
          sx={{
            borderRadius: 20,
            py: 1.25,
            px: 2,
            whiteSpace: 'nowrap',
            '&.Mui-selected': {
              bgcolor: 'secondary.light',
              color: 'secondary.contrastText'
            }
          }}
        >
          <HardDrive size={18} style={{ marginRight: 10 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Storage & SD Card
          </Typography>
        </ListItemButton>

        <ListItemButton
          selected={activeTab === 'docs'}
          onClick={() => onSelectTab('docs')}
          sx={{
            borderRadius: 20,
            py: 1.25,
            px: 2,
            whiteSpace: 'nowrap',
            '&.Mui-selected': {
              bgcolor: 'secondary.light',
              color: 'secondary.contrastText'
            }
          }}
        >
          <BookOpen size={18} style={{ marginRight: 10 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Termux Guides
          </Typography>
        </ListItemButton>
      </List>

      {/* Footer Info Box */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          bgcolor: 'surface.containerHighest',
          p: 2,
          borderRadius: 4
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <ShieldAlert size={16} color="#6750A4" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Ngrok Security Note
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.4 }}>
          Always keep your admin password secure and rotate ngrok authtokens if exposed.
        </Typography>
      </Box>
    </Box>
  );
};
