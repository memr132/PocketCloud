import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tooltip,
  Divider
} from '@mui/material';
import { MoreVertical, Download, Edit3, Trash2, Play, Share2, Eye } from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  extension: string;
}

interface FileRowActionProps {
  item: FileItem;
  userRole?: string;
  onDownload: (item: FileItem) => void;
  onRename: (item: FileItem, newName: string) => Promise<boolean>;
  onDelete: (item: FileItem) => void;
  onOpenMedia?: (item: FileItem) => void;
  onShare?: (item: FileItem) => void;
}

export const FileRowAction: React.FC<FileRowActionProps> = ({
  item,
  userRole = 'owner',
  onDownload,
  onRename,
  onDelete,
  onOpenMedia,
  onShare
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === item.name) {
      setRenameOpen(false);
      return;
    }

    setRenaming(true);
    setError(null);

    const success = await onRename(item, newName.trim());
    setRenaming(false);

    if (success) {
      setRenameOpen(false);
    } else {
      setError('Failed to rename item. Name may be invalid or already exist.');
    }
  };

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: 'surface.containerHighest' }
          }}
        >
          <MoreVertical size={18} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: { borderRadius: '16px', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.16)' }
        }}
      >
        {!item.isDirectory && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              if (onOpenMedia) onOpenMedia(item);
            }}
          >
            <ListItemIcon>
              <Eye size={18} color="#6750A4" />
            </ListItemIcon>
            <ListItemText primary="Preview / Play" />
          </MenuItem>
        )}

        {!item.isDirectory && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onDownload(item);
            }}
          >
            <ListItemIcon>
              <Download size={18} />
            </ListItemIcon>
            <ListItemText primary="Download" />
          </MenuItem>
        )}

        {userRole === 'owner' && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              if (onShare) onShare(item);
            }}
          >
            <ListItemIcon>
              <Share2 size={18} color="#6750A4" />
            </ListItemIcon>
            <ListItemText primary="Share Link" />
          </MenuItem>
        )}

        {userRole === 'owner' && <Divider />}

        {userRole === 'owner' && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setNewName(item.name);
              setRenameOpen(true);
            }}
          >
            <ListItemIcon>
              <Edit3 size={18} />
            </ListItemIcon>
            <ListItemText primary="Rename" />
          </MenuItem>
        )}

        {userRole === 'owner' && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onDelete(item);
            }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <Trash2 size={18} />
            </ListItemIcon>
            <ListItemText primary="Delete" sx={{ color: 'error.main' }} />
          </MenuItem>
        )}
      </Menu>

      {/* Rename Dialog */}
      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        onClick={(e) => e.stopPropagation()}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
      >
        <form onSubmit={handleRenameSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Rename {item.isDirectory ? 'Folder' : 'File'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              autoFocus
              variant="outlined"
              label="New Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              error={Boolean(error)}
              helperText={error}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setRenameOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={renaming || !newName.trim()}
            >
              {renaming ? 'Saving...' : 'Rename'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
