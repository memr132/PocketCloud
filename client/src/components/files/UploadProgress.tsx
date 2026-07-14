import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  Chip,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  UploadCloud,
  ChevronUp,
  ChevronDown,
  Pause,
  Play,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { uploadService, UploadTaskState } from '../../services/uploadService';

export const UploadProgress: React.FC = () => {
  const [tasks, setTasks] = useState<UploadTaskState[]>([]);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const unsubscribe = uploadService.subscribe((currentTasks) => {
      setTasks([...currentTasks]);
    });
    return () => unsubscribe();
  }, []);

  if (tasks.length === 0) {
    return null;
  }

  const activeCount = tasks.filter((t) => t.status === 'uploading' || t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <Paper
      elevation={12}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: { xs: 'calc(100% - 32px)', sm: 400 },
        maxHeight: 460,
        zIndex: 1300,
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)'
      }}
    >
      {/* Header Bar */}
      <Box
        onClick={() => setMinimized(!minimized)}
        sx={{
          bgcolor: 'surface.containerHighest',
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: minimized ? 'none' : '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UploadCloud size={20} color="#6750A4" />
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            File Uploads ({activeCount > 0 ? `${activeCount} active` : 'Finished'})
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {completedCount > 0 && (
            <Chip
              label="Clear Done"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                uploadService.clearCompleted();
              }}
              sx={{ height: 22, fontSize: '0.75rem', mr: 1 }}
            />
          )}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}>
            {minimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </IconButton>
        </Box>
      </Box>

      {/* Task List */}
      <Collapse in={!minimized}>
        <List sx={{ maxHeight: 360, overflowY: 'auto', p: 0 }}>
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isError = task.status === 'error';
            const isPaused = task.status === 'paused';

            return (
              <ListItem
                key={task.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 240
                    }}
                  >
                    {task.file.name}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isCompleted && <CheckCircle2 size={18} color="#4CAF50" />}
                    {isError && (
                      <Tooltip title={task.error || 'Upload error'}>
                        <span><AlertCircle size={18} color="#F44336" /></span>
                      </Tooltip>
                    )}

                    {!isCompleted && !isError && (
                      <>
                        <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (isPaused) {
                                uploadService.startOrResume(task.id);
                              } else {
                                uploadService.pauseTask(task.id);
                              }
                            }}
                          >
                            {isPaused ? <Play size={16} color="#6750A4" /> : <Pause size={16} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton size="small" onClick={() => uploadService.cancelTask(task.id)}>
                            <X size={16} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={task.progress}
                  color={isCompleted ? 'success' : isError ? 'error' : isPaused ? 'warning' : 'primary'}
                  sx={{ height: 6, borderRadius: 3, mb: 0.75 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {task.status.toUpperCase()} — {task.speed}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {task.progress}%
                  </Typography>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </Paper>
  );
};
