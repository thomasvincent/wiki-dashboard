/**
 * Main App Layout
 * Responsive layout with sidebar navigation
 * Optimized for laptop screens
 */

import React, { useMemo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
  Tooltip,
  Switch,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
  Task as TaskIcon,
  Folder as FolderIcon,
  Gavel as GavelIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useUIStore, useDashboardStore } from '@presentation/hooks';
import { useDashboard } from '@presentation/hooks/queries';
import { DashboardOverview } from '../dashboard/Overview';
import { DraftsPanel } from '../drafts/DraftsPanel';
import { ContributionsPanel } from '../contributions/ContributionsPanel';
import { TasksPanel } from '../tasks/TasksPanel';
import { FocusAreasPanel } from '../focus-areas/FocusAreasPanel';
import { CoiDisclosuresPanel } from '../coi/CoiDisclosuresPanel';

// === Sidebar Width ===
const DRAWER_WIDTH = 220;

// === Navigation Items ===

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section: 'overview' | 'drafts' | 'contributions' | 'tasks' | 'focus-areas' | 'coi';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <DashboardIcon />, section: 'overview' },
  { id: 'drafts', label: 'Drafts', icon: <ArticleIcon />, section: 'drafts' },
  { id: 'contributions', label: 'Contributions', icon: <EditIcon />, section: 'contributions' },
  { id: 'tasks', label: 'Tasks', icon: <TaskIcon />, section: 'tasks' },
  { id: 'focus-areas', label: 'Focus Areas', icon: <FolderIcon />, section: 'focus-areas' },
  { id: 'coi', label: 'COI Disclosures', icon: <GavelIcon />, section: 'coi' },
];

// === Sidebar Component ===

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

function Sidebar({ open, onClose, variant }: SidebarProps) {
  const { activeSection, setActiveSection, darkMode, toggleDarkMode } = useUIStore();
  const { data: dashboard } = useDashboard();

  const handleNavigation = (section: NavItem['section']) => {
    setActiveSection(section);
    if (variant === 'temporary') {
      onClose();
    }
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {/* User Info */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
          {dashboard?.user.username.charAt(0).toUpperCase() ?? 'W'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {dashboard?.user.username ?? 'Loading...'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {dashboard?.stats.totalEdits.toLocaleString() ?? '...'} edits
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeSection === item.section}
              onClick={() => handleNavigation(item.section)}
              sx={{
                py: 1,
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* External Links */}
      <List dense>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => window.open(`https://en.wikipedia.org/wiki/User:${dashboard?.user.username}/Dashboard`, '_blank')}
            sx={{ py: 0.5, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Wiki Dashboard"
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => window.open(`https://xtools.wmcloud.org/ec/en.wikipedia.org/${dashboard?.user.username}`, '_blank')}
            sx={{ py: 0.5, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="XTools"
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />

      {/* Theme Toggle */}
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {darkMode ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          <Typography variant="caption">
            {darkMode ? 'Dark' : 'Light'}
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={darkMode}
          onChange={toggleDarkMode}
        />
      </Box>
    </Drawer>
  );
}

// === Content Router ===

function ContentRouter() {
  const { activeSection } = useUIStore();

  switch (activeSection) {
    case 'overview':
      return <DashboardOverview />;
    case 'drafts':
      return <DraftsPanel />;
    case 'contributions':
      return <ContributionsPanel />;
    case 'tasks':
      return <TasksPanel />;
    case 'focus-areas':
      return <FocusAreasPanel />;
    case 'coi':
      return <CoiDisclosuresPanel />;
    default:
      return <DashboardOverview />;
  }
}

// === Main Layout ===

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { data: dashboard } = useDashboard();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={toggleSidebar}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Wikipedia Editor Dashboard
          </Typography>
          <Tooltip title="Open Wikipedia">
            <IconButton
              onClick={() => window.open('https://en.wikipedia.org', '_blank')}
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Sidebar
        open={isMobile ? sidebarOpen : true}
        onClose={() => setSidebarOpen(false)}
        variant={isMobile ? 'temporary' : 'permanent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          pt: '48px', // AppBar height
        }}
      >
        <ContentRouter />
      </Box>
    </Box>
  );
}

export default AppLayout;
