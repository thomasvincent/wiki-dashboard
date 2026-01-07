/**
 * Common UI Components
 * Reusable, composable building blocks
 * Following Material Design 3 guidelines
 */

import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Link,
  Skeleton,
  Tooltip,
  Typography,
  type ChipProps,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  RateReview as ReviewIcon,
  Cancel as CancelIcon,
  Construction as ConstructionIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import type { DraftStatus, TaskPriority, TaskStatus, FocusAreaStatus } from '@domain/entities';
import {
  DRAFT_STATUS_DISPLAY,
  TASK_PRIORITY_DISPLAY,
  TASK_STATUS_DISPLAY,
  FOCUS_AREA_STATUS_DISPLAY,
} from '@domain/value-objects';

// === Status Chip ===

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: DraftStatus | TaskStatus | TaskPriority | FocusAreaStatus;
  type: 'draft' | 'task-status' | 'task-priority' | 'focus-area';
}

const STATUS_ICON_MAP: Record<string, React.ReactNode> = {
  CheckCircle: <CheckCircleIcon fontSize="small" />,
  HourglassEmpty: <HourglassIcon fontSize="small" />,
  RateReview: <ReviewIcon fontSize="small" />,
  Cancel: <CancelIcon fontSize="small" />,
  Construction: <ConstructionIcon fontSize="small" />,
  Archive: <ArchiveIcon fontSize="small" />,
};

export function StatusChip({ status, type, ...props }: StatusChipProps) {
  let display: { label: string; color: string; icon?: string };

  switch (type) {
    case 'draft':
      display = DRAFT_STATUS_DISPLAY[status as DraftStatus];
      break;
    case 'task-status':
      display = TASK_STATUS_DISPLAY[status as TaskStatus];
      break;
    case 'task-priority':
      display = TASK_PRIORITY_DISPLAY[status as TaskPriority];
      break;
    case 'focus-area':
      display = FOCUS_AREA_STATUS_DISPLAY[status as FocusAreaStatus];
      break;
    default:
      display = { label: status, color: '#757575' };
  }

  const chipIcon = display.icon ? STATUS_ICON_MAP[display.icon] as React.ReactElement : undefined;

  return (
    <Chip
      label={display.label}
      size="small"
      {...(chipIcon ? { icon: chipIcon } : {})}
      sx={{
        backgroundColor: `${display.color}20`,
        color: display.color,
        borderColor: display.color,
        fontWeight: 500,
      }}
      variant="outlined"
      {...props}
    />
  );
}

// === Stats Card ===

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  loading?: boolean;
  onClick?: () => void;
}

export function StatsCard({ title, value, subtitle, icon, trend, loading, onClick }: StatsCardProps) {
  if (loading) {
    return (
      <Card sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="80%" height={16} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
        '&:hover': onClick ? { boxShadow: 3 } : undefined,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: 'primary.main', opacity: 0.7 }}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 600, my: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Typography
            variant="caption"
            sx={{ color: trend.value >= 0 ? 'success.main' : 'error.main' }}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// === Progress Card ===

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  subtitle?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function ProgressCard({ title, current, total, subtitle, color = 'primary' }: ProgressCardProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {current}/{total}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percent}
          color={color}
          sx={{ mb: 0.5 }}
        />
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// === Wiki Link ===

interface WikiLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

export function WikiLink({ href, children, external = true }: WikiLinkProps) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {children}
      {external && <OpenInNewIcon sx={{ fontSize: 14 }} />}
    </Link>
  );
}

// === Section Header ===

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}

export function SectionHeader({ title, subtitle, action, onRefresh, loading }: SectionHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box>
        <Typography variant="h5" component="h2" fontWeight={500}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh} disabled={loading ?? false}>
              <RefreshIcon fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        )}
        {action}
      </Box>
    </Box>
  );
}

// === Empty State ===

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box sx={{ color: 'text.secondary', mb: 2, opacity: 0.5 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

// === Loading Skeleton ===

export function DashboardSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={100} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={300} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={200} />
    </Box>
  );
}

// === CSS Animation ===

const globalStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = globalStyles;
  document.head.appendChild(style);
}
