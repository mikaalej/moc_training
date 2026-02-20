import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PlayArrow as SubmitIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import { useDmocFeatures } from '../hooks/useDmocFeatures';
import { dmocApi, DmocStatus, getDmocErrorMessage } from '../api/dmocApi';
import type { DmocDto } from '../api/dmocApi';

/**
 * DMOC Detail page: view one DMOC and perform Submit (draft), Approve/Reject (submitted).
 * When EnableDmoc is false, shows "feature not available".
 */
export default function DmocDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enableDmoc, isLoading: featuresLoading } = useDmocFeatures();
  const [dmoc, setDmoc] = useState<DmocDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'submit' | 'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');

  const fetchDmoc = async () => {
    if (!id || !enableDmoc) return;
    try {
      setLoading(true);
      setError(null);
      const res = await dmocApi.getById(id);
      setDmoc(res.data);
    } catch (err) {
      console.error('Failed to load DMOC:', err);
      setError('Failed to load DMOC. It may not exist or the feature is disabled.');
      setDmoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enableDmoc) fetchDmoc();
    else setLoading(false);
  }, [id, enableDmoc]);

  const handleBack = () => navigate('/dmoc');

  const handleConfirmAction = async () => {
    if (!id || !confirmAction) return;
    try {
      setActionLoading(true);
      setActionError(null);
      switch (confirmAction) {
        case 'submit':
          await dmocApi.submit(id);
          break;
        case 'approve':
          await dmocApi.approve(id, remarks || undefined);
          break;
        case 'reject':
          await dmocApi.reject(id, remarks || undefined);
          break;
      }
      setConfirmAction(null);
      setRemarks('');
      await fetchDmoc();
    } catch (err) {
      setActionError(getDmocErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) =>
    dateString ? new Date(dateString).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

  const getStatusColor = (s: DmocStatus): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (s) {
      case DmocStatus.Draft: return 'default';
      case DmocStatus.Submitted: return 'primary';
      case DmocStatus.Approved: return 'success';
      case DmocStatus.Rejected: return 'error';
      case DmocStatus.Closed: return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (s: DmocStatus) => {
    switch (s) {
      case DmocStatus.Draft: return 'Draft';
      case DmocStatus.Submitted: return 'Submitted';
      case DmocStatus.Approved: return 'Approved';
      case DmocStatus.Rejected: return 'Rejected';
      case DmocStatus.Closed: return 'Closed';
      default: return 'Unknown';
    }
  };

  const natureLabel = dmoc?.natureOfChange === 1 ? 'Temporary' : 'Permanent';

  if (featuresLoading || (enableDmoc && loading)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!enableDmoc) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/dmoc')} sx={{ mb: 2 }}>Back to DMOC List</Button>
        <Alert severity="info">DMOC is not enabled.</Alert>
      </Box>
    );
  }

  if (error || !dmoc) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mb: 2 }}>Back to DMOC List</Button>
        <Alert severity="error">{error ?? 'DMOC not found.'}</Alert>
      </Box>
    );
  }

  const canEdit = dmoc.status === DmocStatus.Draft;
  const canSubmit = dmoc.status === DmocStatus.Draft;
  const canApproveReject = dmoc.status === DmocStatus.Submitted;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<BackIcon />} onClick={handleBack}>Back to DMOC List</Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          {dmoc.dmocNumber ?? 'Draft'} — {dmoc.title}
        </Typography>
        <Chip label={getStatusLabel(dmoc.status)} color={getStatusColor(dmoc.status)} size="small" />
      </Box>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>{actionError}</Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Actions</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canEdit && (
            <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => navigate(`/dmoc/${dmoc.id}/edit`)}>
              Edit draft
            </Button>
          )}
          {canSubmit && (
            <Button variant="contained" size="small" startIcon={<SubmitIcon />} onClick={() => setConfirmAction('submit')} disabled={actionLoading}>
              Submit
            </Button>
          )}
          {canApproveReject && (
            <>
              <Button variant="contained" size="small" color="success" startIcon={<ApproveIcon />} onClick={() => setConfirmAction('approve')} disabled={actionLoading}>
                Approve
              </Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RejectIcon />} onClick={() => setConfirmAction('reject')} disabled={actionLoading}>
                Reject
              </Button>
            </>
          )}
          {!canEdit && !canSubmit && !canApproveReject && (
            <Typography variant="body2" color="text.secondary">No actions available for current status.</Typography>
          )}
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Change details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Description of change</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{dmoc.descriptionOfChange}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Reason for change</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{dmoc.reasonForChange}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Nature of change</Typography>
                <Typography variant="body2">{natureLabel}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Target implementation date</Typography>
                <Typography variant="body2">{formatDate(dmoc.targetImplementationDate)}</Typography>
              </Grid>
              {dmoc.natureOfChange === 1 && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Planned end date</Typography>
                  <Typography variant="body2">{formatDate(dmoc.plannedEndDate)}</Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Affected equipment</Typography>
                <Typography variant="body2">{dmoc.affectedEquipment || '—'}</Typography>
              </Grid>
              {dmoc.attachmentsOrReferenceLinks && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Attachments / references</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{dmoc.attachmentsOrReferenceLinks}</Typography>
                </Grid>
              )}
              {dmoc.additionalRemarks && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Additional remarks</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{dmoc.additionalRemarks}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Request info</Typography>
            <Typography variant="caption" color="text.secondary">Originator</Typography>
            <Typography variant="body2">{dmoc.changeOriginatorName}</Typography>
            {dmoc.originatorPosition && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Position</Typography>
                <Typography variant="body2">{dmoc.originatorPosition}</Typography>
              </>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Area / Department</Typography>
            <Typography variant="body2">{dmoc.areaOrDepartmentName || '—'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Created</Typography>
            <Typography variant="body2">{formatDate(dmoc.createdAtUtc)} by {dmoc.createdBy}</Typography>
            {dmoc.modifiedAtUtc && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Last modified</Typography>
                <Typography variant="body2">{formatDate(dmoc.modifiedAtUtc)} {dmoc.modifiedBy ? `by ${dmoc.modifiedBy}` : ''}</Typography>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={confirmAction !== null} onClose={() => { setConfirmAction(null); setRemarks(''); }}>
        <DialogTitle>
          {confirmAction === 'submit' && 'Submit DMOC'}
          {confirmAction === 'approve' && 'Approve DMOC'}
          {confirmAction === 'reject' && 'Reject DMOC'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'submit' && 'Submit this draft to assign a DMOC number and send for approval?'}
            {confirmAction === 'approve' && 'Approve this DMOC? You may add optional remarks.'}
            {confirmAction === 'reject' && 'Reject this DMOC? You may add optional remarks.'}
          </DialogContentText>
          {(confirmAction === 'approve' || confirmAction === 'reject') && (
            <TextField
              autoFocus
              margin="dense"
              label="Remarks (optional)"
              fullWidth
              multiline
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmAction(null); setRemarks(''); }}>Cancel</Button>
          <Button onClick={handleConfirmAction} variant="contained" color={confirmAction === 'reject' ? 'error' : 'primary'} disabled={actionLoading}>
            {confirmAction === 'submit' && 'Submit'}
            {confirmAction === 'approve' && 'Approve'}
            {confirmAction === 'reject' && 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
