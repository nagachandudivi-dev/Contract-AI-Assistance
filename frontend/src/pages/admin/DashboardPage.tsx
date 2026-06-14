import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';
import { Description, QuestionAnswer, AutoAwesome, CheckCircle } from '@mui/icons-material';
import { getAnalyticsSummary } from '../../services/api';
import { AnalyticsSummaryDto } from '../../types';
import { formatDateTime } from '../../utils/date';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0A2F6B', '#86BC25', '#1a4a9e'];

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalyticsSummary()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const pieData = [
    { name: 'PDF', value: data.documentsByType_PDF },
    { name: 'DOCX', value: data.documentsByType_DOCX },
    { name: 'CSV', value: data.documentsByType_CSV },
  ].filter(d => d.value > 0);

  const stats = [
    { label: 'Total Documents', value: data.totalDocuments, icon: <Description />, color: '#0A2F6B' },
    { label: 'Processed', value: data.processedDocuments, icon: <CheckCircle />, color: '#86BC25' },
    { label: 'Total Chunks', value: data.totalChunks, icon: <AutoAwesome />, color: '#1a4a9e' },
    { label: 'Questions Asked', value: data.totalQuestions, icon: <QuestionAnswer />, color: '#0A2F6B' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }} color="primary">Dashboard</Typography>
      <Grid container spacing={3}>
        {stats.map(s => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.label}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2">{s.label}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                  </Box>
                  <Box sx={{ color: s.color, opacity: 0.8 }}>{s.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {pieData.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Documents by Type</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}`}>
                      {pieData.map((_entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Questions</Typography>
              {data.recentQuestions.length === 0 ? (
                <Typography color="text.secondary">No questions yet.</Typography>
              ) : (
                <List dense>
                  {data.recentQuestions.map(q => (
                    <ListItem key={q.id} divider>
                      <ListItemText primary={q.questionText} secondary={formatDateTime(q.createdAt)} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
