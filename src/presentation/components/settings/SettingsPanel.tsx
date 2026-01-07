/**
 * Settings Panel Component
 * User settings, authentication, and configuration
 */

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  OpenInNew as OpenIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { SectionHeader } from '../common';
import { useAuthStore, useSettingsStore } from '@presentation/hooks';
import { useDashboard } from '@presentation/hooks/queries';
import { oauthClient } from '@infrastructure/api/oauth-client';

// === Username Configuration ===

function UsernameConfig() {
  const { configuredUsername, setConfiguredUsername } = useSettingsStore();
  const [editMode, setEditMode] = useState(false);
  const [tempUsername, setTempUsername] = useState(configuredUsername);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);

    try {
      const userInfo = await oauthClient.getUserInfo(tempUsername);
      if (userInfo) {
        setValidationResult('valid');
      } else {
        setValidationResult('invalid');
      }
    } catch {
      setValidationResult('invalid');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = () => {
    setConfiguredUsername(tempUsername);
    setEditMode(false);
    setValidationResult(null);
    // Reload the page to fetch new data
    window.location.reload();
  };

  const handleCancel = () => {
    setTempUsername(configuredUsername);
    setEditMode(false);
    setValidationResult(null);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Wikipedia Username</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This is the Wikipedia username used to fetch your contribution data.
        </Typography>

        {!editMode ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Paper variant="outlined" sx={{ px: 2, py: 1, flex: 1 }}>
              <Typography variant="body1" fontWeight={500}>
                {configuredUsername}
              </Typography>
            </Paper>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Change
            </Button>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Wikipedia Username"
                value={tempUsername}
                onChange={(e) => {
                  setTempUsername(e.target.value);
                  setValidationResult(null);
                }}
                size="small"
                helperText="Enter your Wikipedia username (case-sensitive)"
              />
              <Button
                variant="outlined"
                onClick={handleValidate}
                disabled={validating || !tempUsername}
                sx={{ minWidth: 100 }}
              >
                {validating ? <CircularProgress size={20} /> : 'Validate'}
              </Button>
            </Box>

            {validationResult === 'valid' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Username found on Wikipedia!
              </Alert>
            )}

            {validationResult === 'invalid' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Username not found. Please check the spelling.
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!tempUsername || validationResult === 'invalid'}
              >
                Save
              </Button>
              <Button variant="text" onClick={handleCancel}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// === OAuth Status ===

function OAuthStatus() {
  const { isAuthenticated, username, logout } = useAuthStore();
  const [showOAuthDialog, setShowOAuthDialog] = useState(false);

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">Wikipedia Authentication</Typography>
          </Box>

          {isAuthenticated ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon />
                  <Typography>
                    Authenticated as <strong>{username}</strong>
                  </Typography>
                </Box>
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You have access to:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Full watchlist access" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Notifications" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Patrol actions" />
                </ListItem>
              </List>

              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={logout}
              >
                Sign Out
              </Button>
            </Box>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                OAuth authentication is optional. It provides access to your full watchlist and notifications.
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Without authentication, you can still view:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Your contribution history" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Edit statistics" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Article pageviews" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ErrorIcon color="disabled" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Full watchlist (requires auth)" secondary="Showing recent edits instead" />
                </ListItem>
              </List>

              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={() => setShowOAuthDialog(true)}
              >
                Sign in with Wikipedia
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* OAuth Info Dialog */}
      <Dialog open={showOAuthDialog} onClose={() => setShowOAuthDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sign in with Wikipedia</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            OAuth authentication requires registering an OAuth consumer application with Wikipedia.
          </Alert>

          <Typography variant="body2" paragraph>
            To enable full OAuth authentication:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>1.</ListItemIcon>
              <ListItemText
                primary="Register an OAuth consumer"
                secondary="Go to Special:OAuthConsumerRegistration on Meta-Wiki"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>2.</ListItemIcon>
              <ListItemText
                primary="Configure your application"
                secondary="Set the callback URL to this dashboard's domain"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>3.</ListItemIcon>
              <ListItemText
                primary="Add credentials"
                secondary="Enter your consumer key and secret in the environment variables"
              />
            </ListItem>
          </List>

          <Button
            variant="outlined"
            endIcon={<OpenIcon />}
            onClick={() => window.open('https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration', '_blank')}
            fullWidth
            sx={{ mt: 2 }}
          >
            Register OAuth Consumer
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOAuthDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// === User Profile Card ===

function UserProfileCard() {
  const { data: dashboard, isLoading } = useDashboard();
  const { configuredUsername } = useSettingsStore();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} />
            <Typography>Loading profile...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const user = dashboard?.user;
  const stats = dashboard?.stats;

  return (
    <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.dark', fontSize: '1.5rem' }}>
            {configuredUsername.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {configuredUsername}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {user?.groups?.slice(0, 3).map((group) => (
                <Chip
                  key={group}
                  label={group}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'inherit',
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="h4" fontWeight={600}>
              {stats?.totalEdits?.toLocaleString() ?? '-'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Total Edits
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h4" fontWeight={600}>
              {stats?.articlesCreated ?? '-'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Articles Created
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h4" fontWeight={600}>
              {user?.registrationDate
                ? format(new Date(user.registrationDate), 'yyyy')
                : '-'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Member Since
            </Typography>
          </Grid>
        </Grid>

        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 2, color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }}
          endIcon={<OpenIcon />}
          onClick={() => window.open(`https://en.wikipedia.org/wiki/User:${configuredUsername}`, '_blank')}
        >
          View Wikipedia Profile
        </Button>
      </CardContent>
    </Card>
  );
}

// === App Settings ===

function AppSettings() {
  const {
    refreshInterval,
    setRefreshInterval,
    showNotifications,
    setShowNotifications,
    compactMode,
    setCompactMode,
    resetSettings,
  } = useSettingsStore();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6">Dashboard Settings</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Auto-refresh Interval</InputLabel>
            <Select
              value={refreshInterval}
              label="Auto-refresh Interval"
              onChange={(e) => setRefreshInterval(e.target.value as number)}
            >
              <MenuItem value={1}>Every 1 minute</MenuItem>
              <MenuItem value={5}>Every 5 minutes</MenuItem>
              <MenuItem value={10}>Every 10 minutes</MenuItem>
              <MenuItem value={30}>Every 30 minutes</MenuItem>
              <MenuItem value={0}>Disabled</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={showNotifications}
                onChange={(e) => setShowNotifications(e.target.checked)}
              />
            }
            label="Show browser notifications"
          />

          <FormControlLabel
            control={
              <Switch
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
              />
            }
            label="Compact mode"
          />

          <Divider />

          <Button
            variant="text"
            color="error"
            onClick={resetSettings}
          >
            Reset to Defaults
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// === About Section ===

function AboutSection() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InfoIcon color="primary" />
          <Typography variant="h6">About</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          Wikipedia Editor Dashboard is an unofficial tool for Wikipedia editors to track
          their contributions, view statistics, and manage their editing workflow.
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          Data is fetched from:
        </Typography>

        <List dense>
          <ListItem>
            <ListItemText
              primary="Wikipedia MediaWiki API"
              secondary="Contributions, user info, page assessments"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="XTools API"
              secondary="Edit statistics, top edits, namespace breakdown"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Wikimedia REST API"
              secondary="Page view statistics"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenIcon />}
            onClick={() => window.open('https://github.com/thomasvincent/wiki-dashboard', '_blank')}
          >
            GitHub
          </Button>
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenIcon />}
            onClick={() => window.open('https://en.wikipedia.org/wiki/Wikipedia:Tools', '_blank')}
          >
            Wikipedia Tools
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// === Main Settings Panel ===

export function SettingsPanel() {
  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Settings"
        subtitle="Configure your dashboard and account"
      />

      <Grid container spacing={2}>
        {/* Profile Card */}
        <Grid item xs={12}>
          <UserProfileCard />
        </Grid>

        {/* Username Config */}
        <Grid item xs={12} md={6}>
          <UsernameConfig />
        </Grid>

        {/* OAuth Status */}
        <Grid item xs={12} md={6}>
          <OAuthStatus />
        </Grid>

        {/* App Settings */}
        <Grid item xs={12} md={6}>
          <AppSettings />
        </Grid>

        {/* About */}
        <Grid item xs={12} md={6}>
          <AboutSection />
        </Grid>
      </Grid>
    </Box>
  );
}

export default SettingsPanel;
