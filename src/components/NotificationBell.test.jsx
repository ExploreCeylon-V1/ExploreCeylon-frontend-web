import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = vi.hoisted(() => ({
  getMyNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));
vi.mock('../services/notificationService', () => ({
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
}));

import NotificationBell from './NotificationBell';

const sampleNotifications = [
  {
    id: 1,
    title: 'Balance payment due',
    message: 'Your remaining 80% balance is due soon.',
    bookingType: 'VEHICLE',
    bookingId: 42,
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Balance payment due',
    message: 'Your remaining 80% balance is due soon.',
    bookingType: 'GUIDE',
    bookingId: 7,
    read: true,
    createdAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  getUnreadCount.mockResolvedValue(1);
  getMyNotifications.mockResolvedValue(sampleNotifications);
  markNotificationRead.mockResolvedValue();
  markAllNotificationsRead.mockResolvedValue();
});

describe('NotificationBell', () => {
  it('renders the unread count badge from getUnreadCount', async () => {
    render(<NotificationBell />);

    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(getUnreadCount).toHaveBeenCalled();
  });

  it('does not render a badge when there are no unread notifications', async () => {
    getUnreadCount.mockResolvedValue(0);
    render(<NotificationBell />);

    await waitFor(() => expect(getUnreadCount).toHaveBeenCalled());
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('marks an unread notification as read, opens full-message modal, and navigates when action clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByLabelText('Notifications'));
    const items = await screen.findAllByText('Balance payment due');
    // sampleNotifications[0] (id: 1) is the unread one and renders first.
    await user.click(items[0]);

    // 1. Notification marked as read
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(1));

    // 2. Modal opened with untruncated message
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Your remaining 80% balance is due soon.')).toBeInTheDocument();

    // 3. Navigate when 'View in Bookings' clicked
    const actionBtn = screen.getByText('View in Bookings');
    await user.click(actionBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/profile?tab=bookings');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the modal when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByLabelText('Notifications'));
    const items = await screen.findAllByText('Balance payment due');
    await user.click(items[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    await user.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the modal when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByLabelText('Notifications'));
    const items = await screen.findAllByText('Balance payment due');
    await user.click(items[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a long multi-paragraph notification message without truncation in the modal', async () => {
    const longMsg = "Dear traveler,\n\nYour 80% remaining balance payment for vehicle booking #42 is due. Please settle the payment to confirm your booking and secure your vehicle driver.\n\nThank you for choosing ExploreCeylon!";
    getMyNotifications.mockResolvedValue([
      {
        id: 99,
        title: 'Important Booking Notice',
        message: longMsg,
        bookingType: 'VEHICLE',
        bookingId: 42,
        read: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByLabelText('Notifications'));
    const items = await screen.findAllByText('Important Booking Notice');
    await user.click(items[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Dear traveler,"))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Thank you for choosing ExploreCeylon!"))).toBeInTheDocument();
  });

  it('closes the modal when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<NotificationBell />);

    await user.click(screen.getByLabelText('Notifications'));
    const items = await screen.findAllByText('Balance payment due');
    await user.click(items[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click backdrop (first div inside dialog)
    const backdrop = container.querySelector('.bg-slate-950\\/60');
    await user.click(backdrop);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
