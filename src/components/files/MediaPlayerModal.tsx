import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import {
  X,
  Download,
  Film,
  Music,
  Image as ImageIcon,
  FileText,
  Code,
  ExternalLink
} from 'lucide-react';
import { FileItem } from './FileTable';

interface MediaPlayerModalProps {
  open: boolean;
  onClose: () => void;
  item: FileItem | null;
  onDownload: (item: FileItem) => void;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  open,
  onClose,
  item,
  onDownload
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState<boolean>(false);

  if (!item) return null;

  const token = localStorage.getItem('pocketcloud_token') || '';
  const streamUrl = `/api/files/stream?path=${encodeURIComponent(item.path)}&token=${encodeURIComponent(token)}`;

  const ext = item.name.split('.').pop()?.toLowerCase() || '';
  const isVideo = ['mp4', 'webm', 'mkv', 'mov', 'avi'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isPdf = ext === 'pdf';
  const isText = ['txt', 'md', 'json', 'js', 'ts', 'py', 'sh', 'env', 'css', 'html', 'xml', 'log'].includes(ext);

  useEffect(() => {
    if (open && isText && item) {
      setTextLoading(true);
      fetch(streamUrl)
        .then((res) => res.text())
        .then((txt) => {
          setTextContent(txt);
          setTextLoading(false);
        })
        .catch(() => {
          setTextContent('Failed to load text preview.');
          setTextLoading(false);
        });
    } else {
      setTextContent(null);
    }
  }, [open, item, isText, streamUrl]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: 'surface.main',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.35)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          bgcolor: 'surface.containerLow',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          {isVideo && <Film size={22} color="#6750A4" />}
          {isAudio && <Music size={22} color="#6750A4" />}
          {isImage && <ImageIcon size={22} color="#6750A4" />}
          {isPdf && <FileText size={22} color="#6750A4" />}
          {isText && <Code size={22} color="#6750A4" />}
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.2rem' } }}>
            {item.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={16} />}
            onClick={() => onDownload(item)}
            sx={{ borderRadius: 20, fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Download
          </Button>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'surface.containerHighest' }}>
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: '#0b0f19', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 380, maxHeight: '80vh' }}>
        {isVideo && (
          <Box
            component="video"
            src={streamUrl}
            controls
            autoPlay
            sx={{ width: '100%', maxHeight: '75vh', bgcolor: '#000' }}
          />
        )}

        {isAudio && (
          <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%', maxWidth: 500 }}>
            <Box
              sx={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(103, 80, 164, 0.4)'
              }}
            >
              <Music size={80} color="#fff" />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                {item.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                Direct Audio Streaming from Tablet
              </Typography>
            </Box>
            <Box
              component="audio"
              src={streamUrl}
              controls
              autoPlay
              sx={{ width: '100%', borderRadius: 2 }}
            />
          </Box>
        )}

        {isImage && (
          <Box
            component="img"
            src={streamUrl}
            alt={item.name}
            sx={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain' }}
          />
        )}

        {isPdf && (
          <Box
            component="iframe"
            src={streamUrl}
            sx={{ width: '100%', height: '75vh', border: 'none' }}
          />
        )}

        {isText && (
          <Box sx={{ width: '100%', height: '70vh', overflow: 'auto', p: 3, bgcolor: '#1a1d24', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
            {textLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 4 }}>
                <CircularProgress size={24} color="inherit" />
                <Typography>Loading text file content...</Typography>
              </Box>
            ) : (
              textContent
            )}
          </Box>
        )}

        {!isVideo && !isAudio && !isImage && !isPdf && !isText && (
          <Box sx={{ p: 6, textAlign: 'center', color: '#fff' }}>
            <Typography variant="h6" gutterBottom>
              Inline preview not supported for this file type.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Download size={18} />}
              onClick={() => onDownload(item)}
              sx={{ mt: 2, borderRadius: 20, px: 4 }}
            >
              Download File ({Math.round(item.size / 1024)} KB)
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
