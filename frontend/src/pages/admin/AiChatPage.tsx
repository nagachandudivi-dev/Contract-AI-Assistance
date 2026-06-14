import { useState, useRef, useEffect } from 'react';
import {
  Box, Card, TextField, Button, Typography, CircularProgress,
  Alert, Divider, Paper
} from '@mui/material';
import { Send, AutoAwesome } from '@mui/icons-material';
import { askQuestion } from '../../services/api';

interface Message { type: 'user' | 'assistant'; text: string; }

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setError('');
    setMessages(prev => [...prev, { type: 'user', text: question }]);
    setLoading(true);
    try {
      const res = await askQuestion(question);
      setMessages(prev => [...prev, { type: 'assistant', text: res.data.answer }]);
    } catch {
      setError('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }} color="primary">AI Assistant</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        The AI answers ONLY from uploaded documents. It will never hallucinate or use outside knowledge.
      </Alert>
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <AutoAwesome sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography color="text.secondary">Ask a question about your uploaded documents</Typography>
            </Box>
          )}
          {messages.map((msg, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              {msg.type === 'user' ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Paper elevation={0} sx={{ p: 2, maxWidth: '75%', bgcolor: '#0A2F6B', color: 'white', borderRadius: '12px 12px 0 12px' }}>
                    <Typography>{msg.text}</Typography>
                  </Paper>
                </Box>
              ) : (
                <Box>
                  <Paper elevation={0} sx={{ p: 2, maxWidth: '85%', bgcolor: 'grey.50', borderRadius: '12px 12px 12px 0', border: '1px solid', borderColor: 'grey.200' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AutoAwesome fontSize="small" color="primary" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }} color="primary">AI Answer</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">Searching documents...</Typography>
            </Box>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          <div ref={bottomRef} />
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth placeholder="Ask a question about your documents..." value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit(); } }}
                disabled={loading} size="small"
                slotProps={{ input: { style: { borderRadius: 24 } } }}
              />
              <Button type="submit" variant="contained" disabled={loading || !input.trim()} sx={{ borderRadius: 3, px: 3 }}>
                <Send />
              </Button>
            </Box>
          </form>
        </Box>
      </Card>
    </Box>
  );
}
