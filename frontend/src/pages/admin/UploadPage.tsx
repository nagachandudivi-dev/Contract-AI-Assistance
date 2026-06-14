import { useState, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, LinearProgress, Alert, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CloudUpload, CheckCircle, Error, PictureAsPdf, Article, TableChart } from '@mui/icons-material';
import { uploadDocument } from '../../services/api';

interface UploadItem { file: File; progress: number; status: 'pending' | 'uploading' | 'done' | 'error'; message?: string; }

const FileIcon = ({ type }: { type: string }) => {
  if (type === 'application/pdf') return <PictureAsPdf color="error" />;
  if (type.includes('word')) return <Article color="primary" />;
  return <TableChart color="success" />;
};

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: File[]) => {
    const allowed = files.filter(f => ['.pdf', '.docx', '.csv'].some(ext => f.name.toLowerCase().endsWith(ext)));
    setItems(prev => [...prev, ...allowed.map(f => ({ file: f, progress: 0, status: 'pending' as const }))]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const uploadAll = async () => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== 'pending') continue;
      setItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'uploading' } : it));
      try {
        await uploadDocument(items[i].file, pct => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, progress: pct } : it)));
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'done', progress: 100 } : it));
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', message: axiosErr.response?.data?.message || 'Upload failed' } : it));
      }
    }
  };

  const clear = () => setItems([]);
  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }} color="primary">Upload Documents</Typography>
      <Card>
        <CardContent>
          <Box
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            sx={{
              border: `2px dashed ${dragOver ? '#86BC25' : '#0A2F6B'}`, borderRadius: 2, p: 4, textAlign: 'center',
              bgcolor: dragOver ? 'rgba(134,188,37,0.05)' : 'rgba(10,47,107,0.02)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <CloudUpload sx={{ fontSize: 56, color: dragOver ? '#86BC25' : '#0A2F6B', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Drop files here or click to browse</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>Supported: PDF, DOCX, CSV &middot; Max 50 MB per file</Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
              {['PDF', 'DOCX', 'CSV'].map(t => <Chip key={t} label={t} size="small" variant="outlined" />)}
            </Box>
            <input id="file-input" type="file" multiple accept=".pdf,.docx,.csv" style={{ display: 'none' }} onChange={handleFileInput} />
          </Box>

          {items.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <List>
                {items.map((item, i) => (
                  <ListItem key={i} divider>
                    <ListItemIcon><FileIcon type={item.file.type} /></ListItemIcon>
                    <ListItemText
                      primary={item.file.name}
                      secondary={
                        <span>
                          <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                          {item.status === 'uploading' && <LinearProgress variant="determinate" value={item.progress} sx={{ mt: 0.5 }} />}
                          {item.message && <span style={{ color: 'red' }}> &mdash; {item.message}</span>}
                        </span>
                      }
                    />
                    {item.status === 'done' && <CheckCircle color="success" />}
                    {item.status === 'error' && <Error color="error" />}
                    {item.status === 'uploading' && <Typography variant="caption">{item.progress}%</Typography>}
                  </ListItem>
                ))}
              </List>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {pendingCount > 0 && (
                  <Button variant="contained" onClick={uploadAll} startIcon={<CloudUpload />}>
                    Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
                  </Button>
                )}
                <Button variant="outlined" onClick={clear}>Clear</Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
      <Alert severity="info" sx={{ mt: 2 }}>
        Documents are processed asynchronously. Text extraction, chunking, and embedding generation begin immediately after upload.
      </Alert>
    </Box>
  );
}
