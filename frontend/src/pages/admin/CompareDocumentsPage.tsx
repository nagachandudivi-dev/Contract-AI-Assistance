import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, OutlinedInput, Checkbox, ListItemText, TextField, Stack, Chip
} from '@mui/material';
import { CompareArrows, Add, Search } from '@mui/icons-material';
import { getDocuments, compareDocuments } from '../../services/api';
import { DocumentDto, CompareResponse } from '../../types';

export default function CompareDocumentsPage() {
  const [docs, setDocs] = useState<DocumentDto[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [keyword, setKeyword] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocuments()
      .then(r => setDocs(r.data.filter((d: DocumentDto) => d.status === 'Ready')))
      .catch(() => setError('Failed to load documents.'));
  }, []);

  const addKeyword = () => {
    const trimmed = keyword.trim();
    if (!trimmed || keywords.includes(trimmed)) return;
    setKeywords(prev => [...prev, trimmed]);
    setKeyword('');
  };

  const handleCompare = async () => {
    if (selected.length < 2 || keywords.length === 0) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await compareDocuments(selected, keywords);
      setResult(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Comparison failed.');
    } finally { setLoading(false); }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }} color="primary">Compare Documents</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Step 1 — pick documents */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Step 1 — Select documents to compare</Typography>
            <FormControl sx={{ minWidth: 340 }}>
              <InputLabel>Select Documents (2+)</InputLabel>
              <Select
                multiple value={selected}
                onChange={e => setSelected(e.target.value as number[])}
                input={<OutlinedInput label="Select Documents (2+)" />}
                renderValue={sel =>
                  (sel as number[]).map(id => docs.find(d => d.id === id)?.originalFileName ?? String(id)).join(', ')
                }
              >
                {docs.map(d => (
                  <MenuItem key={d.id} value={d.id}>
                    <Checkbox checked={selected.includes(d.id)} />
                    <ListItemText primary={d.originalFileName} secondary={`${d.fileType} · ${d.chunkCount} chunks`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Step 2 — search keywords */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Step 2 — Type a keyword or topic to compare (e.g. "experience", "education", "warranty")
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search keyword or topic..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                sx={{ width: 360 }}
                slotProps={{ input: { startAdornment: <Search sx={{ color: 'grey.400', mr: 1, fontSize: 20 }} /> } }}
              />
              <Button variant="outlined" onClick={addKeyword} disabled={!keyword.trim()} startIcon={<Add />}>
                Add
              </Button>
            </Box>
            {keywords.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {keywords.map(k => (
                  <Chip key={k} label={k} onDelete={() => setKeywords(prev => prev.filter(x => x !== k))}
                    color="primary" variant="outlined" size="small" />
                ))}
              </Stack>
            )}
          </Box>

          {/* Compare button */}
          <Box>
            <Button
              variant="contained" size="large"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CompareArrows />}
              onClick={handleCompare}
              disabled={selected.length < 2 || keywords.length === 0 || loading}
            >
              Compare
            </Button>
            {selected.length < 2 && <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>Select at least 2 documents</Typography>}
            {selected.length >= 2 && keywords.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>Add at least one keyword</Typography>}
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Comparison Results</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ width: 140, fontWeight: 700 }}>Keyword</TableCell>
                    {result.fields[0]?.values.map(v => (
                      <TableCell key={v.documentId} sx={{ fontWeight: 700 }}>{v.documentName}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.fields.map(field => (
                    <TableRow key={field.fieldName} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0A2F6B', verticalAlign: 'top' }}>{field.fieldName}</TableCell>
                      {field.values.map(v => (
                        <TableCell key={v.documentId} sx={{ fontSize: '0.8rem', color: v.value === 'Not found' ? 'text.disabled' : 'text.primary', verticalAlign: 'top' }}>
                          {v.value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
