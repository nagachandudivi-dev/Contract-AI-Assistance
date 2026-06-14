import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, CircularProgress, Alert, Button, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Delete, Visibility, Refresh } from '@mui/icons-material';
import { getDocuments, deleteDocument } from '../../services/api';
import { DocumentDto } from '../../types';
import { formatDate } from '../../utils/date';

const StatusChip = ({ status }: { status: string }) => {
  const color = status === 'Ready' ? 'success' : status === 'Failed' ? 'error' : 'warning';
  return <Chip label={status} color={color as 'success' | 'error' | 'warning'} size="small" />;
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getDocuments()
      .then(r => setDocs(r.data))
      .catch(() => setError('Failed to load documents.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const confirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await deleteDocument(deleteId);
      setDocs(prev => prev.filter(d => d.id !== deleteId));
    } catch {
      setError('Failed to delete document.');
    }
    setDeleteId(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} color="primary">Documents</Typography>
        <Button startIcon={<Refresh />} onClick={load} variant="outlined">Refresh</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : docs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No documents uploaded yet.</Typography></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pages</TableCell>
                    <TableCell>Chunks</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {docs.map(doc => (
                    <TableRow key={doc.id} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.originalFileName}</Typography></TableCell>
                      <TableCell><Chip label={doc.fileType} size="small" /></TableCell>
                      <TableCell><StatusChip status={doc.status} /></TableCell>
                      <TableCell>{doc.totalPages}</TableCell>
                      <TableCell>{doc.chunkCount}</TableCell>
                      <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => navigate(`/documents/${doc.id}`)} color="primary"><Visibility /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteId(doc.id)} color="error"><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>This will permanently delete the document and all its data.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
