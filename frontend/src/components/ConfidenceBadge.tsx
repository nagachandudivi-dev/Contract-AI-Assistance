import { Chip } from '@mui/material';

interface Props { confidence: string; score?: number; }

export default function ConfidenceBadge({ confidence, score }: Props) {
  const color = confidence === 'High' ? 'success' : confidence === 'Medium' ? 'warning' : 'error';
  const label = score !== undefined ? `${confidence} (${Math.round(score * 100)}%)` : confidence;
  return <Chip label={label} color={color as 'success' | 'warning' | 'error'} size="small" />;
}
