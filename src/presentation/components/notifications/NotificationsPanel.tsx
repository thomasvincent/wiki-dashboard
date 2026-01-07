/**
 * Notifications Panel Component
 * Displays Wikipedia notifications with grouping and actions
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ThumbUp as ThanksIcon,
  AlternateEmail as MentionIcon,
  Message as MessageIcon,
  RateReview as ReviewIcon,
  EmojiEvents as MilestoneIcon,
  Celebration as WelcomeIcon,
  MarkEmailRead as ReadIcon,
  OpenInNew as OpenIcon,
  Circle as UnreadIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { SectionHeader, EmptyState } from '../common';
import { useNotificationStore } from '@presentation/hooks';
import type { WikiNotification, NotificationType } from '@domain/entities';

// === Notification type configs ===
const NOTIFICATION_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string; label: string }> = {
  'thank': { icon: <ThanksIcon />, color: '#2e7d32', label: 'Thanks' },
  'mention': { icon: <MentionIcon />, color: '#1976d2', label: 'Mention' },
  'message': { icon: <MessageIcon />, color: '#9c27b0', label: 'Message' },
  'review': { icon: <ReviewIcon />, color: '#ed6c02', label: 'Review' },
  'edit-milestone': { icon: <MilestoneIcon />, color: '#d4af37', label: 'Milestone' },
  'welcome': { icon: <WelcomeIcon />, color: '#00796b', label: 'Welcome' },
  'edit-thank': { icon: <ThanksIcon />, color: '#2e7d32', label: 'Edit Thanks' },
};

// === Mock notifications ===
const mockNotifications: WikiNotification[] = [
  {
    id: '1',
    type: 'thank',
    timestamp: new Date(Date.now() - 3600000),
    title: 'Artificial intelligence',
    agent: 'ExampleUser',
    read: false,
    message: 'ExampleUser thanked you for your edit to Artificial intelligence',
    url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
  },
  {
    id: '2',
    type: 'mention',
    timestamp: new Date(Date.now() - 7200000),
    title: 'Talk:Machine learning',
    agent: 'AnotherEditor',
    read: false,
    message: 'AnotherEditor mentioned you on Talk:Machine learning',
    url: 'https://en.wikipedia.org/wiki/Talk:Machine_learning',
  },
  {
    id: '3',
    type: 'message',
    timestamp: new Date(Date.now() - 86400000),
    title: null,
    agent: 'TalkUser',
    read: true,
    message: 'TalkUser left a message on your talk page',
    url: 'https://en.wikipedia.org/wiki/User_talk:YourUsername',
  },
  {
    id: '4',
    type: 'review',
    timestamp: new Date(Date.now() - 172800000),
    title: 'Draft:New article',
    agent: 'Reviewer',
    read: true,
    message: 'Your draft Draft:New article was reviewed',
    url: 'https://en.wikipedia.org/wiki/Draft:New_article',
  },
  {
    id: '5',
    type: 'edit-milestone',
    timestamp: new Date(Date.now() - 259200000),
    title: null,
    agent: null,
    read: true,
    message: 'You have reached 5,000 edits!',
    url: null,
  },
  {
    id: '6',
    type: 'thank',
    timestamp: new Date(Date.now() - 345600000),
    title: 'Neural network',
    agent: 'SomeEditor',
    read: true,
    message: 'SomeEditor thanked you for your edit to Neural network',
    url: 'https://en.wikipedia.org/wiki/Neural_network',
  },
];

// === Notification Item Component ===

interface NotificationItemProps {
  notification: WikiNotification;
  onMarkRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const config = NOTIFICATION_CONFIG[notification.type];

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {!notification.read && (
            <Tooltip title="Mark as read">
              <IconButton size="small" onClick={() => onMarkRead(notification.id)}>
                <ReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {notification.url && (
            <Tooltip title="Open">
              <IconButton
                size="small"
                onClick={() => window.open(notification.url!, '_blank')}
              >
                <OpenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      }
    >
      <ListItemButton
        onClick={() => notification.url && window.open(notification.url, '_blank')}
        sx={{
          pr: 10,
          bgcolor: notification.read ? 'transparent' : 'action.hover',
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: config.color, width: 36, height: 36 }}>
            {config.icon}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!notification.read && (
                <UnreadIcon sx={{ fontSize: 8, color: 'primary.main' }} />
              )}
              <Typography
                variant="body2"
                fontWeight={notification.read ? 400 : 600}
                sx={{ flex: 1 }}
              >
                {notification.message}
              </Typography>
            </Box>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </Typography>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}

// === Main Notifications Panel ===

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<WikiNotification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState<'all' | NotificationType>('all');
  const { setUnreadCount } = useNotificationStore();

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  // Update global unread count
  useMemo(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount, setUnreadCount]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(n => n.type === activeTab);
  }, [notifications, activeTab]);

  // Count by type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    notifications.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const handleMarkRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Box sx={{ p: 2 }}>
      <SectionHeader
        title="Notifications"
        subtitle={`${notifications.length} notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        action={
          unreadCount > 0 && (
            <Chip
              label="Mark all read"
              size="small"
              onClick={handleMarkAllRead}
              sx={{ cursor: 'pointer' }}
            />
          )
        }
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <Badge badgeContent={unreadCount} color="primary">
                <NotificationsIcon color="action" />
              </Badge>
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                {notifications.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <ThanksIcon sx={{ color: '#2e7d32' }} />
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                {typeCounts['thank'] || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Thanks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <MentionIcon sx={{ color: '#1976d2' }} />
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                {typeCounts['mention'] || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mentions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
              <MessageIcon sx={{ color: '#9c27b0' }} />
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                {typeCounts['message'] || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Messages
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All (${typeCounts.all})`} value="all" />
          {Object.entries(NOTIFICATION_CONFIG).map(([type, config]) => (
            typeCounts[type] ? (
              <Tab
                key={type}
                label={`${config.label} (${typeCounts[type]})`}
                value={type}
                icon={config.icon as React.ReactElement}
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            ) : null
          ))}
        </Tabs>
      </Paper>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <Paper variant="outlined">
          <List disablePadding>
            {filteredNotifications.map((notification, index) => (
              <Box key={notification.id}>
                {index > 0 && <Box sx={{ borderTop: 1, borderColor: 'divider' }} />}
                <NotificationItem
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              </Box>
            ))}
          </List>
        </Paper>
      ) : (
        <EmptyState
          title="No notifications"
          description="You're all caught up!"
          icon={<NotificationsIcon sx={{ fontSize: 48 }} />}
        />
      )}

      {/* Login prompt */}
      <Card variant="outlined" sx={{ mt: 2, bgcolor: 'action.hover' }}>
        <CardContent sx={{ py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            This is sample data. Connect your Wikipedia account to see your actual notifications.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default NotificationsPanel;
