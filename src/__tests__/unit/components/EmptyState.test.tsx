/**
 * EmptyState Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '../../utils/test-utils';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@presentation/components/common';
import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

describe('EmptyState', () => {
  it('renders title correctly', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No items found" description="Try adjusting your filters" />);
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.queryByText('Try adjusting')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="No items found" icon={<AddIcon data-testid="empty-icon" />} />);
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('renders action button when provided', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <EmptyState
        title="No items found"
        action={
          <Button onClick={handleClick} data-testid="action-button">
            Add Item
          </Button>
        }
      />
    );

    const button = screen.getByTestId('action-button');
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('centers content vertically and horizontally', () => {
    const { container } = render(<EmptyState title="No items found" />);
    const wrapper = container.firstChild as HTMLElement;

    // Check that flex centering is applied
    expect(wrapper).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    });
  });

  it('renders complete empty state with all props', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <EmptyState
        title="No tasks found"
        description="Create your first task to get started"
        icon={<AddIcon data-testid="task-icon" />}
        action={
          <Button onClick={handleClick} variant="contained">
            Add Task
          </Button>
        }
      />
    );

    expect(screen.getByText('No tasks found')).toBeInTheDocument();
    expect(screen.getByText('Create your first task to get started')).toBeInTheDocument();
    expect(screen.getByTestId('task-icon')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Add Task' });
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
