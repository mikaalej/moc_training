import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as SubmitIcon,
  SkipNext as AdvanceIcon,
  Pause as InactiveIcon,
  PlayCircle as ReactivateIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { mocApi, MocStatus, MocStage, RiskLevel } from '../api/mocApi';
import type { MocRequestDetail, MocActionItem, MocDocument, MocApprover } from '../api/mocApi';

/**
 * MOC Detail page: full request view with workflow actions.
 * Fetches by id from API; supports Submit (draft), Advance Stage, Mark Inactive, Reactivate.
 */
export default function MocDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moc, setMoc] = useState<MocRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'submit' | 'advance' | 'inactive' | 'reactivate' | null>(null);

  const fetchMoc = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await mocApi.getById(id);
      setMoc(res.data);
    } catch (err) {
      console.error('Failed to load MOC:', err);
      setError('Failed to load MOC. It may not exist or the API is unavailable.');
      setMoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoc();
  }, [id]);

  const handleBack = () => navigate('/mocs');

  const handleAction = async () => {
    if (!id || !confirmAction) return;
    try {
      setActionLoading(true);
      setActionError(null);
      switch (confirmAction) {
        case 'submit':
          await mocApi.submit(id);
          break;
        case 'advance':
          await mocApi.advanceStage(id);
          break;
        case 'inactive':
          await mocApi.markInactive(id);
          break;
        case 'reactivate':
          await mocApi.reactivate(id);
          break;
      }
      setConfirmAction(null);
      await fetchMoc();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed.';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

  const getStatusColor = (status: MocStatus): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case MocStatus.Draft: return 'default';
      case MocStatus.Submitted: return 'primary';
      case MocStatus.Active: return 'success';
      case MocStatus.Inactive: return 'warning';
      case MocStatus.Approved: return 'success';
      case MocStatus.Closed: return 'default';
      case MocStatus.Cancelled: return 'error';
      default: return 'default';
    }
  };

  const getRiskColor = (risk?: RiskLevel): 'success' | 'warning' | 'error' | 'default' => {
    switch (risk) {
      case RiskLevel.Green: return 'success';
      case RiskLevel.Yellow: return 'warning';
      case RiskLevel.Red: return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !moc) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to MOC List
        </Button>
        <Alert severity="error">{error ?? 'MOC not found.'}</Alert>
      </Box>
    );
  }

  const canSubmit = moc.status === MocStatus.Draft;
  const canAdvance = [MocStatus.Submitted, MocStatus.Active].includes(moc.status) && moc.currentStage !== MocStage.RestorationOrCloseout;
  const canMarkInactive = [MocStatus.Submitted, MocStatus.Active].includes(moc.status);
  const canReactivate = moc.status === MocStatus.Inactive;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          Back to MOC List
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          {moc.controlNumber} — {moc.title}
        </Typography>
        <Chip label={moc.statusName} color={getStatusColor(moc.status)} size="small" sx={{ mr: 1 }} />
        <Chip label={moc.currentStageName} variant="outlined" size="small" />
        {moc.riskLevel != null && (
          <Chip label={moc.riskLevelName ?? `Risk ${moc.riskLevel}`} color={getRiskColor(moc.riskLevel)} size="small" />
        )}
      </Box>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      {/* Workflow actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Workflow
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canSubmit && (
            <Button
              variant="contained"
              size="small"
              startIcon={<SubmitIcon />}
              onClick={() => setConfirmAction('submit')}
              disabled={actionLoading}
            >
              Submit for processing
            </Button>
          )}
          {canAdvance && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AdvanceIcon />}
              onClick={() => setConfirmAction('advance')}
              disabled={actionLoading}
            >
              Advance to next stage
            </Button>
          )}
          {canMarkInactive && (
            <Button
              variant="outlined"
              size="small"
              color="warning"
              startIcon={<InactiveIcon />}
              onClick={() => setConfirmAction('inactive')}
              disabled={actionLoading}
            >
              Mark inactive
            </Button>
          )}
          {canReactivate && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReactivateIcon />}
              onClick={() => setConfirmAction('reactivate')}
              disabled={actionLoading}
            >
              Reactivate
            </Button>
          )}
          {!canSubmit && !canAdvance && !canMarkInactive && !canReactivate && (
            <Typography variant="body2" color="text.secondary">
              No workflow actions available for current status.
            </Typography>
          )}
        </Box>
      </Paper>

      <Grid container spacing={2}>
        {/* Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Change description
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Division</Typography>
                <Typography variant="body2">{moc.divisionName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Department</Typography>
                <Typography variant="body2">{moc.departmentName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Section</Typography>
                <Typography variant="body2">{moc.sectionName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Category / Subcategory</Typography>
                <Typography variant="body2">{moc.categoryName} / {moc.subcategoryName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Units affected</Typography>
                <Typography variant="body2">{moc.unitsAffected || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Equipment tag</Typography>
                <Typography variant="body2">{moc.equipmentTag || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Scope description</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{moc.scopeDescription || '—'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Risk &amp; dates
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Risk tool</Typography>
                <Typography variant="body2">{moc.riskToolUsed || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Target implementation</Typography>
                <Typography variant="body2">{formatDate(moc.targetImplementationDate)}</Typography>
              </Grid>
              {moc.isTemporary && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Planned restoration</Typography>
                  <Typography variant="body2">{formatDate(moc.plannedRestorationDate)}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Meta & approvers */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Request info
            </Typography>
            <Typography variant="caption" color="text.secondary">Originator</Typography>
            <Typography variant="body2">{moc.originator}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Created</Typography>
            <Typography variant="body2">{formatDate(moc.createdAtUtc)} by {moc.createdBy}</Typography>
            {moc.modifiedAtUtc && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Last modified</Typography>
                <Typography variant="body2">{formatDate(moc.modifiedAtUtc)} {moc.modifiedBy ? `by ${moc.modifiedBy}` : ''}</Typography>
              </>
            )}
            {moc.markedInactiveAtUtc && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Marked inactive</Typography>
                <Typography variant="body2">{formatDate(moc.markedInactiveAtUtc)}</Typography>
              </>
            )}
          </Paper>

          {moc.approvers && moc.approvers.length > 0 && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Approvers
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Role</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {moc.approvers.map((a: MocApprover) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.roleKey}</TableCell>
                        <TableCell align="center">
                          {a.isCompleted ? (
                            <Chip size="small" color={a.isApproved ? 'success' : 'default'} label={a.isApproved ? 'Approved' : 'Done'} />
                          ) : (
                            <Chip size="small" variant="outlined" label="Pending" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>

        {/* Action items */}
        {moc.actionItems && moc.actionItems.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Action items
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell align="center">Done</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {moc.actionItems.map((a: MocActionItem) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.description}</TableCell>
                        <TableCell>{formatDate(a.dueDate)}</TableCell>
                        <TableCell align="center">
                          {a.isCompleted ? <CheckIcon color="success" /> : <ScheduleIcon color="disabled" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Documents */}
        {moc.documents && moc.documents.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Documents
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Group</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Link</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {moc.documents.map((d: MocDocument) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.documentGroup}</TableCell>
                        <TableCell>{d.documentType}</TableCell>
                        <TableCell>{d.name}</TableCell>
                        <TableCell>{d.isLink && d.url ? <a href={d.url} target="_blank" rel="noreferrer">Open</a> : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Confirm dialog */}
      <Dialog open={confirmAction !== null} onClose={() => setConfirmAction(null)}>
        <DialogTitle>
          {confirmAction === 'submit' && 'Submit for processing'}
          {confirmAction === 'advance' && 'Advance to next stage'}
          {confirmAction === 'inactive' && 'Mark as inactive'}
          {confirmAction === 'reactivate' && 'Reactivate request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'submit' && 'This will submit the draft and move it to the next stage. Continue?'}
            {confirmAction === 'advance' && 'Move this request to the next workflow stage. Continue?'}
            {confirmAction === 'inactive' && 'Mark this request as inactive. You can reactivate it later. Continue?'}
            {confirmAction === 'reactivate' && 'Reactivate this request. Continue?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button onClick={handleAction} variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
