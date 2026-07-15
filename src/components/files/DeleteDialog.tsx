import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetName: string;
  isBulk: boolean;
  count?: number;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  targetName,
  isBulk,
  count = 0
}) => {
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, pt: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            bgcolor: 'error.light',
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AlertTriangle size={24} />
        </Box>
        <DialogTitle sx={{ p: 0, fontWeight: 700, fontSize: '1.25rem' }}>
          Confirm Deletion
        </DialogTitle>
      </Box>

      <DialogContent sx={{ mt: 2, px: 2 }}>
        {isBulk ? (
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete <strong>{count} selected items</strong>? This action will remove them from your tablet's local storage and cannot be undone.
          </Typography>
        ) : (
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete <strong>"{targetName}"</strong>? This action will remove it from your tablet's local storage and cannot be undone.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 1, gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600, px: 3 }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ fontWeight: 600, px: 3, borderRadius: 3 }}
        >
          Yes, Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
