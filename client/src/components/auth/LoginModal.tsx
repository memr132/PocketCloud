import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { Lock, Cloud, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

interface LoginModalProps {
  open: boolean;
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ open, onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { password });
      if (res.data.success && res.data.token) {
        localStorage.setItem('pocketcloud_token', res.data.token);
        localStorage.setItem('pocketcloud_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.token, res.data.user);
        setPassword('');
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError(err.response.data.error || 'Too many login attempts. Please wait 15 minutes.');
      } else {
        setError(err.response?.data?.error || 'Incorrect admin password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 6,
          p: { xs: 2, sm: 4 },
          bgcolor: 'background.paper',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '20px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(103, 80, 164, 0.35)',
              mb: 2
            }}
          >
            <Cloud size={36} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            PocketCloud
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Enter your secure admin password to access Termux storage.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 3, mb: 3, fontWeight: 500 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Admin Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              variant="outlined"
              InputProps={{
                startAdornment: <Lock size={18} style={{ marginRight: 10, opacity: 0.6 }} />,
                sx: { borderRadius: 3 }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !password.trim()}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 3,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Unlock Server'}
            </Button>
          </Box>
        </form>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 4 }}>
          <ShieldCheck size={16} style={{ opacity: 0.6 }} />
          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            Protected by Rate-Limiting & Signed JWT Bearer Tokens
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
