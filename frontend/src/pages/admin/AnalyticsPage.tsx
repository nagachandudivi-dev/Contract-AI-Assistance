import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAnalyticsSummary } from '../../services/api';
import { AnalyticsSummaryDto } from '../../types';

const COLORS = ['#0A2F6B', '#86BC25', '#1a4a9e'];

export default function AnalyticsPage() {
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

  const statusData = [
    { name: 'Processed', value: data.processedDocuments },
    { name: 'Failed', value: data.failedDocuments },
    { name: 'Processing', value: data.totalDocuments - data.processedDocuments - data.failedDocuments },
  ].filter(d => d.value > 0);

  const typeData = [
    { name: 'PDF', value: data.documentsByType_PDF },
    { name: 'DOCX', value: data.documentsByType_DOCX },
    { name: 'CSV', value: data.documentsByType_CSV },
  ].filter(d => d.value > 0);

  const statsBar = [
    { metric: 'Documents', count: data.totalDocuments },
    { metric: 'Chunks', count: data.totalChunks },
    { metric: 'Questions', count: data.totalQuestions },
    { metric: 'Answers', count: data.totalAnswers },
  ];

  const renderLabel = ({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}`;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }} color="primary">Analytics</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>System Overview</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statsBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0A2F6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>By File Type</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={renderLabel}>
                    {typeData.map((_entry, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Processing Status</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={renderLabel}>
                    {statusData.map((_entry, i) => <Cell key={i} fill={i === 0 ? '#86BC25' : i === 1 ? '#f44336' : '#ff9800'} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
