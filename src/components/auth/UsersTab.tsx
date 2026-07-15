import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  InputAdornment,
  Alert
} from '@mui/material';
import { Users, UserPlus, Trash2, Lock, User, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

interface UserItem {
  username: string;
  role: string;
  createdAt: string;
}

export const UsersTab: React.FC<{ onShowNotification: (msg: string, sev?: any) => void }> = ({
  onShowNotification
}) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err: any) {
      onShowNotification(err.response?.data?.error || 'Failed to load guest users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim()) {
      onShowNotification('Username and password are required.', 'warning');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/auth/users', { username: username.trim(), password: password.trim() });
      if (res.data.success) {
        onShowNotification(`Guest user "${username}" created successfully!`, 'success');
        setCreateOpen(false);
        setUsername('');
        setPassword('');
        fetchUsers();
      }
    } catch (err: any) {
      onShowNotification(err.response?.data?.error || 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (!window.confirm(`Are you sure you want to delete guest user "${targetUsername}"?`)) return;
    try {
      const res = await api.delete(`/auth/users/${encodeURIComponent(targetUsername)}`);
      if (res.data.success) {
        onShowNotification(`Deleted user "${targetUsername}"`, 'success');
        fetchUsers();
      }
    } catch (err: any) {
      onShowNotification(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3, pb: 6 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Guest & Shared Accounts
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Create restricted guest accounts where family or friends can ONLY upload and download files
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UserPlus size={18} />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: 20, px: 3, fontWeight: 700 }}
        >
          Add Guest User
        </Button>
      </Box>

      <Alert severity="info" sx={{ borderRadius: 4, alignItems: 'center' }}>
        <Typography variant="body2">
          <strong>Guest Mode Security:</strong> Guest users can browse, preview/stream media, download files, and upload new files to your tablet. They <strong>cannot delete</strong> files, <strong>cannot rename</strong> items, and <strong>cannot access</strong> this admin dashboard.
        </Typography>
      </Alert>

      <Paper sx={{ borderRadius: 5, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'surface.containerLow' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role / Access Level</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created On</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'flex' }}>
                      <Users size={16} />
                    </Box>
                    <Typography fontWeight={700}>Owner (You)</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label="Tablet Admin / Full Control" color="primary" size="small" sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell color="text.secondary">Tablet Setup</TableCell>
                <TableCell align="right">
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>PROTECTED</Typography>
                </TableCell>
              </TableRow>

              {users.map((u) => (
                <TableRow key={u.username} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'surface.containerHighest', display: 'flex' }}>
                        <User size={16} />
                      </Box>
                      <Typography fontWeight={600}>{u.username}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label="Guest (Upload & Download Only)" color="secondary" size="small" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell color="text.secondary">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleDeleteUser(u.username)}
                      color="error"
                      size="small"
                      title="Revoke User Access"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {users.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No extra guest accounts created yet. Click "Add Guest User" above to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Guest Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle fontWeight={700}>Add Guest User</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Guest Username"
            placeholder="e.g. family, friend"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <User size={18} />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          />
          <TextField
            label="Guest Password"
            type="password"
            placeholder="Choose a password for guest"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={18} />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit" sx={{ borderRadius: 20 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={creating}
            sx={{ borderRadius: 20, px: 3, fontWeight: 700 }}
          >
            {creating ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
