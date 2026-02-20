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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as SubmitIcon,
  SkipNext as AdvanceIcon,
  Pause as InactiveIcon,
  PlayCircle as ReactivateIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import { mocApi, MocStatus, MocStage, RiskLevel } from '../api/mocApi';
import type { MocRequestDetail, MocActionItem, MocDocument, MocApprover, ActivityLogEntry } from '../api/mocApi';
import { useAuth } from '../contexts/AuthContext';
import { canAdvanceOrChangeWorkflowState, canCompleteApproverSlot } from '../utils/permissions';

/**
 * MOC Detail page: full request view with workflow actions.
 * Fetches by id from API; supports Submit (draft), Advance Stage, Mark Inactive, Reactivate.
 */
export default function MocDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moc, setMoc] = useState<MocRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'submit' | 'advance' | 'inactive' | 'reactivate' | 'resetApprovers' | null>(null);
  const [completeApproverSlot, setCompleteApproverSlot] = useState<{ approverId: string; approved: boolean } | null>(null);
  const [approverRemarks, setApproverRemarks] = useState('');
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

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

  const fetchActivity = async () => {
    if (!id) return;
    try {
      setActivityLoading(true);
      const res = await mocApi.getActivity(id);
      setActivity(res.data ?? []);
    } catch {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchMoc();
  }, [id]);

  // Load activity when MOC is available
  useEffect(() => {
    if (moc?.id) fetchActivity();
  }, [moc?.id]);

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
        case 'resetApprovers':
          await mocApi.resetApprovers(id);
          break;
      }
      setConfirmAction(null);
      await fetchMoc();
      await fetchActivity();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Action failed.';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteApproverConfirm = async () => {
    if (!id || !completeApproverSlot) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await mocApi.completeApprover(id, completeApproverSlot.approverId, {
        approved: completeApproverSlot.approved,
        remarks: approverRemarks.trim() || undefined,
      });
      setCompleteApproverSlot(null);
      setApproverRemarks('');
      await fetchMoc();
      await fetchActivity();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to record approval.';
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

  const canChangeWorkflow = user ? canAdvanceOrChangeWorkflowState(user.roleKey) : false;
  const canSubmit = moc.status === MocStatus.Draft;
  const canAdvance = canChangeWorkflow && (moc.status === MocStatus.Submitted || moc.status === MocStatus.Active) && moc.currentStage !== MocStage.RestorationOrCloseout;
  const canMarkInactive = canChangeWorkflow && (moc.status === MocStatus.Submitted || moc.status === MocStatus.Active);
  const canReactivate = canChangeWorkflow && moc.status === MocStatus.Inactive;

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
          {actionError.includes('approver') && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              To approve: log in as the user for that role (e.g. <strong>approver_departmentmanager</strong> / Test123!), then use the <strong>Approve</strong> or <strong>Reject</strong> buttons in the <strong>Approvers</strong> table below (right column).
            </Typography>
          )}
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

      {/* Approval progress tracker: stepper showing each approval level and completion (who, when) */}
      {moc.approvers && moc.approvers.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimelineIcon fontSize="small" /> Approval progress
          </Typography>
          <Stepper orientation="vertical" activeStep={moc.approvers.filter((a) => a.isCompleted).length}>
            {moc.approvers.map((a: MocApprover) => (
              <Step key={a.id} completed={a.isCompleted}>
                <StepLabel
                  error={a.isCompleted && !a.isApproved}
                  optional={
                    a.isCompleted ? (
                      <Typography variant="caption" color="text.secondary">
                        {a.isApproved ? 'Approved' : 'Rejected'}
                        {a.completedBy && ` by ${a.completedBy}`}
                        {a.completedAtUtc && ` on ${new Date(a.completedAtUtc).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`}
                        {a.remarks && ` — ${a.remarks}`}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Pending</Typography>
                    )
                  }
                >
                  Level {a.levelOrder}: {a.roleKey}
                </StepLabel>
                <StepContent />
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Approvers
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Validation and Final Approval require the corresponding approver to approve before advancing stage. Approvals must be completed in approval level order.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    If you are the next approver (your role matches the first Pending row), use <strong>Approve</strong> or <strong>Reject</strong> in the Actions column below.
                  </Typography>
                  {user?.roleKey && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        <strong>You are logged in as:</strong> {user.roleKey}
                        {moc.approvers.find((ap) => !ap.isCompleted) && (
                          <> | <strong>Next approver needed:</strong> {moc.approvers.find((ap) => !ap.isCompleted)?.roleKey}</>
                        )}
                      </Typography>
                    </Alert>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  onClick={() => setConfirmAction('resetApprovers')}
                  disabled={actionLoading || moc.approvers.every((a) => !a.isCompleted)}
                >
                  Reset all to pending
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Level</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const firstIncompleteId = moc.approvers.find((ap) => !ap.isCompleted)?.id;
                      const userRoleKey = user?.roleKey ?? '';
                      return moc.approvers.map((a: MocApprover) => {
                        const isFirstIncomplete = !a.isCompleted && a.id === firstIncompleteId;
                        const canComplete = isFirstIncomplete && canCompleteApproverSlot(userRoleKey, a.roleKey);
                        return (
                          <TableRow key={a.id}>
                            <TableCell>{a.levelOrder}</TableCell>
                            <TableCell>{a.roleKey}</TableCell>
                            <TableCell align="center">
                              {a.isCompleted ? (
                                <Chip size="small" color={a.isApproved ? 'success' : 'error'} label={a.isApproved ? 'Approved' : 'Rejected'} />
                              ) : (
                                <Chip size="small" variant="outlined" label="Pending" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {!a.isCompleted && (
                                <Box component="span" sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  {canComplete ? (
                                    <>
                                      <Button size="small" color="success" variant="outlined" onClick={() => { setCompleteApproverSlot({ approverId: a.id, approved: true }); setApproverRemarks(''); }} disabled={actionLoading}>
                                        Approve
                                      </Button>
                                      <Button size="small" color="error" variant="outlined" onClick={() => { setCompleteApproverSlot({ approverId: a.id, approved: false }); setApproverRemarks(''); }} disabled={actionLoading}>
                                        Reject
                                      </Button>
                                    </>
                                  ) : isFirstIncomplete ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                                      Only the {a.roleKey} can complete this approval.
                                      {userRoleKey && (
                                        <>
                                          <br />
                                          <strong>You are logged in as: {userRoleKey}</strong>
                                        </>
                                      )}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      Complete earlier approvers first
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
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

        {/* Activity / Audit log: who did what and when */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HistoryIcon fontSize="small" /> Activity log
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Audit trail of actions on this MOC (submitted, approved/rejected, stage advanced, marked inactive, reactivated).
            </Typography>
            {activityLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : activity.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No activity recorded yet.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date &amp; time</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>By</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activity.map((entry: ActivityLogEntry) => {
                      let details = '';
                      try {
                        if (entry.detailsJson) {
                          const d = JSON.parse(entry.detailsJson) as Record<string, unknown>;
                          if (d.RoleKey != null) details = `Role: ${d.RoleKey}${d.Remarks ? ` — ${d.Remarks}` : ''}`;
                          else if (d.FromStage != null && d.ToStage != null) details = `${d.FromStage} → ${d.ToStage}`;
                        }
                      } catch {
                        details = entry.detailsJson ?? '';
                      }
                      return (
                        <TableRow key={entry.id}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {new Date(entry.timestampUtc).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={entry.action}
                              color={entry.action === 'Rejected' ? 'error' : entry.action === 'Approved' ? 'success' : 'default'}
                              variant={entry.action === 'Submitted' || entry.action === 'StageAdvanced' ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                          <TableCell>{entry.actorDisplay}</TableCell>
                          <TableCell sx={{ maxWidth: 280 }}>{details || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Confirm dialog */}
      <Dialog open={confirmAction !== null} onClose={() => setConfirmAction(null)}>
        <DialogTitle>
          {confirmAction === 'submit' && 'Submit for processing'}
          {confirmAction === 'advance' && 'Advance to next stage'}
          {confirmAction === 'inactive' && 'Mark as inactive'}
          {confirmAction === 'reactivate' && 'Reactivate request'}
          {confirmAction === 'resetApprovers' && 'Reset all approvers to pending'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'submit' && 'This will submit the draft and move it to the next stage. Continue?'}
            {confirmAction === 'advance' && 'Move this request to the next workflow stage. Continue?'}
            {confirmAction === 'inactive' && 'Mark this request as inactive. You can reactivate it later. Continue?'}
            {confirmAction === 'reactivate' && 'Reactivate this request. Continue?'}
            {confirmAction === 'resetApprovers' && 'All approver decisions will be cleared and every approval level will be set back to Pending. This cannot be undone. Continue?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button onClick={handleAction} variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete approver dialog (Approve / Reject with optional remarks) */}
      <Dialog open={completeApproverSlot !== null} onClose={() => { setCompleteApproverSlot(null); setApproverRemarks(''); }}>
        <DialogTitle>
          {completeApproverSlot?.approved ? 'Approve' : 'Reject'} request
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {completeApproverSlot?.approved
              ? 'Record your approval. You may add optional remarks below.'
              : 'Record your rejection. You may add optional remarks below.'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks (optional)"
            fullWidth
            multiline
            rows={3}
            value={approverRemarks}
            onChange={(e) => setApproverRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCompleteApproverSlot(null); setApproverRemarks(''); }}>Cancel</Button>
          <Button onClick={handleCompleteApproverConfirm} variant="contained" color={completeApproverSlot?.approved ? 'success' : 'error'} disabled={actionLoading}>
            {actionLoading ? 'Saving...' : (completeApproverSlot?.approved ? 'Approve' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
