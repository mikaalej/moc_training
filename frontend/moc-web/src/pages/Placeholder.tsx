import { Box, Typography, Paper } from '@mui/material';

/**
 * Placeholder page for routes that are not yet implemented.
 * Used for Manuals, Reports, Feedback, Help, and Notifications pages.
 */
interface PlaceholderProps {
  title: string;
  description?: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description || `The ${title} page is under development.`}
        </Typography>
      </Paper>
    </Box>
  );
}
