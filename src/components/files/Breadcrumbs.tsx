import React from 'react';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import { Home, ChevronRight, CornerUpLeft } from 'lucide-react';

interface BreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentPath, onNavigate }) => {
  const cleanPath = currentPath.replace(/^[/\\]+/, '').replace(/[/\\]+$/, '');
  const segments = cleanPath ? cleanPath.split(/[/\\]+/) : [];

  const handleSegmentClick = (index: number) => {
    if (index === -1) {
      onNavigate('/');
      return;
    }
    const targetPath = '/' + segments.slice(0, index + 1).join('/');
    onNavigate(targetPath);
  };

  const handleGoUp = () => {
    if (segments.length === 0) return;
    if (segments.length === 1) {
      onNavigate('/');
    } else {
      const parentPath = '/' + segments.slice(0, -1).join('/');
      onNavigate(parentPath);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.5,
        p: 1.5,
        px: 2.5,
        bgcolor: 'surface.container',
        borderRadius: 4,
        mb: 2.5
      }}
    >
      <Tooltip title="Go up one folder level">
        <span>
          <IconButton
            onClick={handleGoUp}
            disabled={segments.length === 0}
            size="small"
            sx={{
              mr: 1,
              bgcolor: segments.length > 0 ? 'secondary.light' : 'transparent',
              color: segments.length > 0 ? 'secondary.contrastText' : 'text.disabled'
            }}
          >
            <CornerUpLeft size={18} />
          </IconButton>
        </span>
      </Tooltip>

      <Button
        size="small"
        onClick={() => handleSegmentClick(-1)}
        sx={{
          minWidth: 'auto',
          borderRadius: 3,
          px: 1.5,
          py: 0.5,
          color: segments.length === 0 ? 'primary.main' : 'text.primary',
          fontWeight: segments.length === 0 ? 700 : 500,
          bgcolor: segments.length === 0 ? 'surface.containerHighest' : 'transparent'
        }}
      >
        <Home size={16} style={{ marginRight: 6 }} />
        Home Root
      </Button>

      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight size={16} style={{ opacity: 0.4 }} />
            <Button
              size="small"
              onClick={() => handleSegmentClick(idx)}
              disabled={isLast}
              sx={{
                minWidth: 'auto',
                borderRadius: 3,
                px: 1.5,
                py: 0.5,
                color: isLast ? 'primary.main' : 'text.primary',
                fontWeight: isLast ? 700 : 500,
                bgcolor: isLast ? 'surface.containerHighest' : 'transparent',
                textTransform: 'none'
              }}
            >
              {seg}
            </Button>
          </React.Fragment>
        );
      })}
    </Box>
  );
};
