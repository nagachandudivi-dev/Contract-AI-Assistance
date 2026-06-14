import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Accordion, AccordionSummary,
  AccordionDetails, CircularProgress, Alert, Chip
} from '@mui/material';
import { ExpandMore, QuestionAnswer } from '@mui/icons-material';
import { getQuestionHistory } from '../../services/api';
import { QuestionHistoryDto } from '../../types';
import { formatDate, formatDateTime } from '../../utils/date';

export default function HistoryPage() {
  const [questions, setQuestions] = useState<QuestionHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getQuestionHistory()
      .then(r => setQuestions(r.data))
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }} color="primary">Question History</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {questions.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary" sx={{ textAlign: 'center' }}>No questions asked yet.</Typography></CardContent></Card>
      ) : (
        questions.map(q => (
          <Accordion key={q.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <QuestionAnswer color="primary" fontSize="small" />
                <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>{q.questionText}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(q.createdAt)}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {q.answers.map(a => (
                <Box key={a.id} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{formatDateTime(a.createdAt)}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{a.answerText}</Typography>
                  {a.citations.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">SOURCES</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {a.citations.map((c, i) => (
                          <Chip key={i} label={`${c.sourceDocument} · ${c.sectionTitle} · p.${c.pageNumber}`} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
}
