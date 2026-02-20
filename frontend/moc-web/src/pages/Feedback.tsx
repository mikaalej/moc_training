import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { feedbackApi } from '../api/feedbackApi';
import type { FeedbackEntry, CreateFeedbackDto } from '../api/feedbackApi';

/**
 * Feedback & Lessons Learned page.
 * Allows submitting feedback and viewing existing entries, with a toggle for lessons learned only.
 */
export default function Feedback() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [lessonsOnly, setLessonsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateFeedbackDto>({
    mocRequestId: '',
    title: '',
    message: '',
    isLessonLearned: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadEntries = async (lessonsLearnedOnly: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const res = await feedbackApi.getAll(
        lessonsLearnedOnly ? { lessonsLearnedOnly: true } : undefined,
      );
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      setError('Failed to load feedback. Please ensure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries(lessonsOnly);
  }, [lessonsOnly]);

  const handleFormChange = (field: keyof CreateFeedbackDto, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!form.message.trim()) {
      setFormError('Message is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const payload: CreateFeedbackDto = {
        title: form.title.trim(),
        message: form.message.trim(),
        isLessonLearned: form.isLessonLearned,
        mocRequestId: form.mocRequestId?.trim() || undefined,
      };

      await feedbackApi.create(payload);

      // Reset form and reload list (respecting current lessonsOnly filter)
      setForm({
        mocRequestId: '',
        title: '',
        message: '',
        isLessonLearned: form.isLessonLearned,
      });
      await loadEntries(lessonsOnly);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to submit feedback.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Feedback &amp; Lessons Learned
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Capture feedback and lessons learned from MOC requests. Mark items as lessons learned so they can be reviewed
        and reused during future changes.
      </Typography>

      {/* Submit feedback */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Submit feedback
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Related MOC ID (optional)"
              fullWidth
              size="small"
              value={form.mocRequestId ?? ''}
              onChange={(e) => handleFormChange('mocRequestId', e.target.value)}
              helperText="Paste the MOC request GUID if applicable."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Title"
              fullWidth
              size="small"
              value={form.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
              placeholder="Short summary"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Message"
              fullWidth
              size="small"
              multiline
              minRows={3}
              maxRows={6}
              value={form.message}
              onChange={(e) => handleFormChange('message', e.target.value)}
              required
              placeholder="Describe the feedback or lesson learned."
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={form.isLessonLearned}
                    onChange={(e) => handleFormChange('isLessonLearned', e.target.checked)}
                  />
                }
                label="This is a lesson learned"
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleSubmit}
                disabled={saving}
                sx={{ minWidth: 120 }}
              >
                {saving ? 'Submitting…' : 'Submit feedback'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* List & filters */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6">Recent feedback</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={lessonsOnly}
                onChange={(e) => setLessonsOnly(e.target.checked)}
              />
            }
            label="Show lessons learned only"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No feedback entries found.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Created</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Lesson?</TableCell>
                  <TableCell>MOC</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>{formatDate(e.createdAtUtc)}</TableCell>
                    <TableCell>{e.title}</TableCell>
                    <TableCell>
                      {e.isLessonLearned ? (
                        <Chip label="Lesson learned" color="success" size="small" />
                      ) : (
                        <Chip label="Feedback" variant="outlined" size="small" />
                      )}
                    </TableCell>
                    <TableCell>{e.mocControlNumber ?? '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {e.message}
                      </Typography>
                    </TableCell>
                    <TableCell>{e.createdBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

