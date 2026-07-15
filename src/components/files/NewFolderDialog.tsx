import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';
import { FolderPlus } from 'lucide-react';

interface NewFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<boolean>;
}

export const NewFolderDialog: React.FC<NewFolderDialogProps> = ({
  open,
  onClose,
  onCreate
}) => {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    setError(null);

    const success = await onCreate(folderName.trim());
    setLoading(false);

    if (success) {
      setFolderName('');
      onClose();
    } else {
      setError('Folder could not be created. Name may be invalid or already exist.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 6,
          p: 2,
          bgcolor: 'background.paper',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, pt: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: 'primary.light',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FolderPlus size={24} />
          </Box>
          <DialogTitle sx={{ p: 0, fontWeight: 700, fontSize: '1.25rem' }}>
            New Folder
          </DialogTitle>
        </Box>

        <DialogContent sx={{ mt: 2, px: 2 }}>
          <TextField
            label="Folder Name"
            placeholder="e.g. Documents, Backups, Media"
            fullWidth
            autoFocus
            required
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            error={Boolean(error)}
            helperText={error || 'No reserved characters like / \\ : * ? " < > |'}
            variant="outlined"
            InputProps={{ sx: { borderRadius: 3 } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 1, gap: 1 }}>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600, px: 3 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !folderName.trim()}
            sx={{ fontWeight: 600, px: 3, borderRadius: 3 }}
          >
            {loading ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
