import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

/**
 * Help & FAQs page. Static content with usage tips, workflow overview, and links to app sections.
 */
export default function Help() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Help &amp; FAQs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Quick reference for using the Management of Change (MOC) system.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Getting started
        </Typography>
        <Typography variant="body2" paragraph>
          Use the <strong>Dashboard</strong> for an overview of MOC counts, tasks, and notifications.
          From the sidebar you can create requests, view your tasks, browse MOC lists, and access
          manuals, reports, feedback, and notifications.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Creating a request
        </Typography>
        <Typography variant="body2" paragraph>
          Go to <Link to="/create">Create Request</Link>, choose the type (Standard EMOC, Bypass EMOC, OMOC, or DMOC),
          then complete the multi-step form. Select Division, Department, Section, Category, and Subcategory;
          fill in title, scope, risk, and dates. You can <strong>Save draft</strong> or <strong>Submit</strong> when ready.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          MOC workflow (stages)
        </Typography>
        <Typography variant="body2" paragraph>
          After submission, a request moves through stages: Initiation → Validation → Evaluation →
          Final Approval → Pre-Implementation → Implementation → Restoration or Closeout. On the{' '}
          <Link to="/mocs">MOC List</Link> use the <strong>Active</strong> tab for in-progress MOCs;
          open a row to view details and use <strong>Advance to next stage</strong>, <strong>Mark inactive</strong>, or{' '}
          <strong>Reactivate</strong> as allowed.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Where to find things
        </Typography>
        <List dense disablePadding>
          <ListItem component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="Dashboard" secondary="KPIs, charts, and quick stats" />
          </ListItem>
          <ListItem component={Link} to="/tasks" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="My Tasks" secondary="Open and completed tasks; complete or cancel" />
          </ListItem>
          <ListItem component={Link} to="/create" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="Create Request" secondary="Start a new MOC request" />
          </ListItem>
          <ListItem component={Link} to="/mocs" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="MOC List" secondary="Active, inactive, approved, drafts, closed; filters and export" />
          </ListItem>
          <ListItem component={Link} to="/manuals" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="Manuals & Procedures" secondary="Browse procedures and work instructions" />
          </ListItem>
          <ListItem component={Link} to="/reports" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="Reports" secondary="By division, category, risk; monthly trend; task performance" />
          </ListItem>
          <ListItem component={Link} to="/feedback" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="Feedback" secondary="Submit feedback and view lessons learned" />
          </ListItem>
          <ListItem component={Link} to="/notifications" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="Notifications" secondary="View and mark as read or dismiss" />
          </ListItem>
          <ListItem component={Link} to="/admin" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary="Admin" secondary="Manage divisions, departments, sections, units, categories, subcategories" />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ px: 2, pt: 2 }} gutterBottom>
          Frequently asked questions
        </Typography>
        <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">How do I see my submitted MOC?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              Go to <Link to="/mocs">MOC List</Link> and open the <strong>Active</strong> tab. Newly submitted
              requests appear there. Click the view icon or the control number to open the MOC detail page.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">Where are procedures and forms?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              <Link to="/manuals">Manuals &amp; Procedures</Link> lists all manuals. Select a manual to see its
              procedure tree (procedures, work instructions, forms). Use the &quot;Open&quot; link on a node if a URL is available.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">How do I add or edit divisions and categories?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              Go to <Link to="/admin">Admin</Link>. Use the tabs for Divisions, Departments, Sections, Units,
              Categories, and Subcategories. Use <strong>Add</strong> for new items and the edit icon to update;
              deactivate instead of deleting to keep history.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}
