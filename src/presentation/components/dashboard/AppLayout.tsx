/**
 * Main App Layout
 * Responsive layout with grouped sidebar navigation
 * Optimized for laptop screens
 *
 * Uses React.lazy for code splitting - each panel loads on demand
 */

import { lazy, Suspense, type ComponentType } from 'react';
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
  Collapse,
  Badge,
  CircularProgress,
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
  Visibility as WatchlistIcon,
  Notifications as NotificationsIcon,
  BarChart as AnalyticsIcon,
  EmojiEvents as AchievementsIcon,
  TrendingUp as ImpactIcon,
  Description as TemplatesIcon,
  Science as ResearchIcon,
  Star as QualityIcon,
  Groups as CollaborationIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useUIStore, useNotificationStore } from '@presentation/hooks';
import { useDashboard } from '@presentation/hooks/queries';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { ActiveSection } from '@presentation/hooks';

// === Lazy-loaded Panels (Code Splitting) ===
// Each panel loads only when navigated to, reducing initial bundle size

const DashboardOverview = lazy(() =>
  import('../dashboard/Overview').then((m) => ({ default: m.DashboardOverview }))
);
const DraftsPanel = lazy(() =>
  import('../drafts/DraftsPanel').then((m) => ({ default: m.DraftsPanel }))
);
const ContributionsPanel = lazy(() =>
  import('../contributions/ContributionsPanel').then((m) => ({ default: m.ContributionsPanel }))
);
const TasksPanel = lazy(() =>
  import('../tasks/TasksPanel').then((m) => ({ default: m.TasksPanel }))
);
const FocusAreasPanel = lazy(() =>
  import('../focus-areas/FocusAreasPanel').then((m) => ({ default: m.FocusAreasPanel }))
);
const CoiDisclosuresPanel = lazy(() =>
  import('../coi/CoiDisclosuresPanel').then((m) => ({ default: m.CoiDisclosuresPanel }))
);
const WatchlistPanel = lazy(() =>
  import('../watchlist/WatchlistPanel').then((m) => ({ default: m.WatchlistPanel }))
);
const NotificationsPanel = lazy(() =>
  import('../notifications/NotificationsPanel').then((m) => ({ default: m.NotificationsPanel }))
);
const AnalyticsPanel = lazy(() =>
  import('../analytics/AnalyticsPanel').then((m) => ({ default: m.AnalyticsPanel }))
);
const AchievementsPanel = lazy(() =>
  import('../achievements/AchievementsPanel').then((m) => ({ default: m.AchievementsPanel }))
);
const ImpactPanel = lazy(() =>
  import('../impact/ImpactPanel').then((m) => ({ default: m.ImpactPanel }))
);
const TemplatesPanel = lazy(() =>
  import('../templates/TemplatesPanel').then((m) => ({ default: m.TemplatesPanel }))
);
const ResearchPanel = lazy(() =>
  import('../research/ResearchPanel').then((m) => ({ default: m.ResearchPanel }))
);
const QualityTrackerPanel = lazy(() =>
  import('../quality/QualityTrackerPanel').then((m) => ({ default: m.QualityTrackerPanel }))
);
const CollaborationPanel = lazy(() =>
  import('../collaboration/CollaborationPanel').then((m) => ({ default: m.CollaborationPanel }))
);
const SettingsPanel = lazy(() =>
  import('../settings/SettingsPanel').then((m) => ({ default: m.SettingsPanel }))
);

// === Section Component Map (Type-safe routing) ===
const SECTION_COMPONENTS: Record<ActiveSection, ComponentType> = {
  overview: DashboardOverview,
  drafts: DraftsPanel,
  contributions: ContributionsPanel,
  tasks: TasksPanel,
  'focus-areas': FocusAreasPanel,
  coi: CoiDisclosuresPanel,
  watchlist: WatchlistPanel,
  notifications: NotificationsPanel,
  analytics: AnalyticsPanel,
  achievements: AchievementsPanel,
  impact: ImpactPanel,
  templates: TemplatesPanel,
  research: ResearchPanel,
  quality: QualityTrackerPanel,
  collaboration: CollaborationPanel,
  settings: SettingsPanel,
};

// === Loading Fallback ===
function PanelLoadingFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress />
    </Box>
  );
}

// === Sidebar Width ===
const DRAWER_WIDTH = 220;

// === Navigation Items ===

interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [{ id: 'overview', label: 'Overview', icon: <DashboardIcon /> }],
  },
  {
    id: 'my-work',
    label: 'My Work',
    items: [
      { id: 'drafts', label: 'Drafts', icon: <ArticleIcon /> },
      { id: 'contributions', label: 'Contributions', icon: <EditIcon /> },
      { id: 'tasks', label: 'Tasks', icon: <TaskIcon /> },
      { id: 'focus-areas', label: 'Focus Areas', icon: <FolderIcon /> },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    items: [
      { id: 'watchlist', label: 'Watchlist', icon: <WatchlistIcon /> },
      { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon />, badge: true },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { id: 'analytics', label: 'Statistics', icon: <AnalyticsIcon /> },
      { id: 'achievements', label: 'Achievements', icon: <AchievementsIcon /> },
      { id: 'impact', label: 'Impact', icon: <ImpactIcon /> },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { id: 'templates', label: 'Templates', icon: <TemplatesIcon /> },
      { id: 'research', label: 'Research', icon: <ResearchIcon /> },
      { id: 'quality', label: 'Quality', icon: <QualityIcon /> },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    items: [
      { id: 'collaboration', label: 'Collaboration', icon: <CollaborationIcon /> },
      { id: 'coi', label: 'COI', icon: <GavelIcon /> },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [{ id: 'settings', label: 'Settings', icon: <SettingsIcon /> }],
  },
];

// === Sidebar Component ===

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

function Sidebar({ open, onClose, variant }: SidebarProps) {
  const {
    activeSection,
    setActiveSection,
    darkMode,
    toggleDarkMode,
    expandedNavGroups,
    toggleNavGroup,
  } = useUIStore();
  const { data: dashboard } = useDashboard();
  const { unreadCount } = useNotificationStore();

  const handleNavigation = (section: ActiveSection) => {
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

      {/* Grouped Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
        {NAV_GROUPS.map((group) => {
          const isExpanded = expandedNavGroups.includes(group.id);

          return (
            <Box key={group.id}>
              <ListItemButton onClick={() => toggleNavGroup(group.id)} sx={{ py: 0.5, px: 2 }}>
                <ListItemText
                  primary={group.label}
                  primaryTypographyProps={{
                    variant: 'caption',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                />
                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </ListItemButton>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {group.items.map((item) => (
                    <ListItem key={item.id} disablePadding>
                      <ListItemButton
                        selected={activeSection === item.id}
                        onClick={() => handleNavigation(item.id)}
                        sx={{
                          py: 0.75,
                          px: 2,
                          pl: 3,
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
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {item.badge ? (
                            <Badge badgeContent={unreadCount} color="error" max={99}>
                              {item.icon}
                            </Badge>
                          ) : (
                            item.icon
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ variant: 'body2', fontSize: '0.8125rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      <Divider />

      {/* External Links */}
      <List dense>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() =>
              window.open(
                `https://en.wikipedia.org/wiki/User:${dashboard?.user.username}/Dashboard`,
                '_blank'
              )
            }
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
            onClick={() =>
              window.open(
                `https://xtools.wmcloud.org/ec/en.wikipedia.org/${dashboard?.user.username}`,
                '_blank'
              )
            }
            sx={{ py: 0.5, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="XTools" primaryTypographyProps={{ variant: 'caption' }} />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />

      {/* Theme Toggle */}
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {darkMode ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          <Typography variant="caption">{darkMode ? 'Dark' : 'Light'}</Typography>
        </Box>
        <Switch size="small" checked={darkMode} onChange={toggleDarkMode} />
      </Box>
    </Drawer>
  );
}

// === Content Router ===
// Uses component map for type-safe routing with Suspense + ErrorBoundary

function ContentRouter() {
  const { activeSection } = useUIStore();
  const Component = SECTION_COMPONENTS[activeSection] || DashboardOverview;

  return (
    <ErrorBoundary>
      <Suspense fallback={<PanelLoadingFallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

// === Main Layout ===

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  useDashboard(); // Prefetch dashboard data

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
            <IconButton edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Wikipedia Editor Dashboard
          </Typography>
          <Tooltip title="Open Wikipedia">
            <IconButton onClick={() => window.open('https://en.wikipedia.org', '_blank')}>
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
