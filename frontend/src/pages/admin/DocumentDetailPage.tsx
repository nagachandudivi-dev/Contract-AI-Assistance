import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, CircularProgress, Alert,
  Accordion, AccordionSummary, AccordionDetails, Button, Grid
} from '@mui/material';
import { ExpandMore, ArrowBack, Article, DataObject } from '@mui/icons-material';
import { getDocument, getDocumentChunks } from '../../services/api';
import { DocumentDto, ChunkDto } from '../../types';
import { formatDateTime } from '../../utils/date';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDto | null>(null);
  const [chunks, setChunks] = useState<ChunkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([getDocument(Number(id)), getDocumentChunks(Number(id))])
      .then(([docRes, chunksRes]) => { setDoc(docRes.data); setChunks(chunksRes.data); })
      .catch(() => setError('Failed to load document.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!doc) return null;

  const statusColor = doc.status === 'Ready' ? 'success' : doc.status === 'Failed' ? 'error' : 'warning';

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/documents')} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }} color="primary">Document Details</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box><Typography variant="caption" color="text.secondary">File Name</Typography><Typography sx={{ fontWeight: 600 }}>{doc.originalFileName}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Type</Typography><Chip label={doc.fileType} size="small" sx={{ mt: 0.5 }} /></Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography><br />
                  <Chip label={doc.status} color={statusColor as 'success' | 'error' | 'warning'} size="small" sx={{ mt: 0.5 }} />
                </Box>
                <Box><Typography variant="caption" color="text.secondary">Pages</Typography><Typography sx={{ fontWeight: 600 }}>{doc.totalPages}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Chunks</Typography><Typography sx={{ fontWeight: 600 }}>{doc.chunkCount}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Uploaded</Typography><Typography sx={{ fontWeight: 600 }}>{formatDateTime(doc.uploadDate)}</Typography></Box>
                {doc.errorMessage && <Alert severity="error" sx={{ mt: 1 }}>{doc.errorMessage}</Alert>}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DataObject color="primary" />
                <Typography variant="h6">Extracted Chunks ({chunks.length})</Typography>
              </Box>
              {chunks.length === 0 ? (
                <Typography color="text.secondary">No chunks extracted yet.</Typography>
              ) : (
                chunks.map(chunk => (
                  <Accordion key={chunk.id} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Article fontSize="small" color="primary" />
                        <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>{chunk.chunkTitle}</Typography>
                        <Chip label={`Page ${chunk.pageNumber}`} size="small" />
                        {chunk.rowNumber && <Chip label={`Row ${chunk.rowNumber}`} size="small" />}
                        {chunk.hasEmbedding && <Chip label="Embedded" size="small" color="success" />}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                        {chunk.chunkText}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
