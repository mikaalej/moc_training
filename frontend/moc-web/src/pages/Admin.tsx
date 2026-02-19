import { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  divisionApi,
  departmentApi,
  sectionApi,
  unitApi,
  categoryApi,
  subcategoryApi,
} from '../api/lovApi';
import type {
  Division,
  Department,
  Section,
  Unit,
  Category,
  Subcategory,
} from '../api/lovApi';
import { approvalLevelsApi, rolesApi, usersApi } from '../api';
import type { ApprovalLevel } from '../api/approvalLevelsApi';
import type { Role } from '../api/rolesApi';
import type { User } from '../api/usersApi';

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
 * Admin page for List of Values (LOV) maintenance.
 * Supports CRUD operations for Divisions, Departments, Sections, Units, Categories, Subcategories.
 * Fetches real data from the backend API.
 */
export default function Admin() {
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState({ code: '', name: '', parentId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Data states
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Approval level dialog state (for Add/Edit approval level)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [editApprovalItem, setEditApprovalItem] = useState<ApprovalLevel | null>(null);
  const [approvalFormData, setApprovalFormData] = useState({ order: '' as string | number, roleKey: '', isActive: true });

  // User dialog state (for Add/Edit user)
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editUserItem, setEditUserItem] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({ userName: '', displayName: '', roleKey: '', isActive: true });

  // Fetch all data (LOVs, approval levels, roles). LOVs and roles/approval levels fetched so a 404 on one does not block the rest.
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch LOVs and roles/approval levels in parallel; use allSettled so one failure does not fail the whole load
      const [lovResults, levelsRes, rolesRes, usersRes] = await Promise.all([
        Promise.all([
          divisionApi.getAll(),
          departmentApi.getAll(),
          sectionApi.getAll(),
          unitApi.getAll(),
          categoryApi.getAll(),
          subcategoryApi.getAll(),
        ]),
        approvalLevelsApi.getAll(false).catch(() => ({ data: [] as ApprovalLevel[] })),
        rolesApi.getAll(false).catch(() => ({ data: [] as Role[] })),
        usersApi.getAll(false).catch(() => ({ data: [] as User[] })),
      ]);
      const [divRes, deptRes, secRes, unitRes, catRes, subcatRes] = lovResults;
      setDivisions(divRes.data);
      setDepartments(deptRes.data);
      setSections(secRes.data);
      setUnits(unitRes.data);
      setCategories(catRes.data);
      setSubcategories(subcatRes.data);
      setApprovalLevels(Array.isArray(levelsRes?.data) ? levelsRes.data : []);
      setRoles(Array.isArray(rolesRes?.data) ? rolesRes.data : []);
      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError('Failed to load data. Please ensure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ code: '', name: '', parentId: '' });
    setDialogOpen(true);
  };

  // Approval level: open add dialog
  const handleApprovalAdd = () => {
    setEditApprovalItem(null);
    setApprovalFormData({ order: '', roleKey: '', isActive: true });
    setApprovalDialogOpen(true);
  };

  // Approval level: open edit dialog
  const handleApprovalEdit = (level: ApprovalLevel) => {
    setEditApprovalItem(level);
    setApprovalFormData({ order: level.order, roleKey: level.roleKey, isActive: level.isActive });
    setApprovalDialogOpen(true);
  };

  // Approval level: delete with confirm
  const handleApprovalDelete = async (level: ApprovalLevel) => {
    const roleName = roles.find((r) => r.key === level.roleKey)?.name ?? level.roleKey;
    if (!window.confirm(`Remove approval level ${level.order} (${roleName})?`)) return;
    try {
      await approvalLevelsApi.delete(level.id);
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete approval level:', err);
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  // Approval level: save (create or update)
  const handleApprovalSave = async () => {
    if (!approvalFormData.roleKey.trim()) {
      alert('Please select a role.');
      return;
    }
    try {
      setSaving(true);
      if (editApprovalItem) {
        await approvalLevelsApi.update(editApprovalItem.id, {
          order: approvalFormData.order === '' ? undefined : Number(approvalFormData.order),
          roleKey: approvalFormData.roleKey,
          isActive: approvalFormData.isActive,
        });
      } else {
        await approvalLevelsApi.create({
          order: approvalFormData.order === '' ? undefined : Number(approvalFormData.order),
          roleKey: approvalFormData.roleKey,
          isActive: approvalFormData.isActive,
        });
      }
      setApprovalDialogOpen(false);
      setEditApprovalItem(null);
      fetchData();
    } catch (err: any) {
      console.error('Failed to save approval level:', err);
      alert(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Resolve role key to display name for approval level table
  const getRoleName = (roleKey: string) => roles.find((r) => r.key === roleKey)?.name ?? roleKey;

  // User: open add dialog
  const handleUserAdd = () => {
    setEditUserItem(null);
    setUserFormData({ userName: '', displayName: '', roleKey: '', isActive: true });
    setUserDialogOpen(true);
  };

  // User: open edit dialog
  const handleUserEdit = (user: User) => {
    setEditUserItem(user);
    setUserFormData({
      userName: user.userName,
      displayName: user.displayName,
      roleKey: user.roleKey,
      isActive: user.isActive,
    });
    setUserDialogOpen(true);
  };

  // User: deactivate with confirm
  const handleUserDeactivate = async (user: User) => {
    if (!window.confirm(`Deactivate user "${user.displayName || user.userName}"?`)) return;
    try {
      await usersApi.deactivate(user.id);
      fetchData();
    } catch (err: any) {
      console.error('Failed to deactivate user:', err);
      alert(err.response?.data?.message || 'Failed to deactivate.');
    }
  };

  // User: save (create or update)
  const handleUserSave = async () => {
    if (!userFormData.userName.trim()) {
      alert('Please enter a user name.');
      return;
    }
    if (!userFormData.roleKey.trim()) {
      alert('Please select a role.');
      return;
    }
    try {
      setSaving(true);
      if (editUserItem) {
        await usersApi.update(editUserItem.id, {
          userName: userFormData.userName,
          displayName: userFormData.displayName || undefined,
          roleKey: userFormData.roleKey,
          isActive: userFormData.isActive,
        });
      } else {
        await usersApi.create({
          userName: userFormData.userName,
          displayName: userFormData.displayName || undefined,
          roleKey: userFormData.roleKey,
          isActive: userFormData.isActive,
        });
      }
      setUserDialogOpen(false);
      setEditUserItem(null);
      fetchData();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      alert(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      parentId: item.divisionId || item.departmentId || item.categoryId || '',
    });
    setDialogOpen(true);
  };

  const handleDeactivate = async (item: any) => {
    if (!window.confirm(`Are you sure you want to deactivate "${item.name}"?`)) return;
    
    try {
      switch (tabValue) {
        case 0: await divisionApi.deactivate(item.id); break;
        case 1: await departmentApi.deactivate(item.id); break;
        case 2: await sectionApi.deactivate(item.id); break;
        case 3: await unitApi.deactivate(item.id); break;
        case 4: await categoryApi.deactivate(item.id); break;
        case 5: await subcategoryApi.deactivate(item.id); break;
      }
      fetchData();
    } catch (err) {
      console.error('Failed to deactivate:', err);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(null);
    setFormData({ code: '', name: '', parentId: '' });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data: any = { code: formData.code, name: formData.name };
      
      if (editItem) {
        // Update
        switch (tabValue) {
          case 0: await divisionApi.update(editItem.id, data); break;
          case 1: 
            data.divisionId = formData.parentId;
            await departmentApi.update(editItem.id, data); 
            break;
          case 2: 
            data.departmentId = formData.parentId;
            await sectionApi.update(editItem.id, data); 
            break;
          case 3: await unitApi.update(editItem.id, data); break;
          case 4: await categoryApi.update(editItem.id, data); break;
          case 5: 
            data.categoryId = formData.parentId;
            await subcategoryApi.update(editItem.id, data); 
            break;
        }
      } else {
        // Create
        switch (tabValue) {
          case 0: await divisionApi.create(data); break;
          case 1: 
            data.divisionId = formData.parentId;
            await departmentApi.create(data); 
            break;
          case 2: 
            data.departmentId = formData.parentId;
            await sectionApi.create(data); 
            break;
          case 3: await unitApi.create(data); break;
          case 4: await categoryApi.create(data); break;
          case 5: 
            data.categoryId = formData.parentId;
            await subcategoryApi.create(data); 
            break;
        }
      }
      handleDialogClose();
      fetchData();
    } catch (err: any) {
      console.error('Failed to save:', err);
      alert(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getTabLabel = () => {
    const labels = ['Division', 'Department', 'Section', 'Unit', 'Category', 'Subcategory'];
    return labels[tabValue];
  };

  const needsParent = () => [1, 2, 5].includes(tabValue);

  const getParentOptions = () => {
    switch (tabValue) {
      case 1: return divisions;
      case 2: return departments;
      case 5: return categories;
      default: return [];
    }
  };

  const getParentLabel = () => {
    switch (tabValue) {
      case 1: return 'Division';
      case 2: return 'Department';
      case 5: return 'Category';
      default: return 'Parent';
    }
  };

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

  const LovTable = ({ items, showParent = false, parentField = '' }: { items: any[]; showParent?: boolean; parentField?: string }) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Name</TableCell>
            {showParent && <TableCell>{parentField}</TableCell>}
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showParent ? 5 : 4} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No items found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                {showParent && (
                  <TableCell>
                    {item.divisionName || item.departmentName || item.categoryName || '-'}
                  </TableCell>
                )}
                <TableCell>
                  <Chip
                    label={item.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={item.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEdit(item)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {item.isActive && (
                    <Tooltip title="Deactivate">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeactivate(item)}
                      >
                        <DeleteIcon />
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
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Admin & User Management</Typography>
        <Box>
          <Button startIcon={<RefreshIcon />} onClick={fetchData} sx={{ mr: 1 }}>
            Refresh
          </Button>
          {tabValue === 6 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleApprovalAdd}>
              Add Approval Level
            </Button>
          ) : tabValue === 7 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleUserAdd}>
              Add User
            </Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Add {getTabLabel()}
            </Button>
          )}
        </Box>
      </Box>

      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`Divisions (${divisions.length})`} />
          <Tab label={`Departments (${departments.length})`} />
          <Tab label={`Sections (${sections.length})`} />
          <Tab label={`Units (${units.length})`} />
          <Tab label={`Categories (${categories.length})`} />
          <Tab label={`Subcategories (${subcategories.length})`} />
          <Tab label={`Approval Levels (${approvalLevels.length})`} />
          <Tab label={`Users (${users.length})`} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <LovTable items={divisions} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <LovTable items={departments} showParent parentField="Division" />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <LovTable items={sections} showParent parentField="Department" />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <LovTable items={units} />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <LovTable items={categories} />
          </TabPanel>
          <TabPanel value={tabValue} index={5}>
            <LovTable items={subcategories} showParent parentField="Category" />
          </TabPanel>
          <TabPanel value={tabValue} index={6}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Approver role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvalLevels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No approval levels. Add levels to define the approval chain (e.g. 5 levels with one role per level).
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvalLevels.map((level) => (
                      <TableRow key={level.id}>
                        <TableCell>{level.order}</TableCell>
                        <TableCell>{getRoleName(level.roleKey)}</TableCell>
                        <TableCell>
                          <Chip
                            label={level.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={level.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleApprovalEdit(level)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleApprovalDelete(level)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
          <TabPanel value={tabValue} index={7}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User name</TableCell>
                    <TableCell>Display name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No users. Add users and assign roles for workflow routing.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.userName}</TableCell>
                        <TableCell>{user.displayName || '-'}</TableCell>
                        <TableCell>{getRoleName(user.roleKey)}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleUserEdit(user)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {user.isActive && (
                            <Tooltip title="Deactivate">
                              <IconButton size="small" color="error" onClick={() => handleUserDeactivate(user)}>
                                <DeleteIcon />
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
          </TabPanel>
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? `Edit ${getTabLabel()}` : `Add New ${getTabLabel()}`}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Code"
            fullWidth
            variant="outlined"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          {needsParent() && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{getParentLabel()}</InputLabel>
              <Select
                value={formData.parentId}
                label={getParentLabel()}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              >
                {getParentOptions().map((opt: any) => (
                  <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Level Add/Edit Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editApprovalItem ? 'Edit Approval Level' : 'Add Approval Level'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Define one step in the approval chain. Order determines sequence (1 = first approver). Leave order blank to append.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Order"
            type="number"
            fullWidth
            variant="outlined"
            value={approvalFormData.order}
            onChange={(e) => setApprovalFormData({ ...approvalFormData, order: e.target.value })}
            placeholder="Leave blank to add at end"
            inputProps={{ min: 1, step: 1 }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Approver role</InputLabel>
            <Select
              value={approvalFormData.roleKey}
              label="Approver role"
              onChange={(e) => setApprovalFormData({ ...approvalFormData, roleKey: e.target.value })}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.key}>{role.name} ({role.key})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={approvalFormData.isActive}
                onChange={(e) => setApprovalFormData({ ...approvalFormData, isActive: e.target.checked })}
              />
            }
            label="Active (included in approval chain)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApprovalSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Add/Edit Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUserItem ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User name"
            fullWidth
            variant="outlined"
            value={userFormData.userName}
            onChange={(e) => setUserFormData({ ...userFormData, userName: e.target.value })}
            placeholder="e.g. jsmith"
            disabled={!!editUserItem}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Display name"
            fullWidth
            variant="outlined"
            value={userFormData.displayName}
            onChange={(e) => setUserFormData({ ...userFormData, displayName: e.target.value })}
            placeholder="e.g. John Smith"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={userFormData.roleKey}
              label="Role"
              onChange={(e) => setUserFormData({ ...userFormData, roleKey: e.target.value })}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.key}>{role.name} ({role.key})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={userFormData.isActive}
                onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.checked })}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUserSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
