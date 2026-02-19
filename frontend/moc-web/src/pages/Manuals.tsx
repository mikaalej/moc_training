import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Link,
} from '@mui/material';
import {
  Description as ProcedureIcon,
  Assignment as WorkInstructionIcon,
  Receipt as FormIcon,
  AttachFile as AttachmentIcon,
  ExpandLess,
  ExpandMore,
  MenuBook as ManualIcon,
} from '@mui/icons-material';
import { manualsApi, ProcedureNodeType } from '../api/manualsApi';
import type { Manual, ManualDetail, ProcedureNodeTree } from '../api/manualsApi';

/**
 * Renders a single node and its children recursively with expand/collapse.
 */
function ProcedureTreeNode({
  node,
  depth = 0,
}: {
  node: ProcedureNodeTree;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const icon =
    node.nodeType === ProcedureNodeType.Procedure ? (
      <ProcedureIcon fontSize="small" />
    ) : node.nodeType === ProcedureNodeType.WorkInstruction ? (
      <WorkInstructionIcon fontSize="small" />
    ) : node.nodeType === ProcedureNodeType.Form ? (
      <FormIcon fontSize="small" />
    ) : (
      <AttachmentIcon fontSize="small" />
    );

  return (
    <>
      <ListItemButton
        onClick={() => hasChildren && setOpen((o) => !o)}
        sx={{ pl: 2 + depth * 2 }}
        dense
      >
        {hasChildren ? (
          <ListItemIcon sx={{ minWidth: 32 }}>{open ? <ExpandLess /> : <ExpandMore />}</ListItemIcon>
        ) : (
          <ListItemIcon sx={{ minWidth: 32 }}>{icon}</ListItemIcon>
        )}
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{node.title}</Typography>
              {node.nodeTypeName && (
                <Chip label={node.nodeTypeName} size="small" variant="outlined" sx={{ height: 20 }} />
              )}
              {node.url && (
                <Link href={node.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  Open
                </Link>
              )}
            </Box>
          }
        />
      </ListItemButton>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.children!.map((child) => (
              <ProcedureTreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

/**
 * Manuals & Procedures page. Lists manuals and shows procedure tree for the selected manual.
 */
export default function Manuals() {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [selectedManual, setSelectedManual] = useState<ManualDetail | null>(null);
  const [selectedManualId, setSelectedManualId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManuals = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await manualsApi.getAll(true);
        setManuals(res.data);
      } catch (err) {
        console.error('Failed to load manuals:', err);
        setError('Failed to load manuals. Please ensure the API is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchManuals();
  }, []);

  useEffect(() => {
    if (!selectedManualId) {
      setSelectedManual(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        const res = await manualsApi.getById(selectedManualId);
        setSelectedManual(res.data);
      } catch (err) {
        console.error('Failed to load manual detail:', err);
        setSelectedManual(null);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selectedManualId]);

  const handleSelectManual = (id: string) => {
    setSelectedManualId(id);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Manuals &amp; Procedures
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Manuals &amp; Procedures
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Browse manuals, procedures, work instructions, and forms. Select a manual to view its contents.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Manual list */}
        <Paper sx={{ p: 2, minWidth: 280, maxWidth: { md: 320 } }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Manuals
          </Typography>
          {manuals.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No manuals found.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {manuals.map((m) => (
                <Card key={m.id} variant="outlined" sx={{ bgcolor: selectedManualId === m.id ? 'action.selected' : undefined }}>
                  <CardActionArea onClick={() => handleSelectManual(m.id)}>
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ManualIcon color="action" fontSize="small" />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {m.title}
                          </Typography>
                          {m.code && (
                            <Typography variant="caption" color="text.secondary">
                              {m.code}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </Paper>

        {/* Procedure tree for selected manual */}
        <Paper sx={{ flex: 1, p: 2, minHeight: 400 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {selectedManual ? selectedManual.title : 'Contents'}
          </Typography>
          {!selectedManualId ? (
            <Typography variant="body2" color="text.secondary">
              Select a manual to view its procedures and documents.
            </Typography>
          ) : detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedManual && selectedManual.nodes && selectedManual.nodes.length > 0 ? (
            <List component="nav" dense disablePadding>
              {selectedManual.nodes.map((node) => (
                <ProcedureTreeNode key={node.id} node={node} />
              ))}
            </List>
          ) : selectedManual ? (
            <Typography variant="body2" color="text.secondary">
              This manual has no procedures or documents yet.
            </Typography>
          ) : null}
        </Paper>
      </Box>
    </Box>
  );
}
