import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useDmocFeatures } from '../hooks/useDmocFeatures';
import { dmocApi, DmocNatureOfChange, DmocStatus, getDmocErrorMessage } from '../api/dmocApi';
import type { CreateDmocDraftBody } from '../api/dmocApi';
import { departmentApi } from '../api/lovApi';
import type { Department } from '../api/lovApi';

const CURRENT_USER = 'demo-user';

/**
 * Form state for create/edit DMOC draft.
 */
interface FormState {
  title: string;
  changeOriginatorName: string;
  originatorPosition: string;
  areaOrDepartmentId: string;
  natureOfChange: DmocNatureOfChange;
  targetImplementationDate: string;
  plannedEndDate: string;
  descriptionOfChange: string;
  reasonForChange: string;
  affectedEquipment: string;
  attachmentsOrReferenceLinks: string;
  additionalRemarks: string;
}

const emptyForm: FormState = {
  title: '',
  changeOriginatorName: '',
  originatorPosition: '',
  areaOrDepartmentId: '',
  natureOfChange: DmocNatureOfChange.Permanent,
  targetImplementationDate: '',
  plannedEndDate: '',
  descriptionOfChange: '',
  reasonForChange: '',
  affectedEquipment: '',
  attachmentsOrReferenceLinks: '',
  additionalRemarks: '',
};

/**
 * DMOC Draft page: create new draft or edit existing draft.
 * When EnableDmoc is false, shows "feature not available".
 */
export default function DmocDraftPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { enableDmoc, isLoading: featuresLoading } = useDmocFeatures();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadDraft = useCallback(async () => {
    if (!id || !enableDmoc) return;
    try {
      setLoading(true);
      setError(null);
      const res = await dmocApi.getById(id);
      const d = res.data;
      if (d.status !== DmocStatus.Draft) {
        setError('Only draft DMOCs can be edited.');
        return;
      }
      setForm({
        title: d.title,
        changeOriginatorName: d.changeOriginatorName,
        originatorPosition: d.originatorPosition ?? '',
        areaOrDepartmentId: d.areaOrDepartmentId ?? '',
        natureOfChange: d.natureOfChange,
        targetImplementationDate: d.targetImplementationDate ? d.targetImplementationDate.slice(0, 10) : '',
        plannedEndDate: d.plannedEndDate ? d.plannedEndDate.slice(0, 10) : '',
        descriptionOfChange: d.descriptionOfChange,
        reasonForChange: d.reasonForChange,
        affectedEquipment: d.affectedEquipment ?? '',
        attachmentsOrReferenceLinks: d.attachmentsOrReferenceLinks ?? '',
        additionalRemarks: d.additionalRemarks ?? '',
      });
    } catch (err) {
      console.error('Failed to load draft:', err);
      setError('Failed to load draft.');
    } finally {
      setLoading(false);
    }
  }, [id, enableDmoc]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    let cancelled = false;
    departmentApi.getAll()
      .then((res) => { if (!cancelled) setDepartments(res.data); })
      .catch(() => { if (!cancelled) setDepartments([]); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = (): CreateDmocDraftBody => ({
    title: form.title.trim(),
    changeOriginatorName: form.changeOriginatorName.trim(),
    originatorPosition: form.originatorPosition.trim() || undefined,
    areaOrDepartmentId: form.areaOrDepartmentId || undefined,
    areaOrDepartmentName: form.areaOrDepartmentId ? departments.find((d) => d.id === form.areaOrDepartmentId)?.name : undefined,
    natureOfChange: form.natureOfChange,
    targetImplementationDate: form.targetImplementationDate || undefined,
    plannedEndDate: form.plannedEndDate || undefined,
    descriptionOfChange: form.descriptionOfChange.trim(),
    reasonForChange: form.reasonForChange.trim(),
    affectedEquipment: form.affectedEquipment.trim() || undefined,
    attachmentsOrReferenceLinks: form.attachmentsOrReferenceLinks.trim() || undefined,
    additionalRemarks: form.additionalRemarks.trim() || undefined,
    createdBy: CURRENT_USER,
  });

  const handleSave = async () => {
    if (!enableDmoc) return;
    if (!form.title.trim() || !form.changeOriginatorName.trim() || !form.descriptionOfChange.trim() || !form.reasonForChange.trim()) {
      setSaveError('Title, change originator name, description of change, and reason for change are required.');
      return;
    }
    if (form.natureOfChange === DmocNatureOfChange.Temporary) {
      if (!form.targetImplementationDate || !form.plannedEndDate) {
        setSaveError('Target implementation date and planned end date are required for temporary changes.');
        return;
      }
    }
    try {
      setSaveLoading(true);
      setSaveError(null);
      if (isEdit && id) {
        await dmocApi.updateDraft(id, { ...buildPayload(), modifiedBy: CURRENT_USER });
        navigate(`/dmoc/${id}`);
      } else {
        const res = await dmocApi.createDraft(buildPayload());
        navigate(`/dmoc/${res.data.id}`);
      }
    } catch (err) {
      setSaveError(getDmocErrorMessage(err));
    } finally {
      setSaveLoading(false);
    }
  };

  if (featuresLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
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

  if (isEdit && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isEdit && error) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/dmoc')} sx={{ mb: 2 }}>Back to DMOC List</Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(isEdit && id ? `/dmoc/${id}` : '/dmoc')}>
          Back
        </Button>
        <Typography variant="h4">{isEdit ? 'Edit DMOC Draft' : 'Create DMOC Draft'}</Typography>
      </Box>

      {saveError && (
        <Alert severity="error" onClose={() => setSaveError(null)} sx={{ mb: 2 }}>{saveError}</Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              required
              label="Title"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              required
              label="Change originator name"
              value={form.changeOriginatorName}
              onChange={(e) => handleChange('changeOriginatorName', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Originator position"
              value={form.originatorPosition}
              onChange={(e) => handleChange('originatorPosition', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Area / Department</InputLabel>
              <Select
                label="Area / Department"
                value={form.areaOrDepartmentId}
                onChange={(e) => handleChange('areaOrDepartmentId', e.target.value)}
              >
                <MenuItem value="">—</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Nature of change</InputLabel>
              <Select
                label="Nature of change"
                value={form.natureOfChange}
                onChange={(e) => handleChange('natureOfChange', e.target.value as DmocNatureOfChange)}
              >
                <MenuItem value={DmocNatureOfChange.Permanent}>Permanent</MenuItem>
                <MenuItem value={DmocNatureOfChange.Temporary}>Temporary (max 90 days)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="Target implementation date"
              InputLabelProps={{ shrink: true }}
              value={form.targetImplementationDate}
              onChange={(e) => handleChange('targetImplementationDate', e.target.value)}
              helperText={form.natureOfChange === DmocNatureOfChange.Temporary ? 'Required for temporary' : ''}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="Planned end date"
              InputLabelProps={{ shrink: true }}
              value={form.plannedEndDate}
              onChange={(e) => handleChange('plannedEndDate', e.target.value)}
              helperText={form.natureOfChange === DmocNatureOfChange.Temporary ? 'Required for temporary' : ''}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Description of change"
              value={form.descriptionOfChange}
              onChange={(e) => handleChange('descriptionOfChange', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Reason for change"
              value={form.reasonForChange}
              onChange={(e) => handleChange('reasonForChange', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Affected equipment"
              value={form.affectedEquipment}
              onChange={(e) => handleChange('affectedEquipment', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Attachments or reference links"
              value={form.attachmentsOrReferenceLinks}
              onChange={(e) => handleChange('attachmentsOrReferenceLinks', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Additional remarks"
              value={form.additionalRemarks}
              onChange={(e) => handleChange('additionalRemarks', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saveLoading}>
              {isEdit ? 'Update draft' : 'Create draft'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
