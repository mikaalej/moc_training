import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Snackbar,
  Autocomplete,
  FormHelperText,
} from '@mui/material';
import {
  Description as StandardIcon,
  FlashOn as BypassIcon,
  Build as OmocIcon,
  Settings as DmocIcon,
} from '@mui/icons-material';
import { mocApi, MocRequestType, RiskLevel } from '../api/mocApi';
import type { CreateMocRequestDto } from '../api/mocApi';
import {
  divisionApi,
  departmentApi,
  sectionApi,
  categoryApi,
  subcategoryApi,
} from '../api/lovApi';
import type { Division, Department, Section, Category, Subcategory } from '../api/lovApi';

/**
 * Request type selection cards.
 */
const requestTypes = [
  {
    type: 'StandardEmoc',
    title: 'Standard EMOC',
    description: 'Standard Engineering Management of Change request',
    icon: <StandardIcon fontSize="large" />,
  },
  {
    type: 'BypassEmoc',
    title: 'Bypass EMOC',
    description: 'Temporary bypass request (max 30 days)',
    icon: <BypassIcon fontSize="large" />,
  },
  {
    type: 'Omoc',
    title: 'OMOC',
    description: 'Operations Management of Change',
    icon: <OmocIcon fontSize="large" />,
  },
  {
    type: 'Dmoc',
    title: 'DMOC',
    description: 'Document Management of Change',
    icon: <DmocIcon fontSize="large" />,
  },
];

/**
 * Steps for the Standard EMOC form.
 */
const standardEmocSteps = [
  'Change Description',
  'Risk Assessment',
  'Documentation',
  'Approvers',
];

/** Map risk level dropdown value to API enum. */
function mapRiskLevel(value: string): RiskLevel | undefined {
  if (value === 'Green' || value === '1') return RiskLevel.Green;
  if (value === 'Yellow' || value === '2') return RiskLevel.Yellow;
  if (value === 'Red' || value === '3') return RiskLevel.Red;
  return undefined;
}

/** Map request type enum to selection key. */
function requestTypeToKey(rt: number): string {
  if (rt === 1) return 'StandardEmoc';
  if (rt === 2) return 'BypassEmoc';
  if (rt === 3) return 'Omoc';
  if (rt === 4) return 'Dmoc';
  return 'StandardEmoc';
}

/** Parse backend error message from axios error (matches backend BadRequest { message }). */
function getBackendErrorMessage(err: unknown): string {
  const ax = err as { response?: { data?: { message?: string; error?: { message?: string }; detail?: string } } };
  const data = ax?.response?.data;
  return data?.message ?? data?.error?.message ?? data?.detail ?? 'Request failed.';
}

/**
 * Create Request page supporting Standard EMOC, Bypass EMOC, OMOC, and DMOC.
 * Fetches LOVs from the API and submits/saves drafts via mocApi.create.
 */
const TEMP_MAX_DAYS = 90;
const BYPASS_MAX_DAYS = 30;

export default function CreateRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdFromUrl = searchParams.get('draftId');
  const [draftId, setDraftId] = useState<string | null>(draftIdFromUrl);
  const [draftLoading, setDraftLoading] = useState(!!draftIdFromUrl);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    divisionId: '',
    departmentId: '',
    sectionId: '',
    categoryId: '',
    subcategoryId: '',
    unitsAffected: '',
    equipmentTag: '',
    isTemporary: false,
    targetImplementationDate: '',
    plannedRestorationDate: '',
    scopeDescription: '',
    riskToolUsed: '',
    riskLevel: '',
    bypassType: '',
    bypassDurationDays: 30,
    isBypassEmergency: false,
  });

  // LOV data from API
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [lovLoading, setLovLoading] = useState(true);
  const [lovError, setLovError] = useState<string | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successSnackbar, setSuccessSnackbar] = useState<string | null>(null);

  // Sync draftId from URL (e.g. after navigating to /create?draftId=xxx)
  useEffect(() => {
    const id = searchParams.get('draftId');
    if (id && id !== draftId) {
      setDraftId(id);
      setDraftLoading(true);
    }
  }, [searchParams]);

  // Load draft when draftId is set (reload draft)
  useEffect(() => {
    if (!draftId) {
      setDraftLoading(false);
      return;
    }
    let cancelled = false;
    mocApi.getById(draftId)
      .then((res) => {
        if (cancelled) return;
        const moc = res.data;
        if (moc.status !== 1) return; // 1 = Draft
        setSelectedType(requestTypeToKey(moc.requestType));
        setFormData({
          title: moc.title,
          divisionId: moc.divisionId,
          departmentId: moc.departmentId,
          sectionId: moc.sectionId,
          categoryId: moc.categoryId,
          subcategoryId: moc.subcategoryId,
          unitsAffected: moc.unitsAffected ?? '',
          equipmentTag: moc.equipmentTag ?? '',
          isTemporary: moc.isTemporary,
          targetImplementationDate: moc.targetImplementationDate?.slice(0, 10) ?? '',
          plannedRestorationDate: moc.plannedRestorationDate?.slice(0, 10) ?? '',
          scopeDescription: moc.scopeDescription ?? '',
          riskToolUsed: moc.riskToolUsed ?? '',
          riskLevel: moc.riskLevelName ?? moc.riskLevel != null ? String(moc.riskLevel) : '',
          bypassType: moc.bypassType ?? '',
          bypassDurationDays: moc.bypassDurationDays ?? 30,
          isBypassEmergency: moc.isBypassEmergency ?? false,
        });
      })
      .catch(() => { if (!cancelled) setSubmitError('Failed to load draft.'); })
      .finally(() => { if (!cancelled) setDraftLoading(false); });
    return () => { cancelled = true; };
  }, [draftId]);

  // Load divisions and categories on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLovLoading(true);
        setLovError(null);
        const [divRes, catRes] = await Promise.all([
          divisionApi.getAll(),
          categoryApi.getAll(),
        ]);
        if (!cancelled) {
          setDivisions(divRes.data);
          setCategories(catRes.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load LOVs:', err);
          setLovError('Failed to load divisions and categories.');
        }
      } finally {
        if (!cancelled) setLovLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load departments when division changes; clear dependent selections
  useEffect(() => {
    if (!formData.divisionId) {
      setDepartments([]);
      return;
    }
    let cancelled = false;
    departmentApi.getByDivision(formData.divisionId)
      .then((res) => { if (!cancelled) setDepartments(res.data); })
      .catch(() => { if (!cancelled) setDepartments([]); });
    return () => { cancelled = true; };
  }, [formData.divisionId]);

  // Load sections when department changes
  useEffect(() => {
    if (!formData.departmentId) {
      setSections([]);
      return;
    }
    let cancelled = false;
    sectionApi.getByDepartment(formData.departmentId)
      .then((res) => { if (!cancelled) setSections(res.data); })
      .catch(() => { if (!cancelled) setSections([]); });
    return () => { cancelled = true; };
  }, [formData.departmentId]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!formData.categoryId) {
      setSubcategories([]);
      return;
    }
    let cancelled = false;
    subcategoryApi.getByCategory(formData.categoryId)
      .then((res) => { if (!cancelled) setSubcategories(res.data); })
      .catch(() => { if (!cancelled) setSubcategories([]); });
    return () => { cancelled = true; };
  }, [formData.categoryId]);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setActiveStep(0);
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      setSelectedType(null);
    } else {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Clear child LOV selections when parent changes
      if (field === 'divisionId') {
        next.departmentId = '';
        next.sectionId = '';
      } else if (field === 'departmentId') {
        next.sectionId = '';
      } else if (field === 'categoryId') {
        next.subcategoryId = '';
      }
      return next;
    });
  };

  /** Request type enum from selected type key. */
  const getRequestType = (): MocRequestType => {
    if (selectedType === 'BypassEmoc') return MocRequestType.BypassEmoc;
    if (selectedType === 'Omoc') return MocRequestType.Omoc;
    if (selectedType === 'Dmoc') return MocRequestType.Dmoc;
    return MocRequestType.StandardEmoc;
  };

  /** Build DTO for create (Standard EMOC or shared fields). Backend requires valid IDs and TargetImplementationDate. */
  const buildCreateDto = (saveAsDraft: boolean): CreateMocRequestDto => {
    const targetDate = formData.targetImplementationDate
      ? new Date(formData.targetImplementationDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const plannedDate = formData.plannedRestorationDate
      ? new Date(formData.plannedRestorationDate).toISOString().slice(0, 10)
      : undefined;
    return {
      requestType: getRequestType(),
      title: formData.title || (saveAsDraft ? 'Draft' : 'Untitled'),
      divisionId: formData.divisionId as string,
      departmentId: formData.departmentId as string,
      sectionId: formData.sectionId as string,
      categoryId: formData.categoryId as string,
      subcategoryId: formData.subcategoryId as string,
      unitsAffected: formData.unitsAffected || undefined,
      equipmentTag: formData.equipmentTag || undefined,
      isTemporary: formData.isTemporary,
      targetImplementationDate: targetDate,
      plannedRestorationDate: formData.isTemporary ? plannedDate : undefined,
      scopeDescription: formData.scopeDescription || undefined,
      riskToolUsed: formData.riskToolUsed || undefined,
      riskLevel: mapRiskLevel(formData.riskLevel),
      saveAsDraft,
    };
  };

  /** Build DTO for Bypass EMOC (includes bypass fields, max 30 days). */
  const buildBypassDto = (saveAsDraft: boolean): CreateMocRequestDto => {
    const base = buildCreateDto(saveAsDraft);
    const duration = Math.min(Math.max(1, formData.bypassDurationDays ?? 30), BYPASS_MAX_DAYS);
    return {
      ...base,
      requestType: MocRequestType.BypassEmoc,
      bypassDurationDays: duration,
      isBypassEmergency: formData.isBypassEmergency,
      bypassType: formData.bypassType || undefined,
    };
  };

  /** Validate temporary: planned restoration must be within 90 days of target implementation. */
  const validateTemporaryDates = (): string | null => {
    if (!formData.isTemporary) return null;
    if (!formData.targetImplementationDate || !formData.plannedRestorationDate) return null;
    const target = new Date(formData.targetImplementationDate);
    const planned = new Date(formData.plannedRestorationDate);
    const days = (planned.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
    if (days > TEMP_MAX_DAYS) return `Temporary change: restoration date must be within ${TEMP_MAX_DAYS} days of implementation.`;
    if (planned < target) return 'Planned restoration date must be on or after target implementation date.';
    return null;
  };

  const validateForSubmit = (): string | null => {
    if (!formData.title?.trim()) return 'Title is required.';
    if (!formData.divisionId) return 'Division is required.';
    if (!formData.departmentId) return 'Department is required.';
    if (!formData.sectionId) return 'Section is required.';
    if (!formData.categoryId) return 'Category is required.';
    if (!formData.subcategoryId) return 'Subcategory is required.';
    if (!formData.targetImplementationDate) return 'Target implementation date is required.';
    const tempErr = validateTemporaryDates();
    if (tempErr) return tempErr;
    if (selectedType === 'BypassEmoc') {
      const d = formData.bypassDurationDays ?? 30;
      if (d < 1 || d > BYPASS_MAX_DAYS) return `Bypass duration must be 1–${BYPASS_MAX_DAYS} days.`;
    }
    return null;
  };

  const handleSaveDraft = async () => {
    if (!formData.divisionId || !formData.departmentId || !formData.sectionId || !formData.categoryId || !formData.subcategoryId) {
      setSubmitError('Please complete Division, Department, Section, Category, and Subcategory to save a draft.');
      return;
    }
    const tempErr = validateTemporaryDates();
    if (tempErr) {
      setSubmitError(tempErr);
      return;
    }
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      if (draftId) {
        const updateDto = {
          title: formData.title || 'Draft',
          divisionId: formData.divisionId,
          departmentId: formData.departmentId,
          sectionId: formData.sectionId,
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId,
          unitsAffected: formData.unitsAffected || undefined,
          equipmentTag: formData.equipmentTag || undefined,
          isTemporary: formData.isTemporary,
          targetImplementationDate: formData.targetImplementationDate ? new Date(formData.targetImplementationDate).toISOString().slice(0, 10) : undefined,
          plannedRestorationDate: formData.isTemporary && formData.plannedRestorationDate ? new Date(formData.plannedRestorationDate).toISOString().slice(0, 10) : undefined,
          scopeDescription: formData.scopeDescription || undefined,
          riskToolUsed: formData.riskToolUsed || undefined,
          riskLevel: mapRiskLevel(formData.riskLevel),
          ...(selectedType === 'BypassEmoc' && {
            bypassDurationDays: Math.min(Math.max(1, formData.bypassDurationDays ?? 30), BYPASS_MAX_DAYS),
            isBypassEmergency: formData.isBypassEmergency,
            bypassType: formData.bypassType || undefined,
          }),
        };
        await mocApi.update(draftId, updateDto);
        setSuccessSnackbar('Draft updated.');
      } else {
        const dto = selectedType === 'BypassEmoc' ? buildBypassDto(true) : buildCreateDto(true);
        const res = await mocApi.create(dto);
        setDraftId(res.data.id);
        setSuccessSnackbar(`Draft saved. Control number: ${res.data.controlNumber}`);
      }
      setSubmitLoading(false);
    } catch (err: unknown) {
      setSubmitLoading(false);
      setSubmitError(getBackendErrorMessage(err));
    }
  };

  const handleSubmit = async () => {
    const err = validateForSubmit();
    if (err) {
      setSubmitError(err);
      return;
    }
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      if (draftId) {
        await mocApi.submit(draftId);
        const res = await mocApi.getById(draftId);
        setSubmitLoading(false);
        setSuccessSnackbar(`Request submitted. Control number: ${res.data.controlNumber}`);
        navigate(`/mocs/${draftId}`, { replace: true });
      } else {
        const dto = selectedType === 'BypassEmoc' ? buildBypassDto(false) : buildCreateDto(false);
        const res = await mocApi.create(dto);
        setSubmitLoading(false);
        setSuccessSnackbar(`Request submitted. Control number: ${res.data.controlNumber}`);
        navigate(`/mocs/${res.data.id}`, { replace: true });
      }
    } catch (err: unknown) {
      setSubmitLoading(false);
      setSubmitError(getBackendErrorMessage(err));
    }
  };

  // Draft load or LOV loading state
  if (draftLoading || (lovLoading && selectedType)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (lovError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={() => setLovError(null)}>{lovError}</Alert>
      </Box>
    );
  }

  // Type selection screen
  if (!selectedType) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Create Request
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Select the type of MOC request you want to create
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
          Project Type
        </Typography>

        <Grid container spacing={3}>
          {requestTypes.map((rt) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={rt.type}>
              <Card>
                <CardActionArea onClick={() => handleTypeSelect(rt.type)}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>{rt.icon}</Box>
                    <Typography variant="h6" gutterBottom>
                      {rt.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rt.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Standard EMOC form
  const renderStandardEmocForm = () => (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {standardEmocSteps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Part 1: Change Description */}
      {activeStep === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              fullWidth
              options={divisions.filter((d) => d.isActive)}
              getOptionLabel={(opt) => opt.name}
              value={divisions.find((d) => d.id === formData.divisionId) ?? null}
              onChange={(_, v) => handleInputChange('divisionId', v?.id ?? '')}
              renderInput={(params) => <TextField {...params} label="Division" required />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              fullWidth
              options={departments.filter((d) => d.isActive)}
              getOptionLabel={(opt) => opt.name}
              value={departments.find((d) => d.id === formData.departmentId) ?? null}
              onChange={(_, v) => handleInputChange('departmentId', v?.id ?? '')}
              disabled={!formData.divisionId}
              renderInput={(params) => <TextField {...params} label="Department" required />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              fullWidth
              options={sections.filter((s) => s.isActive)}
              getOptionLabel={(opt) => opt.name}
              value={sections.find((s) => s.id === formData.sectionId) ?? null}
              onChange={(_, v) => handleInputChange('sectionId', v?.id ?? '')}
              disabled={!formData.departmentId}
              renderInput={(params) => <TextField {...params} label="Section" required />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              fullWidth
              options={categories.filter((c) => c.isActive)}
              getOptionLabel={(opt) => opt.name}
              value={categories.find((c) => c.id === formData.categoryId) ?? null}
              onChange={(_, v) => handleInputChange('categoryId', v?.id ?? '')}
              renderInput={(params) => <TextField {...params} label="Category" required />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              fullWidth
              options={subcategories.filter((s) => s.isActive)}
              getOptionLabel={(opt) => opt.name}
              value={subcategories.find((s) => s.id === formData.subcategoryId) ?? null}
              onChange={(_, v) => handleInputChange('subcategoryId', v?.id ?? '')}
              disabled={!formData.categoryId}
              renderInput={(params) => <TextField {...params} label="Subcategory" required />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Units Affected"
              value={formData.unitsAffected}
              onChange={(e) => handleInputChange('unitsAffected', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Equipment Tag"
              value={formData.equipmentTag}
              onChange={(e) => handleInputChange('equipmentTag', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isTemporary}
                  onChange={(e) => handleInputChange('isTemporary', e.target.checked)}
                />
              }
              label="Temporary Change"
            />
            <FormHelperText>Permanent or temporary. If temporary, restoration within {TEMP_MAX_DAYS} days of implementation.</FormHelperText>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Target Implementation Date"
              value={formData.targetImplementationDate}
              onChange={(e) => handleInputChange('targetImplementationDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {formData.isTemporary && (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="date"
                label="Planned Restoration Date"
                value={formData.plannedRestorationDate}
                onChange={(e) => handleInputChange('plannedRestorationDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText={`Within ${TEMP_MAX_DAYS} days of implementation`}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Scope Description"
              value={formData.scopeDescription}
              onChange={(e) => handleInputChange('scopeDescription', e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      {/* Part 2: Risk Assessment */}
      {activeStep === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              fullWidth
              freeSolo
              options={['HAZOP', 'JSA', 'LOPA', 'Other']}
              value={formData.riskToolUsed}
              onInputChange={(_, v) => handleInputChange('riskToolUsed', v)}
              renderInput={(params) => <TextField {...params} label="Risk Tool Used" />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              fullWidth
              options={[
                { value: 'Green', label: 'Green (Low)' },
                { value: 'Yellow', label: 'Yellow (Medium)' },
                { value: 'Red', label: 'Red (High)' },
              ]}
              getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
              value={formData.riskLevel ? { value: formData.riskLevel, label: formData.riskLevel === 'Green' ? 'Green (Low)' : formData.riskLevel === 'Yellow' ? 'Yellow (Medium)' : 'Red (High)' } : null}
              onChange={(_, v) => handleInputChange('riskLevel', v != null && typeof v !== 'string' ? v.value : (v as string | null) ?? '')}
              renderInput={(params) => <TextField {...params} label="Risk Level Result" />}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary">
              Upload RA documents and meeting minutes here (file upload coming soon)
            </Typography>
          </Grid>
        </Grid>
      )}

      {/* Part 3: Documentation */}
      {activeStep === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Pre-Implementation Documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document upload functionality will be added here
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Post-Implementation Documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document upload functionality will be added here
            </Typography>
          </Grid>
        </Grid>
      )}

      {/* Part 4: Approvers */}
      {activeStep === 3 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Approver Chain
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Approvers are assigned by role, not by specific person
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2">1. Supervisor</Typography>
              <Typography variant="body2">2. Department Manager</Typography>
              <Typography variant="body2">3. Division Manager (for Yellow/Red risk)</Typography>
              <Typography variant="body2">4. AVP (for Red risk)</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  /** Bypass EMOC form: same LOVs as Standard, plus Permanent/Temporary (90 day max), Emergency, Duration (max 30), Bypass type. */
  const renderBypassEmocForm = () => (
    <Box>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        Bypass EMOC: temporary bypass (max {BYPASS_MAX_DAYS} days). Complete required fields and save as draft or submit.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            fullWidth
            options={divisions.filter((d) => d.isActive)}
            getOptionLabel={(opt) => opt.name}
            value={divisions.find((d) => d.id === formData.divisionId) ?? null}
            onChange={(_, v) => handleInputChange('divisionId', v?.id ?? '')}
            renderInput={(params) => <TextField {...params} label="Division" required />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            fullWidth
            options={departments.filter((d) => d.isActive)}
            getOptionLabel={(opt) => opt.name}
            value={departments.find((d) => d.id === formData.departmentId) ?? null}
            onChange={(_, v) => handleInputChange('departmentId', v?.id ?? '')}
            disabled={!formData.divisionId}
            renderInput={(params) => <TextField {...params} label="Department" required />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            fullWidth
            options={sections.filter((s) => s.isActive)}
            getOptionLabel={(opt) => opt.name}
            value={sections.find((s) => s.id === formData.sectionId) ?? null}
            onChange={(_, v) => handleInputChange('sectionId', v?.id ?? '')}
            disabled={!formData.departmentId}
            renderInput={(params) => <TextField {...params} label="Section" required />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            fullWidth
            options={categories.filter((c) => c.isActive)}
            getOptionLabel={(opt) => opt.name}
            value={categories.find((c) => c.id === formData.categoryId) ?? null}
            onChange={(_, v) => handleInputChange('categoryId', v?.id ?? '')}
            renderInput={(params) => <TextField {...params} label="Category" required />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            fullWidth
            options={subcategories.filter((s) => s.isActive)}
            getOptionLabel={(opt) => opt.name}
            value={subcategories.find((s) => s.id === formData.subcategoryId) ?? null}
            onChange={(_, v) => handleInputChange('subcategoryId', v?.id ?? '')}
            disabled={!formData.categoryId}
            renderInput={(params) => <TextField {...params} label="Subcategory" required />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Units Affected" value={formData.unitsAffected} onChange={(e) => handleInputChange('unitsAffected', e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Equipment Tag" value={formData.equipmentTag} onChange={(e) => handleInputChange('equipmentTag', e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={<Switch checked={formData.isTemporary} onChange={(e) => handleInputChange('isTemporary', e.target.checked)} />}
            label="Temporary Change"
          />
          <FormHelperText>Permanent or temporary. If temporary, restoration within {TEMP_MAX_DAYS} days.</FormHelperText>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            type="date"
            label="Target Implementation Date"
            value={formData.targetImplementationDate}
            onChange={(e) => handleInputChange('targetImplementationDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        {formData.isTemporary && (
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Planned Restoration Date"
              value={formData.plannedRestorationDate}
              onChange={(e) => handleInputChange('plannedRestorationDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText={`Within ${TEMP_MAX_DAYS} days`}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            inputProps={{ min: 1, max: BYPASS_MAX_DAYS }}
            label="Bypass duration (days)"
            value={formData.bypassDurationDays}
            onChange={(e) => handleInputChange('bypassDurationDays', Number(e.target.value) || 30)}
            helperText={`1–${BYPASS_MAX_DAYS} days max`}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={<Switch checked={formData.isBypassEmergency} onChange={(e) => handleInputChange('isBypassEmergency', e.target.checked)} />}
            label="Emergency"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            fullWidth
            freeSolo
            options={['Equipment', 'Process', 'Safety', 'Other']}
            value={formData.bypassType}
            onInputChange={(_, v) => handleInputChange('bypassType', v)}
            renderInput={(params) => <TextField {...params} label="Bypass type" />}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField fullWidth multiline rows={4} label="Scope Description" value={formData.scopeDescription} onChange={(e) => handleInputChange('scopeDescription', e.target.value)} />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create {requestTypes.find((rt) => rt.type === selectedType)?.title}
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        {selectedType === 'StandardEmoc' && renderStandardEmocForm()}
        {selectedType === 'BypassEmoc' && renderBypassEmocForm()}
        {selectedType === 'Omoc' && (
          <Typography>OMOC form (placeholder, ready to expand)</Typography>
        )}
        {selectedType === 'Dmoc' && (
          <Typography>DMOC form (placeholder, ready to expand)</Typography>
        )}

        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)} sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleBack} disabled={submitLoading}>
            {activeStep === 0 ? 'Back to Type Selection' : 'Back'}
          </Button>
          <Box>
            <Button onClick={handleSaveDraft} disabled={submitLoading} sx={{ mr: 1 }}>
              {submitLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            {selectedType === 'BypassEmoc' ? (
              <Button variant="contained" onClick={handleSubmit} disabled={submitLoading}>
                {submitLoading ? 'Submitting...' : 'Submit'}
              </Button>
            ) : activeStep === standardEmocSteps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={submitLoading}>
                {submitLoading ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={!!successSnackbar}
        autoHideDuration={6000}
        onClose={() => setSuccessSnackbar(null)}
        message={successSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
