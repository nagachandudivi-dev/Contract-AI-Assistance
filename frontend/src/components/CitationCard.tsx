import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { Article, Tag } from '@mui/icons-material';
import { CitationDto } from '../types';

interface Props { citation: CitationDto; index: number; }

export default function CitationCard({ citation, index }: Props) {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Article fontSize="small" color="primary" />
          <Typography variant="subtitle2" color="primary">Source {index + 1}: {citation.sourceDocument}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
          <Chip icon={<Tag />} label={citation.sectionTitle} size="small" variant="outlined" />
          <Chip label={`Page ${citation.pageNumber}`} size="small" variant="outlined" />
          {citation.rowNumber && <Chip label={`Row ${citation.rowNumber}`} size="small" variant="outlined" />}
        </Box>
        {citation.chunkText && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
            &ldquo;{citation.chunkText.slice(0, 200)}{citation.chunkText.length > 200 ? '...' : ''}&rdquo;
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
