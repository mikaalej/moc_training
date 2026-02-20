import { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Card, CardContent, CircularProgress, Alert, Chip, LinearProgress, useTheme } from '@mui/material';
import {
  Assignment as MocIcon,
  CheckCircle as ClosedIcon,
  Warning as OverdueIcon,
  Pending as PendingIcon,
  Task as TaskIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { dashboardApi } from '../api/dashboardApi';
import type { DashboardKpis, MonthlyTrend } from '../api/dashboardApi';

/**
 * Dashboard page displaying KPIs and summary statistics.
 * Shows total MOCs, closed MOCs, overdue items, and other key metrics.
 * Fetches real data from the backend API.
 */
export default function Dashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [kpisRes, trendRes] = await Promise.all([
          dashboardApi.getKpis(),
          dashboardApi.getMonthlyTrend(12).catch(() => ({ data: [] as MonthlyTrend[] })),
        ]);
        setKpis(kpisRes.data);
        setMonthlyTrend(trendRes.data ?? []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard KPIs:', err);
        setError('Failed to load dashboard data. Please ensure the API is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!kpis) {
    return null;
  }

  // Chart palette (works in light and dark mode)
  const chartColors = ['#1976d2', '#ed6c02', '#2e7d32', '#9c27b0', '#0288d1', '#d32f2f'];
  const mocTypesPieData = [
    { name: 'Standard EMOC', value: kpis.standardEmocCount },
    { name: 'Bypass EMOC', value: kpis.bypassEmocCount },
    { name: 'OMOC', value: kpis.omocCount },
    { name: 'DMOC', value: kpis.dmocCount },
  ].filter((d) => d.value > 0);
  const riskDonutData = [
    { name: 'Green', value: kpis.greenRiskCount, color: '#4caf50' },
    { name: 'Yellow', value: kpis.yellowRiskCount, color: '#ff9800' },
    { name: 'Red', value: kpis.redRiskCount, color: '#f44336' },
  ].filter((d) => d.value > 0);

  const kpiCards = [
    { title: 'Total MOCs', value: kpis.totalMocs, icon: <MocIcon fontSize="large" />, color: '#1976d2' },
    { title: 'Active MOCs', value: kpis.activeMocs, icon: <PendingIcon fontSize="large" />, color: '#ed6c02' },
    { title: 'Closed MOCs', value: kpis.closedMocs, icon: <ClosedIcon fontSize="large" />, color: '#2e7d32' },
    { title: 'Overdue Temporary', value: kpis.overdueTemporary, icon: <OverdueIcon fontSize="large" />, color: '#d32f2f' },
    { title: 'Pending Tasks', value: kpis.pendingTasks, icon: <TaskIcon fontSize="large" />, color: '#9c27b0' },
    { title: 'Unread Notifications', value: kpis.unreadNotifications, icon: <NotificationIcon fontSize="large" />, color: '#0288d1' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Overview of Management of Change system activity
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        {kpiCards.map((kpi) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={kpi.title}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: kpi.color }}>
                      {kpi.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {kpi.title}
                    </Typography>
                  </Box>
                  <Box sx={{ color: kpi.color, opacity: 1 }}>
                    {kpi.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Secondary Stats — consistent section spacing (mt: 3 matches spacing below title and between sections) */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              MOC Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label={`Standard EMOC: ${kpis.standardEmocCount}`} color="primary" variant="outlined" />
              <Chip label={`Bypass EMOC: ${kpis.bypassEmocCount}`} color="warning" variant="outlined" />
              <Chip label={`OMOC: ${kpis.omocCount}`} color="info" variant="outlined" />
              <Chip label={`DMOC: ${kpis.dmocCount}`} color="secondary" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Drafts: {kpis.draftMocs} | Submitted: {kpis.submittedMocs}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Risk Level Distribution
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ width: 80 }}>Green</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={kpis.totalMocs > 0 ? (kpis.greenRiskCount / kpis.totalMocs) * 100 : 0} 
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: isDark ? 'rgba(76, 175, 80, 0.25)' : '#e8f5e9',
                      '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' },
                    }}
                  />
                </Box>
                <Typography variant="body2">{kpis.greenRiskCount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ width: 80 }}>Yellow</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={kpis.totalMocs > 0 ? (kpis.yellowRiskCount / kpis.totalMocs) * 100 : 0} 
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: isDark ? 'rgba(255, 152, 0, 0.25)' : '#fff8e1',
                      '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' },
                    }}
                  />
                </Box>
                <Typography variant="body2">{kpis.yellowRiskCount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: 80 }}>Red</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={kpis.totalMocs > 0 ? (kpis.redRiskCount / kpis.totalMocs) * 100 : 0} 
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: isDark ? 'rgba(244, 67, 54, 0.25)' : '#ffebee',
                      '& .MuiLinearProgress-bar': { bgcolor: '#f44336' },
                    }}
                  />
                </Box>
                <Typography variant="body2">{kpis.redRiskCount}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Stage Distribution & Metrics — same section spacing as above */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              MOCs by Stage
            </Typography>
            {kpis.stageDistribution.length > 0 ? (
              <Box>
                {kpis.stageDistribution.map((stage) => (
                  <Box key={stage.stage} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2">{stage.stage}</Typography>
                    <Typography variant="body2" fontWeight="bold">{stage.count}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No active MOCs in workflow stages
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Key Metrics
            </Typography>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2">Average Days to Close</Typography>
                <Typography variant="body2" fontWeight="bold">{kpis.averageDaysToClose} days</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2">Temporary Active</Typography>
                <Typography variant="body2" fontWeight="bold">{kpis.temporaryActive}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2">Permanent Active</Typography>
                <Typography variant="body2" fontWeight="bold">{kpis.permanentActive}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2" color="error">Inactive &gt; 60 Days</Typography>
                <Typography variant="body2" fontWeight="bold" color="error">{kpis.inactiveOver60Days}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* KPI Charts — pie, donut, bar+line combo, line (similar to reference dashboard) */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        KPI Charts
      </Typography>
      <Grid container spacing={3}>
        {/* Pie: MOC Types distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" gutterBottom color="text.secondary">
              MOC Types
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              {mocTypesPieData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={mocTypesPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {mocTypesPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">No MOC type data</Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Donut: Risk level distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" gutterBottom color="text.secondary">
              Risk Level Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              {riskDonutData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={riskDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">No risk level data</Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Combo: Monthly created (bars) + closed (line) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" gutterBottom color="text.secondary">
              Monthly MOCs Created vs Closed
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              {monthlyTrend.length > 0 ? (
                <ComposedChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : '#eee'} />
                  <XAxis dataKey="monthName" tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} />
                  <YAxis tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} />
                  <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                  <Legend />
                  <Bar dataKey="createdCount" name="Created" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="closedCount" name="Closed" stroke="#2e7d32" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">No monthly trend data</Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Line: MOCs created over time */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" gutterBottom color="text.secondary">
              MOCs Created Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              {monthlyTrend.length > 0 ? (
                <LineChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : '#eee'} />
                  <XAxis dataKey="monthName" tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} />
                  <YAxis tick={{ fontSize: 11 }} stroke={theme.palette.text.secondary} />
                  <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                  <Line type="monotone" dataKey="createdCount" name="Created" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">No monthly trend data</Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
