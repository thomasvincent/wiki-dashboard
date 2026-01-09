/**
 * StatusChip Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render } from '../../utils/test-utils';
import { screen } from '@testing-library/dom';
import { StatusChip } from '@presentation/components/common';

describe('StatusChip', () => {
  describe('Draft Status', () => {
    it('renders pending_review status correctly', () => {
      render(<StatusChip status="pending_review" type="draft" />);
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
    });

    it('renders under_review status correctly', () => {
      render(<StatusChip status="under_review" type="draft" />);
      expect(screen.getByText('Under Review')).toBeInTheDocument();
    });

    it('renders in_development status correctly', () => {
      render(<StatusChip status="in_development" type="draft" />);
      expect(screen.getByText('In Development')).toBeInTheDocument();
    });

    it('renders accepted status correctly', () => {
      render(<StatusChip status="accepted" type="draft" />);
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });

    it('renders declined status correctly', () => {
      render(<StatusChip status="declined" type="draft" />);
      expect(screen.getByText('Declined')).toBeInTheDocument();
    });
  });

  describe('Task Status', () => {
    it('renders not_started status correctly', () => {
      render(<StatusChip status="not_started" type="task-status" />);
      expect(screen.getByText('Not Started')).toBeInTheDocument();
    });

    it('renders in_progress status correctly', () => {
      render(<StatusChip status="in_progress" type="task-status" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('renders completed status correctly', () => {
      render(<StatusChip status="completed" type="task-status" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('renders blocked status correctly', () => {
      render(<StatusChip status="blocked" type="task-status" />);
      expect(screen.getByText('Blocked')).toBeInTheDocument();
    });
  });

  describe('Task Priority', () => {
    it('renders high priority correctly', () => {
      render(<StatusChip status="high" type="task-priority" />);
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('renders medium priority correctly', () => {
      render(<StatusChip status="medium" type="task-priority" />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('renders low priority correctly', () => {
      render(<StatusChip status="low" type="task-priority" />);
      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  describe('Focus Area Status', () => {
    it('renders active status correctly', () => {
      render(<StatusChip status="active" type="focus-area" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders planned status correctly', () => {
      render(<StatusChip status="planned" type="focus-area" />);
      expect(screen.getByText('Planned')).toBeInTheDocument();
    });

    it('renders completed status correctly', () => {
      render(<StatusChip status="completed" type="focus-area" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies chip variant outlined', () => {
      render(<StatusChip status="active" type="focus-area" />);
      const chip = screen.getByText('Active').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-outlined');
    });

    it('applies small size', () => {
      render(<StatusChip status="high" type="task-priority" />);
      const chip = screen.getByText('High').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeSmall');
    });
  });
});
