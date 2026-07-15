import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Cpu,
  HardDrive,
  Activity,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Clock,
  BatteryCharging
} from 'lucide-react';
import api from '../../services/api';

interface SystemStats {
  storage: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    path: string;
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    nodeMemoryUsage: any;
  };
  system: {
    platform: string;
    arch: string;
    cpusCount: number;
    cpuModel: string;
    uptimeSeconds: number;
    nodeUptimeSeconds: number;
    loadAvg: number[];
    isTermux: boolean;
    wakelockActive: boolean;
  };
}

export const SystemDashboard: React.FC<{ onShowNotification: (msg: string, sev?: any) => void }> = ({
  onShowNotification
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/system/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      onShowNotification(err.response?.data?.error || 'Failed to load system metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const storageUsedPercent = stats?.storage.totalBytes
    ? Math.round((stats.storage.usedBytes / stats.storage.totalBytes) * 100)
    : 0;

  const memoryUsedPercent = stats?.memory.totalBytes
    ? Math.round((stats.memory.usedBytes / stats.memory.totalBytes) * 100)
    : 0;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3, pb: 6 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Tablet System Health
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Real-time diagnostics from your self-hosted Android Termux server
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={18} />}
          onClick={fetchStats}
          disabled={loading}
          sx={{ borderRadius: 20, px: 3, fontWeight: 600 }}
        >
          {loading ? 'Refreshing...' : 'Refresh Metrics'}
        </Button>
      </Box>

      {/* Primary Storage & Wakelock Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <HardDrive size={26} color="#6750A4" />
                  <Typography variant="h6" fontWeight={700}>
                    Tablet Storage Gauge
                  </Typography>
                </Box>
                <Chip
                  label={`${storageUsedPercent}% Used`}
                  color={storageUsedPercent > 85 ? 'error' : storageUsedPercent > 70 ? 'warning' : 'primary'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Path: <strong style={{ fontFamily: 'monospace' }}>{stats?.storage.path}</strong>
              </Typography>

              <Box sx={{ my: 3 }}>
                <LinearProgress
                  variant="determinate"
                  value={storageUsedPercent}
                  sx={{
                    height: 14,
                    borderRadius: 7,
                    bgcolor: 'surface.containerHighest',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 7,
                      bgcolor: storageUsedPercent > 85 ? 'error.main' : 'primary.main'
                    }
                  }}
                />
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={4}>
                <Box sx={{ bgcolor: 'surface.containerLow', p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL SPACE</Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>{formatBytes(stats?.storage.totalBytes || 0)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ bgcolor: 'surface.containerLow', p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>USED SPACE</Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>{formatBytes(stats?.storage.usedBytes || 0)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ bgcolor: 'surface.containerLow', p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>FREE SPACE</Typography>
                  <Typography variant="body1" fontWeight={700} color="success.main" sx={{ mt: 0.5 }}>{formatBytes(stats?.storage.freeBytes || 0)}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 5, height: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Activity size={26} color="#6750A4" />
              <Typography variant="h6" fontWeight={700}>
                Wakelock & Status
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ p: 2, borderRadius: 4, bgcolor: stats?.system.wakelockActive ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.08)', borderColor: stats?.system.wakelockActive ? 'success.main' : 'error.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <BatteryCharging size={28} color={stats?.system.wakelockActive ? '#2e7d32' : '#d32f2f'} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    CPU Wakelock: {stats?.system.wakelockActive ? 'ACTIVE (Protected)' : 'INACTIVE'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.system.wakelockActive ? 'Tablet will not go to sleep or drop Wi-Fi during transfers.' : 'Run termux-wake-lock if downloads pause when screen turns off.'}
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card variant="outlined" sx={{ p: 2, borderRadius: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Clock size={22} color="#6750A4" />
                  <Typography variant="body2" fontWeight={600}>Tablet Uptime</Typography>
                </Box>
                <Typography variant="body1" fontWeight={700}>{formatUptime(stats?.system.uptimeSeconds || 0)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Terminal size={22} color="#6750A4" />
                  <Typography variant="body2" fontWeight={600}>Node Server Uptime</Typography>
                </Box>
                <Typography variant="body1" fontWeight={700}>{formatUptime(stats?.system.nodeUptimeSeconds || 0)}</Typography>
              </Box>
            </Card>
          </Paper>
        </Grid>
      </Grid>

      {/* Hardware & RAM Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 3, borderRadius: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Cpu size={24} color="#6750A4" />
                <Typography variant="h6" fontWeight={700}>RAM Memory</Typography>
              </Box>
              <Typography variant="body2" fontWeight={700}>{memoryUsedPercent}% Used</Typography>
            </Box>
            <LinearProgress variant="determinate" value={memoryUsedPercent} sx={{ height: 10, borderRadius: 5, mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Used: <strong>{formatBytes(stats?.memory.usedBytes || 0)}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Total: <strong>{formatBytes(stats?.memory.totalBytes || 0)}</strong></Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 3, borderRadius: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Terminal size={24} color="#6750A4" />
              <Typography variant="h6" fontWeight={700}>System Hardware</Typography>
            </Box>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">PLATFORM</Typography>
                <Typography variant="body2" fontWeight={700}>{stats?.system.isTermux ? 'Android (Termux)' : stats?.system.platform}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">ARCHITECTURE</Typography>
                <Typography variant="body2" fontWeight={700}>{stats?.system.arch.toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">CPU MODEL & CORES</Typography>
                <Typography variant="body2" fontWeight={700} noWrap>{stats?.system.cpuModel} ({stats?.system.cpusCount} Cores)</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
