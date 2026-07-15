import React from 'react';
import { Box, Skeleton, Paper } from '@mui/material';

export const SkeletonLoader: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
      <Skeleton variant="rounded" height={48} sx={{ borderRadius: 4 }} />
      <Paper sx={{ p: 2, borderRadius: 5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <Skeleton variant="circular" width={28} height={28} />
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="text" width="20%" height={24} sx={{ ml: 'auto' }} />
              <Skeleton variant="text" width="15%" height={24} />
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
