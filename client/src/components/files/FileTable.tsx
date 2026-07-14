import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  IconButton,
  Button,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Code,
  File as FileIcon,
  ArrowUpDown,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { FileRowAction } from './FileRowAction';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  extension: string;
}

interface FileTableProps {
  items: FileItem[];
  selectedPaths: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (path: string, checked: boolean) => void;
  onOpenFolder: (path: string) => void;
  onDownloadItem: (item: FileItem) => void;
  onRenameItem: (item: FileItem, newName: string) => Promise<boolean>;
  onDeleteItem: (item: FileItem) => void;
  onBulkDelete: () => void;
  onDropFiles: (files: FileList) => void;
}

type SortField = 'name' | 'modifiedAt' | 'size';
type SortOrder = 'asc' | 'desc';

export const FileTable: React.FC<FileTableProps> = ({
  items,
  selectedPaths,
  onSelectAll,
  onSelectItem,
  onOpenFolder,
  onDownloadItem,
  onRenameItem,
  onDeleteItem,
  onBulkDelete,
  onDropFiles
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isDragging, setIsDragging] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Folders always first unless sorting solely by size
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      let compare = 0;
      if (sortField === 'name') {
        compare = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      } else if (sortField === 'modifiedAt') {
        compare = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      } else if (sortField === 'size') {
        compare = a.size - b.size;
      }

      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [items, sortField, sortOrder]);

  const allSelected = items.length > 0 && selectedPaths.length === items.length;
  const someSelected = selectedPaths.length > 0 && selectedPaths.length < items.length;

  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) {
      return <Folder size={22} color="#6750A4" fill="rgba(103, 80, 164, 0.2)" />;
    }
    const ext = item.extension.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon size={22} color="#E91E63" />;
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return <Video size={22} color="#FF9800" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      return <Music size={22} color="#9C27B0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive size={22} color="#795548" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'sh', 'c', 'cpp'].includes(ext)) {
      return <Code size={22} color="#00BCD4" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx'].includes(ext)) {
      return <FileText size={22} color="#4CAF50" />;
    }
    return <FileIcon size={22} color="#607D8B" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '—';
    if (bytes > 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes > 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${bytes} B`;
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        position: 'relative',
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minHeight: 320
      }}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(103, 80, 164, 0.92)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            transition: 'opacity 0.2s'
          }}
        >
          <UploadCloud size={64} style={{ marginBottom: 16 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Drop files to start chunked upload!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Automatic multi-GB resumable transfer directly to Termux
          </Typography>
        </Box>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedPaths.length > 0 && (
        <Paper
          elevation={6}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            bgcolor: 'surface.containerHighest',
            px: 3,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {selectedPaths.length} {selectedPaths.length === 1 ? 'item' : 'items'} selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<Trash2 size={16} />}
              onClick={onBulkDelete}
              size="small"
              sx={{ borderRadius: 3 }}
            >
              Delete Selected
            </Button>
          </Box>
        </Paper>
      )}

      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'surface.container' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  color="primary"
                />
              </TableCell>
              <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer', fontWeight: 700 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Name
                  <ArrowUpDown size={14} style={{ opacity: sortField === 'name' ? 1 : 0.4 }} />
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('modifiedAt')} sx={{ cursor: 'pointer', fontWeight: 700 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Date Modified
                  <ArrowUpDown size={14} style={{ opacity: sortField === 'modifiedAt' ? 1 : 0.4 }} />
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('size')} sx={{ cursor: 'pointer', fontWeight: 700 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Size
                  <ArrowUpDown size={14} style={{ opacity: sortField === 'size' ? 1 : 0.4 }} />
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box sx={{ color: 'text.secondary' }}>
                    <Folder size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      This folder is empty
                    </Typography>
                    <Typography variant="body2">
                      Upload files or create a folder using the buttons above or drag and drop.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item) => {
                const isChecked = selectedPaths.includes(item.path);
                return (
                  <TableRow
                    key={item.path}
                    hover
                    selected={isChecked}
                    onClick={() => {
                      if (item.isDirectory) {
                        onOpenFolder(item.path);
                      }
                    }}
                    sx={{
                      cursor: item.isDirectory ? 'pointer' : 'default',
                      '&:hover': {
                        bgcolor: 'surface.containerLow'
                      }
                    }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => onSelectItem(item.path, e.target.checked)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {getFileIcon(item)}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: item.isDirectory ? 600 : 500,
                            color: item.isDirectory ? 'primary.main' : 'text.primary',
                            wordBreak: 'break-word'
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {formatDate(item.modifiedAt)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {formatSize(item.size)}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <FileRowAction
                        item={item}
                        onDownload={onDownloadItem}
                        onRename={onRenameItem}
                        onDelete={onDeleteItem}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
