import { useState, useEffect, useCallback } from 'react';
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
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { mocApi, RiskLevel, MocStatus } from '../api/mocApi';
import type { MocRequestListItem, MocListFilters, PagedResult } from '../api/mocApi';
import { divisionApi } from '../api/lovApi';
import type { Division } from '../api/lovApi';

/**
 * Tab panel component.
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/**
 * MOC List page with tabs for different list views.
 * Supports filtering, searching, sorting, pagination, and export.
 * Fetches real data from the backend API.
 */
export default function MocList() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MocListFilters>({});
  const [divisions, setDivisions] = useState<Division[]>([]);
  
  const [data, setData] = useState<PagedResult<MocRequestListItem>>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch divisions for filter dropdown
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const response = await divisionApi.getAll();
        setDivisions(response.data);
      } catch (err) {
        console.error('Failed to fetch divisions:', err);
      }
    };
    fetchDivisions();
  }, []);

  // Fetch MOC data based on current tab and filters
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: MocListFilters = {
        ...filters,
        search: searchTerm || undefined,
        page: page + 1,
        pageSize: rowsPerPage,
      };

      let response;
      switch (tabValue) {
        case 0: // Active
          response = await mocApi.getActive(params);
          break;
        case 1: // Inactive
          response = await mocApi.getInactive(params);
          break;
        case 2: // Approved
          response = await mocApi.getApproved(params);
          break;
        case 3: // For Restoration
          response = await mocApi.getForRestoration(params);
          break;
        case 4: // Closed
          response = await mocApi.getClosed(params);
          break;
        case 5: // Bypass
          response = await mocApi.getBypass(params);
          break;
        case 6: // Drafts
          response = await mocApi.getDrafts(params);
          break;
        default:
          response = await mocApi.getAll(params);
      }

      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch MOC data:', err);
      setError('Failed to load MOC data. Please ensure the API is running.');
    } finally {
      setLoading(false);
    }
  }, [tabValue, filters, searchTerm, page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getRiskLevelColor = (level?: RiskLevel) => {
    switch (level) {
      case RiskLevel.Green: return 'success';
      case RiskLevel.Yellow: return 'warning';
      case RiskLevel.Red: return 'error';
      default: return 'default';
    }
  };

  const getRowStyle = (moc: MocRequestListItem) => {
    if (moc.isOverdue) return { backgroundColor: '#ffebee' };
    if (moc.daysInactive && moc.daysInactive > 60) return { backgroundColor: '#fff3e0' };
    if (moc.riskLevel === RiskLevel.Red) return { backgroundColor: '#ffcdd2' };
    if (moc.riskLevel === RiskLevel.Yellow) return { backgroundColor: '#fff9c4' };
    if (moc.riskLevel === RiskLevel.Green) return { backgroundColor: '#c8e6c9' };
    return {};
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchor(null);
  };

  const handleExport = async (format: 'csv') => {
    handleExportClose();
    try {
      const response = await mocApi.exportCsv(filters);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moc-export-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const MocTable = () => (
    <>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Control #</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Target Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No MOC requests found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((moc) => (
                    <TableRow key={moc.id} sx={getRowStyle(moc)}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {moc.controlNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{moc.title}</TableCell>
                      <TableCell>
                        <Chip label={moc.requestTypeName} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={moc.riskLevelName || 'N/A'}
                          size="small"
                          color={getRiskLevelColor(moc.riskLevel) as any}
                        />
                      </TableCell>
                      <TableCell>{moc.currentStageName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={moc.statusName} 
                          size="small" 
                          color={moc.status === MocStatus.Active ? 'primary' : moc.status === MocStatus.Closed ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={moc.isOverdue ? 'error' : 'inherit'}
                        >
                          {formatDate(moc.targetImplementationDate)}
                          {moc.isOverdue && ' (Overdue)'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/mocs/${moc.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {moc.status === MocStatus.Draft && (
                          <Tooltip title="Edit">
                            <IconButton size="small">
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
    </>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">MOC List</Typography>
        <Box>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={() => handleExport('csv')}>Export CSV</MenuItem>
          </Menu>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchData}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, control number, equipment tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Grid>
          {showFilters && (
            <>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Risk Level</InputLabel>
                  <Select
                    value={filters.riskLevel || ''}
                    label="Risk Level"
                    onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value={RiskLevel.Green}>Green</MenuItem>
                    <MenuItem value={RiskLevel.Yellow}>Yellow</MenuItem>
                    <MenuItem value={RiskLevel.Red}>Red</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Division</InputLabel>
                  <Select
                    value={filters.divisionId || ''}
                    label="Division"
                    onChange={(e) => setFilters({ ...filters, divisionId: e.target.value || undefined })}
                  >
                    <MenuItem value="">All</MenuItem>
                    {divisions.map((div) => (
                      <MenuItem key={div.id} value={div.id}>{div.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Temporary</InputLabel>
                  <Select
                    value={filters.isTemporary === undefined ? '' : filters.isTemporary ? 'true' : 'false'}
                    label="Temporary"
                    onChange={(e) => setFilters({ ...filters, isTemporary: e.target.value === '' ? undefined : e.target.value === 'true' })}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Temporary</MenuItem>
                    <MenuItem value="false">Permanent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Button variant="outlined" onClick={() => { setFilters({}); setSearchTerm(''); }}>
                  Clear Filters
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* MOC List Tabs */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Active MOCs" />
          <Tab label="Inactive MOCs" />
          <Tab label="Approved MOCs" />
          <Tab label="For Restoration" />
          <Tab label="Closed MOCs" />
          <Tab label="Bypass EMOCs" />
          <Tab label="Drafts" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <MocTable />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <MocTable />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <MocTable />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <MocTable />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <MocTable />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <MocTable />
        </TabPanel>
        <TabPanel value={tabValue} index={6}>
          <MocTable />
        </TabPanel>
      </Paper>
    </Box>
  );
}
