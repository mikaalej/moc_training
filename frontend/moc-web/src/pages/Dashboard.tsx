import { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Card, CardContent, CircularProgress, Alert, Chip, LinearProgress } from '@mui/material';
import {
  Assignment as MocIcon,
  CheckCircle as ClosedIcon,
  Warning as OverdueIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingIcon,
  Task as TaskIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { dashboardApi } from '../api/dashboardApi';
import type { DashboardKpis } from '../api/dashboardApi';

/**
 * Dashboard page displaying KPIs and summary statistics.
 * Shows total MOCs, closed MOCs, overdue items, and other key metrics.
 * Fetches real data from the backend API.
 */
export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getKpis();
        setKpis(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard KPIs:', err);
        setError('Failed to load dashboard data. Please ensure the API is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
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
                  <Box sx={{ color: kpi.color, opacity: 0.7 }}>
                    {kpi.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Secondary Stats */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
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
                    sx={{ height: 10, borderRadius: 5, bgcolor: '#e8f5e9', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }}
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
                    sx={{ height: 10, borderRadius: 5, bgcolor: '#fff8e1', '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' } }}
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
                    sx={{ height: 10, borderRadius: 5, bgcolor: '#ffebee', '& .MuiLinearProgress-bar': { bgcolor: '#f44336' } }}
                  />
                </Box>
                <Typography variant="body2">{kpis.redRiskCount}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Stage Distribution & Metrics */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              MOCs by Stage
            </Typography>
            {kpis.stageDistribution.length > 0 ? (
              <Box>
                {kpis.stageDistribution.map((stage) => (
                  <Box key={stage.stage} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #eee' }}>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant="body2">Average Days to Close</Typography>
                <Typography variant="body2" fontWeight="bold">{kpis.averageDaysToClose} days</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant="body2">Temporary Active</Typography>
                <Typography variant="body2" fontWeight="bold">{kpis.temporaryActive}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
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
    </Box>
  );
}
