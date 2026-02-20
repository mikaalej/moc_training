import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { dashboardApi } from '../api/dashboardApi';
import { divisionApi } from '../api/lovApi';
import type {
  DashboardKpis,
  DivisionCount,
  CategoryCount,
  RiskLevelCount,
  MonthlyTrend,
  TaskPerformance,
} from '../api/dashboardApi';
import type { Division } from '../api/lovApi';

/**
 * Reports page.
 * Uses dashboard API endpoints to provide richer reporting with filters and breakdown tables.
 */
export default function Reports() {
  const [filters, setFilters] = useState<{
    dateFrom: string;
    dateTo: string;
    divisionId: string;
  }>({
    dateFrom: '',
    dateTo: '',
    divisionId: '',
  });

  const [divisions, setDivisions] = useState<Division[]>([]);

  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [byDivision, setByDivision] = useState<DivisionCount[]>([]);
  const [byCategory, setByCategory] = useState<CategoryCount[]>([]);
  const [byRisk, setByRisk] = useState<RiskLevelCount[]>([]);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [taskPerf, setTaskPerf] = useState<TaskPerformance | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDivisionsIfNeeded = async () => {
    if (divisions.length > 0) return;
    try {
      const res = await divisionApi.getAll();
      setDivisions(res.data);
    } catch (err) {
      // Non-critical: just log
      console.error('Failed to load divisions for reports:', err);
    }
  };

  const handleFilterChange = (field: 'dateFrom' | 'dateTo' | 'divisionId', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Preload divisions so the dropdown always has values when opened.
  useEffect(() => {
    void loadDivisionsIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoad = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        divisionId: filters.divisionId || undefined,
      };

      const [
        kpiRes,
        divRes,
        catRes,
        riskRes,
        trendRes,
        taskRes,
      ] = await Promise.all([
        dashboardApi.getKpis(params),
        dashboardApi.getByDivision(),
        dashboardApi.getByCategory(),
        dashboardApi.getByRiskLevel(),
        dashboardApi.getMonthlyTrend(6),
        dashboardApi.getTaskPerformance(),
      ]);

      setKpis(kpiRes.data);
      setByDivision(divRes.data);
      setByCategory(catRes.data);
      setByRisk(riskRes.data);
      setTrend(trendRes.data);
      setTaskPerf(taskRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to load reports. Please ensure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (item: MonthlyTrend) =>
    `${item.monthName} ${item.year}`;

  const formatPercent = (value: number, total: number) =>
    total > 0 ? `${Math.round((value / total) * 100)}%` : '—';

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Analyze MOC performance by time, division, category, and risk. Use filters to narrow down the data set,
        then review the breakdown tables below.
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Date from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Date to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Division</InputLabel>
              <Select
                label="Division"
                value={filters.divisionId}
                onChange={(e) => handleFilterChange('divisionId', e.target.value)}
                onOpen={() => { void loadDivisionsIfNeeded(); }}
              >
                <MenuItem value="">All divisions</MenuItem>
                {divisions.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              variant="contained"
              onClick={handleLoad}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Loading…' : 'Apply filters'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* KPIs summary */}
      {kpis && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total MOCs
              </Typography>
              <Typography variant="h5">{kpis.totalMocs}</Typography>
              <Typography variant="caption" color="text.secondary">
                Closed: {kpis.closedMocs}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Active
              </Typography>
              <Typography variant="h5">{kpis.activeMocs}</Typography>
              <Typography variant="caption" color="text.secondary">
                Temporary: {kpis.temporaryActive} | Permanent: {kpis.permanentActive}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Draft / Submitted
              </Typography>
              <Typography variant="h5">
                {kpis.draftMocs} / {kpis.submittedMocs}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inactive &gt; 60 days: {kpis.inactiveOver60Days}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Risk &amp; SLA
              </Typography>
              <Typography variant="h5">
                {kpis.redRiskCount} <Chip label="Red" color="error" size="small" sx={{ ml: 1 }} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg days to close: {kpis.averageDaysToClose.toFixed(1)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {loading && !kpis && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Division breakdown */}
      {byDivision.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            By division
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Division</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Active</TableCell>
                  <TableCell align="right">Closed</TableCell>
                  <TableCell align="right">% Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byDivision.map((d) => (
                  <TableRow key={d.divisionId}>
                    <TableCell>{d.divisionName}</TableCell>
                    <TableCell align="right">{d.totalCount}</TableCell>
                    <TableCell align="right">{d.activeCount}</TableCell>
                    <TableCell align="right">{d.closedCount}</TableCell>
                    <TableCell align="right">
                      {formatPercent(d.activeCount, d.totalCount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            By category
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Active</TableCell>
                  <TableCell align="right">Closed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byCategory.map((c) => (
                  <TableRow key={c.categoryId}>
                    <TableCell>{c.categoryName}</TableCell>
                    <TableCell align="right">{c.totalCount}</TableCell>
                    <TableCell align="right">{c.activeCount}</TableCell>
                    <TableCell align="right">{c.closedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Risk breakdown */}
      {byRisk.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            By risk level
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Risk level</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byRisk.map((r) => (
                  <TableRow key={r.riskLevel}>
                    <TableCell>{r.riskLevel}</TableCell>
                    <TableCell align="right">{r.totalCount}</TableCell>
                    <TableCell align="right">{r.activeCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Monthly trend */}
      {trend.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Monthly trend (last {trend.length} months)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Created</TableCell>
                  <TableCell align="right">Closed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trend.map((t) => (
                  <TableRow key={`${t.year}-${t.month}`}>
                    <TableCell>{formatMonth(t)}</TableCell>
                    <TableCell align="right">{t.createdCount}</TableCell>
                    <TableCell align="right">{t.closedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Task performance */}
      {taskPerf && (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Task performance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Total tasks: {taskPerf.totalTasks} | Open: {taskPerf.openTasks} | Completed: {taskPerf.completedTasks} | Overdue:{' '}
            {taskPerf.overdueTasks} | Avg completion days: {taskPerf.averageCompletionDays.toFixed(1)}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Task type</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Open</TableCell>
                  <TableCell align="right">Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taskPerf.tasksByType.map((t) => (
                  <TableRow key={t.taskType}>
                    <TableCell>{t.taskType}</TableCell>
                    <TableCell align="right">{t.totalCount}</TableCell>
                    <TableCell align="right">{t.openCount}</TableCell>
                    <TableCell align="right">{t.completedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

