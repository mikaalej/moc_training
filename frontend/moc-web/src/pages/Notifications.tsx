import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  CheckCircle as ReadIcon,
  DoneAll as ReadAllIcon,
  Close as DismissIcon,
  NotificationsNone as EmptyIcon,
} from '@mui/icons-material';
import { notificationsApi, NotificationStatus } from '../api/notificationsApi';
import type { Notification } from '../api/notificationsApi';

/**
 * Notifications page. Lists notifications with options to mark as read or dismiss.
 * Unread items can be marked read individually or all at once; any item can be dismissed.
 */
export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadNotifications = async (unread: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const res = unread
        ? await notificationsApi.getUnread()
        : await notificationsApi.getAll();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications. Please ensure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications(unreadOnly);
  }, [unreadOnly]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setActionId(id);
      await notificationsApi.markAsRead(id);
      await loadNotifications(unreadOnly);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionId('all');
      await notificationsApi.markAllAsRead();
      await loadNotifications(unreadOnly);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      setActionId(id);
      await notificationsApi.dismiss(id);
      await loadNotifications(unreadOnly);
    } catch (err) {
      console.error('Failed to dismiss:', err);
    } finally {
      setActionId(null);
    }
  };

  const goToMoc = (mocRequestId: string) => {
    navigate(`/mocs/${mocRequestId}`);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const unreadCount = notifications.filter((n) => n.status === NotificationStatus.Unread).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Notifications</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
              />
            }
            label="Unread only"
          />
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReadAllIcon />}
              onClick={handleMarkAllAsRead}
              disabled={!!actionId}
            >
              Mark all as read
            </Button>
          )}
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        View and manage your notifications. Mark as read or dismiss to keep your inbox clear.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmptyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No notifications {unreadOnly ? 'unread' : ''}.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List disablePadding>
            {notifications.map((n) => (
              <ListItem
                key={n.id}
                divider
                sx={{
                  bgcolor: n.status === NotificationStatus.Unread ? 'action.hover' : undefined,
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2">{n.type}</Typography>
                      {n.mocControlNumber && (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => n.mocRequestId && goToMoc(n.mocRequestId)}
                          sx={{ minWidth: 0, px: 0.5 }}
                        >
                          {n.mocControlNumber}
                        </Button>
                      )}
                      <Chip
                        label={n.statusName}
                        size="small"
                        color={n.status === NotificationStatus.Unread ? 'primary' : 'default'}
                        variant={n.status === NotificationStatus.Unread ? 'filled' : 'outlined'}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {n.message}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {formatDate(n.createdAtUtc)}
                        {n.readAtUtc && ` · Read ${formatDate(n.readAtUtc)}`}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  {n.status === NotificationStatus.Unread && (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleMarkAsRead(n.id)}
                      disabled={actionId !== null}
                      title="Mark as read"
                    >
                      <ReadIcon />
                    </IconButton>
                  )}
                  {n.status !== NotificationStatus.Dismissed && (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDismiss(n.id)}
                      disabled={actionId !== null}
                      title="Dismiss"
                    >
                      <DismissIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
