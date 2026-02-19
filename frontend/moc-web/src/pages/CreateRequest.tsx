import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

/**
 * Create Request page supporting Standard EMOC, Bypass EMOC, OMOC, and DMOC.
 * Fetches LOVs from the API and submits/saves drafts via mocApi.create.
 */
export default function CreateRequest() {
  const navigate = useNavigate();
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

  /** Build DTO for Standard EMOC create. Backend requires valid IDs and TargetImplementationDate. */
  const buildCreateDto = (saveAsDraft: boolean): CreateMocRequestDto => {
    const targetDate = formData.targetImplementationDate
      ? new Date(formData.targetImplementationDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const plannedDate = formData.plannedRestorationDate
      ? new Date(formData.plannedRestorationDate).toISOString().slice(0, 10)
      : undefined;
    return {
      requestType: MocRequestType.StandardEmoc,
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

  const validateForSubmit = (): string | null => {
    if (!formData.title?.trim()) return 'Title is required.';
    if (!formData.divisionId) return 'Division is required.';
    if (!formData.departmentId) return 'Department is required.';
    if (!formData.sectionId) return 'Section is required.';
    if (!formData.categoryId) return 'Category is required.';
    if (!formData.subcategoryId) return 'Subcategory is required.';
    if (!formData.targetImplementationDate) return 'Target implementation date is required.';
    return null;
  };

  const handleSaveDraft = async () => {
    if (!formData.divisionId || !formData.departmentId || !formData.sectionId || !formData.categoryId || !formData.subcategoryId) {
      setSubmitError('Please complete Division, Department, Section, Category, and Subcategory to save a draft.');
      return;
    }
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      const dto = buildCreateDto(true);
      const res = await mocApi.create(dto);
      setSuccessSnackbar(`Draft saved. Control number: ${res.data.controlNumber}`);
      setSubmitLoading(false);
    } catch (err: unknown) {
      setSubmitLoading(false);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save draft.';
      setSubmitError(msg);
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
      const dto = buildCreateDto(false);
      const res = await mocApi.create(dto);
      setSubmitLoading(false);
      setSuccessSnackbar(`Request submitted. Control number: ${res.data.controlNumber}`);
      navigate(`/mocs/${res.data.id}`, { replace: true });
    } catch (err: unknown) {
      setSubmitLoading(false);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit request.';
      setSubmitError(msg);
    }
  };

  // LOV loading state for form
  if (lovLoading && selectedType) {
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
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Select the type of MOC request you want to create
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
            <FormControl fullWidth required>
              <InputLabel>Division</InputLabel>
              <Select
                value={formData.divisionId}
                label="Division"
                onChange={(e) => handleInputChange('divisionId', e.target.value)}
              >
                <MenuItem value="">Select...</MenuItem>
                {divisions.filter((d) => d.isActive).map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.departmentId}
                label="Department"
                onChange={(e) => handleInputChange('departmentId', e.target.value)}
                disabled={!formData.divisionId}
              >
                <MenuItem value="">Select...</MenuItem>
                {departments.filter((d) => d.isActive).map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Section</InputLabel>
              <Select
                value={formData.sectionId}
                label="Section"
                onChange={(e) => handleInputChange('sectionId', e.target.value)}
                disabled={!formData.departmentId}
              >
                <MenuItem value="">Select...</MenuItem>
                {sections.filter((s) => s.isActive).map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.categoryId}
                label="Category"
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
              >
                <MenuItem value="">Select...</MenuItem>
                {categories.filter((c) => c.isActive).map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Subcategory</InputLabel>
              <Select
                value={formData.subcategoryId}
                label="Subcategory"
                onChange={(e) => handleInputChange('subcategoryId', e.target.value)}
                disabled={!formData.categoryId}
              >
                <MenuItem value="">Select...</MenuItem>
                {subcategories.filter((s) => s.isActive).map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <FormControl fullWidth>
              <InputLabel>Risk Tool Used</InputLabel>
              <Select
                value={formData.riskToolUsed}
                label="Risk Tool Used"
                onChange={(e) => handleInputChange('riskToolUsed', e.target.value)}
              >
                <MenuItem value="HAZOP">HAZOP</MenuItem>
                <MenuItem value="JSA">JSA</MenuItem>
                <MenuItem value="LOPA">LOPA</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Risk Level Result</InputLabel>
              <Select
                value={formData.riskLevel}
                label="Risk Level Result"
                onChange={(e) => handleInputChange('riskLevel', e.target.value)}
              >
                <MenuItem value="Green">Green (Low)</MenuItem>
                <MenuItem value="Yellow">Yellow (Medium)</MenuItem>
                <MenuItem value="Red">Red (High)</MenuItem>
              </Select>
            </FormControl>
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create {requestTypes.find((rt) => rt.type === selectedType)?.title}
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        {selectedType === 'StandardEmoc' && renderStandardEmocForm()}
        {selectedType === 'BypassEmoc' && (
          <Typography>Bypass EMOC form (similar structure, coming soon)</Typography>
        )}
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
            {activeStep === standardEmocSteps.length - 1 ? (
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
