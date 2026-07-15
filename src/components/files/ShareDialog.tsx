import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  MenuItem,
  Box,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import { Share2, Copy, Check, Lock, Clock, X } from 'lucide-react';
import api from '../../services/api';
import { FileItem } from './FileTable';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  item: FileItem | null;
  onShowNotification: (msg: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  item,
  onShowNotification
}) => {
  const [expiresInHours, setExpiresInHours] = useState<string>('24');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (!open) {
      setShareLink('');
      setPassword('');
      setCopied(false);
      setExpiresInHours('24');
    }
  }, [open]);

  if (!item) return null;

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const res = await api.post('/share/create', {
        itemPath: item.path,
        expiresInHours: expiresInHours === '0' ? null : Number(expiresInHours),
        password: password.trim() || null
      });

      if (res.data.success && res.data.share) {
        const link = `${window.location.origin}/api/share/${res.data.share.shareId}/download`;
        setShareLink(link);
        onShowNotification('Share link created successfully!', 'success');
      }
    } catch (err: any) {
      onShowNotification(err.response?.data?.error || 'Failed to create share link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      onShowNotification('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, p: 1 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Share2 size={22} color="#6750A4" />
          <Typography variant="h6" fontWeight={700}>
            Share "{item.name}"
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {!shareLink ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Generate a public download link so anyone can access this file from your tablet without logging into your admin account.
            </Typography>

            <TextField
              select
              label="Link Expiration"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Clock size={18} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3 }
              }}
            >
              <MenuItem value="1">Expire in 1 Hour</MenuItem>
              <MenuItem value="24">Expire in 24 Hours</MenuItem>
              <MenuItem value="168">Expire in 7 Days</MenuItem>
              <MenuItem value="0">Never Expires</MenuItem>
            </TextField>

            <TextField
              label="Optional Password Protection"
              placeholder="Leave blank for public link"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              type="password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3 }
              }}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              Your public share link is ready! Anyone with this URL can download directly from your tablet.
            </Alert>

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                value={shareLink}
                fullWidth
                InputProps={{
                  readOnly: true,
                  sx: { borderRadius: 3, fontFamily: 'monospace', fontSize: '0.85rem' }
                }}
              />
              <Button
                variant={copied ? 'contained' : 'outlined'}
                color={copied ? 'success' : 'primary'}
                onClick={handleCopyLink}
                sx={{ borderRadius: 3, px: 3, minWidth: 120, fontWeight: 700 }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <Typography variant="button" sx={{ ml: 1 }}>
                  {copied ? 'Copied' : 'Copy'}
                </Typography>
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!shareLink ? (
          <>
            <Button onClick={onClose} color="inherit" sx={{ borderRadius: 20, px: 3 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateShare}
              disabled={loading}
              sx={{ borderRadius: 20, px: 4, fontWeight: 700 }}
            >
              {loading ? 'Generating...' : 'Create Share Link'}
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={onClose} sx={{ borderRadius: 20, px: 4, fontWeight: 700 }}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
