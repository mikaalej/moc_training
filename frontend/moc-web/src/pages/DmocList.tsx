import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDmocFeatures } from '../hooks/useDmocFeatures';
import { dmocApi, DmocStatus } from '../api/dmocApi';
import type { DmocDto, PagedDmocResult } from '../api/dmocApi';

/** Tab index to status filter. */
const TAB_STATUS: (DmocStatus | undefined)[] = [undefined, DmocStatus.Draft, DmocStatus.Submitted, DmocStatus.Approved, DmocStatus.Rejected];

function getStatusLabel(s: DmocStatus | undefined): string {
  if (s === undefined) return 'All';
  switch (s) {
    case DmocStatus.Draft: return 'Drafts';
    case DmocStatus.Submitted: return 'Submitted';
    case DmocStatus.Approved: return 'Approved';
    case DmocStatus.Rejected: return 'Rejected';
    case DmocStatus.Closed: return 'Closed';
    default: return 'All';
  }
}

function getStatusColor(s: DmocStatus): 'default' | 'primary' | 'success' | 'error' | 'warning' {
  switch (s) {
    case DmocStatus.Draft: return 'default';
    case DmocStatus.Submitted: return 'primary';
    case DmocStatus.Approved: return 'success';
    case DmocStatus.Rejected: return 'error';
    case DmocStatus.Closed: return 'warning';
    default: return 'default';
  }
}

/**
 * DMOC List page: tabs by status, table with view/edit, create draft button.
 * Shown only when EnableDmoc is true; otherwise shows "feature not available".
 */
export default function DmocList() {
  const navigate = useNavigate();
  const { enableDmoc, isLoading: featuresLoading } = useDmocFeatures();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState<PagedDmocResult>({ items: [], totalCount: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enableDmoc) return;
    try {
      setLoading(true);
      setError(null);
      const status = TAB_STATUS[tabValue];
      const res = await dmocApi.list({
        status,
        page: page + 1,
        pageSize: rowsPerPage,
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch DMOC list:', err);
      setError('Failed to load DMOC list.');
    } finally {
      setLoading(false);
    }
  }, [enableDmoc, tabValue, page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string | null) =>
    dateString ? new Date(dateString).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—';

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
        <Typography variant="h4" gutterBottom>DMOC</Typography>
        <Alert severity="info">Departmental Management of Change is not enabled. Contact your administrator.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">DMOC List</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchData} disabled={loading}>
            Refresh
          </Button>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => navigate('/dmoc/create')}>
            Create DMOC Draft
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="All" />
          <Tab label="Drafts" />
          <Tab label="Submitted" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>

        <Box sx={{ pt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>DMOC #</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Originator</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Target date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No DMOC requests found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.items.map((row: DmocDto) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={row.dmocNumber ? 'bold' : undefined}>
                              {row.dmocNumber ?? '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>{row.title}</TableCell>
                          <TableCell>
                            <Chip label={getStatusLabel(row.status)} size="small" color={getStatusColor(row.status)} variant="outlined" />
                          </TableCell>
                          <TableCell>{row.changeOriginatorName}</TableCell>
                          <TableCell>{row.areaOrDepartmentName ?? '—'}</TableCell>
                          <TableCell>{formatDate(row.targetImplementationDate)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => navigate(`/dmoc/${row.id}`)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {row.status === DmocStatus.Draft && (
                              <Tooltip title="Edit draft">
                                <IconButton size="small" onClick={() => navigate(`/dmoc/${row.id}/edit`)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={data.totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
