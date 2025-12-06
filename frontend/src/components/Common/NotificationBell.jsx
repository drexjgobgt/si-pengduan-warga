import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { notificationAPI } from '../../services/api';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll({ is_read: false, limit: 10 });
      setUnreadCount(response.data.unreadCount);
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifikasi</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Tidak ada notifikasi baru
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 border-b hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => markAsRead(notif.id)}
                >
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                  {notif.complaint_title && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      Pengaduan: {notif.complaint_title}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

