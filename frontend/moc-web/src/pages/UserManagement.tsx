import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, PersonOff as DeactivateIcon } from '@mui/icons-material';
import { usersApi, rolesApi } from '../api';
import type { User } from '../api/usersApi';
import type { Role } from '../api/rolesApi';
import { canAccessAdmin } from '../utils/permissions';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * User Management page for admins (SuperUser).
 * Create and edit users, assign roles, activate/deactivate.
 */
export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    userName: '',
    displayName: '',
    roleKey: '',
    password: '',
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, rolesRes] = await Promise.all([
        usersApi.getAll(false),
        rolesApi.getAll(true),
      ]);
      setUsers(usersRes.data ?? []);
      setRoles(rolesRes.data ?? []);
    } catch (err) {
      console.error('Failed to load users or roles:', err);
      setError('Failed to load users. Please ensure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRoleName = (roleKey: string) => roles.find((r) => r.key === roleKey)?.name ?? roleKey;

  const openAdd = () => {
    setEditingUser(null);
    setForm({ userName: '', displayName: '', roleKey: roles[0]?.key ?? '', password: '', isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      userName: u.userName,
      displayName: u.displayName ?? '',
      roleKey: u.roleKey,
      password: '',
      isActive: u.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!form.userName.trim()) {
      alert('User name is required.');
      return;
    }
    if (!form.roleKey) {
      alert('Please select a role.');
      return;
    }
    if (!editingUser && !form.password) {
      alert('Password is required for new users.');
      return;
    }
    if (editingUser && form.password && form.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    try {
      setSaving(true);
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          displayName: form.displayName.trim() || undefined,
          roleKey: form.roleKey,
          isActive: form.isActive,
          password: form.password.trim() || undefined,
        });
      } else {
        await usersApi.create({
          userName: form.userName.trim(),
          displayName: form.displayName.trim() || undefined,
          roleKey: form.roleKey,
          isActive: form.isActive,
          password: form.password || undefined,
        });
      }
      closeDialog();
      await fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save user.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (u: User) => {
    if (!window.confirm(`Deactivate user "${u.displayName || u.userName}"? They will no longer be able to sign in.`)) return;
    try {
      await usersApi.deactivate(u.id);
      await fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to deactivate.';
      alert(msg);
    }
  };

  if (!currentUser || !canAccessAdmin(currentUser.roleKey)) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and edit users, assign roles, and activate or deactivate accounts. Roles control access to Admin, workflow actions, and approvals.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add user
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Roles reference */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Roles
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Assign a role to each user. SuperUser can access Admin and User Management; other roles can perform workflow and approvals as defined in Approval Levels.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {roles.map((r) => (
            <Chip key={r.id} label={`${r.name} (${r.key})`} size="small" variant="outlined" />
          ))}
        </Box>
      </Paper>

      {/* Users table */}
      <Paper>
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
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No users yet. Add a user to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.userName}</TableCell>
                    <TableCell>{u.displayName || '—'}</TableCell>
                    <TableCell>{getRoleName(u.roleKey)}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={u.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit user and role">
                        <IconButton size="small" onClick={() => openEdit(u)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {u.isActive && (
                        <Tooltip title="Deactivate (user cannot sign in)">
                          <IconButton size="small" color="error" onClick={() => handleDeactivate(u)}>
                            <DeactivateIcon />
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
      </Paper>

      {/* Add/Edit user dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit user' : 'Add user'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            fullWidth
            label="User name"
            value={form.userName}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            disabled={!!editingUser}
            placeholder="e.g. jsmith"
            helperText={editingUser ? 'User name cannot be changed.' : 'Used to sign in.'}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Display name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="e.g. John Smith"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={form.roleKey}
              label="Role"
              onChange={(e) => setForm({ ...form, roleKey: e.target.value })}
            >
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.key}>
                  {r.name} ({r.key})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            type="password"
            label={editingUser ? 'New password (leave blank to keep current)' : 'Password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editingUser ? 'Optional' : 'Min 6 characters'}
            helperText={editingUser ? undefined : 'Required for new users.'}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
            }
            label="Active (user can sign in)"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
