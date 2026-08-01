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

  it('marks an unread notification as read and navigates when clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await user.click(screen.getByLabelText('Notifications'));
    const items = await screen.findAllByText('Balance payment due');
    // sampleNotifications[0] (id: 1) is the unread one and renders first.
    await user.click(items[0]);

    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(1));
    expect(mockNavigate).toHaveBeenCalledWith('/profile?tab=bookings');
  });
});
