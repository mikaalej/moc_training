import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { tasksApi, MocTaskStatus } from '../api/tasksApi';
import type { TaskItem } from "../api/tasksApi"
import { RiskLevel } from '../api/mocApi';

/**
 * Tab panel component for the task lists.
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
 * My Tasks page showing task queues organized by status.
 * Fetches real data from the backend API.
 */
export default function MyTasks() {
  const [tabValue, setTabValue] = useState(0);
  const [openTasks, setOpenTasks] = useState<TaskItem[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [completeRemarks, setCompleteRemarks] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [openRes, completedRes] = await Promise.all([
        tasksApi.getOpen(),
        tasksApi.getCompleted(),
      ]);
      setOpenTasks(openRes.data);
      setCompletedTasks(completedRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please ensure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getRiskLevelColor = (level?: RiskLevel) => {
    switch (level) {
      case RiskLevel.Green: return 'success';
      case RiskLevel.Yellow: return 'warning';
      case RiskLevel.Red: return 'error';
      default: return 'default';
    }
  };

  const getRiskLevelName = (level?: RiskLevel) => {
    switch (level) {
      case RiskLevel.Green: return 'Green';
      case RiskLevel.Yellow: return 'Yellow';
      case RiskLevel.Red: return 'Red';
      default: return 'N/A';
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCompleteClick = (task: TaskItem) => {
    setSelectedTask(task);
    setCompleteRemarks('');
    setCompleteDialogOpen(true);
  };

  const handleCompleteConfirm = async () => {
    if (!selectedTask) return;
    try {
      await tasksApi.complete(selectedTask.id, { remarks: completeRemarks || undefined });
      setCompleteDialogOpen(false);
      fetchTasks(); // Refresh the list
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await tasksApi.cancel(taskId);
      fetchTasks(); // Refresh the list
    } catch (err) {
      console.error('Failed to cancel task:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const TaskTable = ({ tasks, showActions = true }: { tasks: TaskItem[]; showActions?: boolean }) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Control #</TableCell>
            <TableCell>MOC Title</TableCell>
            <TableCell>Task</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Risk Level</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Status</TableCell>
            {showActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 8 : 7} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No tasks found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow
                key={task.id}
                sx={{
                  backgroundColor: task.isOverdue ? '#ffebee' : 'inherit',
                }}
              >
                <TableCell>{task.mocControlNumber}</TableCell>
                <TableCell>{task.mocTitle}</TableCell>
                <TableCell>{task.title}</TableCell>
                <TableCell>
                  <Chip label={task.taskTypeName} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getRiskLevelName(task.mocRiskLevel as RiskLevel | undefined)}
                    size="small"
                    color={getRiskLevelColor(task.mocRiskLevel as RiskLevel | undefined) as 'success' | 'warning' | 'error' | 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={task.isOverdue ? 'error' : 'inherit'}
                  >
                    {formatDate(task.dueDateUtc)}
                    {task.isOverdue && ' (Overdue)'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={task.statusName} 
                    size="small" 
                    color={task.status === MocTaskStatus.Completed ? 'success' : 'default'}
                  />
                </TableCell>
                {showActions && (
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {task.status === MocTaskStatus.Open && (
                      <>
                        <Tooltip title="Complete Task">
                          <IconButton size="small" color="primary" onClick={() => handleCompleteClick(task)}>
                            <CompleteIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel Task">
                          <IconButton size="small" color="error" onClick={() => handleCancelTask(task.id)}>
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Tasks assigned to you across all MOC requests
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`Open Tasks (${openTasks.length})`} />
          <Tab label={`Completed (${completedTasks.length})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TaskTable tasks={openTasks} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TaskTable tasks={completedTasks} showActions={false} />
        </TabPanel>
      </Paper>

      {/* Complete Task Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to complete this task?
          </Typography>
          {selectedTask && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>{selectedTask.title}</strong> for {selectedTask.mocControlNumber}
            </Typography>
          )}
          <TextField
            label="Remarks (optional)"
            multiline
            rows={3}
            fullWidth
            value={completeRemarks}
            onChange={(e) => setCompleteRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCompleteConfirm} variant="contained" color="primary">
            Complete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
