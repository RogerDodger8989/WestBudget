import React, { useState, useEffect, useMemo } from 'react';
import { Bell, X } from 'lucide-react';

const NotificationBell = ({ agreements = [], vehicles = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState(new Set());

  // Calculate upcoming payments (within 7 days) and service reminders
  const notifications = useMemo(() => {
    const allNotifications = [];
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    // Agreement payment reminders
    if (agreements && agreements.length > 0) {
      const upcomingPayments = agreements
        .filter(a => a.status === 'Aktiv' && (a.next_payment || a.nextPayment))
        .map(a => {
          const nextPayment = a.next_payment || a.nextPayment;
          if (!nextPayment) return null;
          
          const paymentDate = new Date(nextPayment);
          if (paymentDate >= now && paymentDate <= sevenDaysFromNow) {
            const daysUntil = Math.ceil((paymentDate - now) / (1000 * 60 * 60 * 24));
            return {
              id: `agreement-${a.id}`,
              type: 'payment',
              message: `${a.name} - Nästa betalning om ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagar'}`,
              date: paymentDate,
              agreement: a
            };
          }
          return null;
        })
        .filter(Boolean);
      
      allNotifications.push(...upcomingPayments);
    }
    
    // Vehicle service reminders
    if (vehicles && vehicles.length > 0) {
      const activeVehicles = vehicles.filter(v => v.status === 'Aktiv');
      
      // Service reminders based on date
      const serviceDateReminders = activeVehicles
        .filter(v => v.next_service_date)
        .map(v => {
          const serviceDate = new Date(v.next_service_date);
          if (serviceDate >= now && serviceDate <= sevenDaysFromNow) {
            const daysUntil = Math.ceil((serviceDate - now) / (1000 * 60 * 60 * 24));
            return {
              id: `vehicle-service-date-${v.id}`,
              type: 'service',
              message: `${v.make_model} (${v.registration_number}) - Service om ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagar'}`,
              date: serviceDate,
              vehicle: v
            };
          }
          return null;
        })
        .filter(Boolean);
      
      allNotifications.push(...serviceDateReminders);
      
      // Service reminders based on odometer (within 500 mil)
      const serviceOdometerReminders = activeVehicles
        .filter(v => v.next_service_odometer && v.odometer)
        .map(v => {
          const remainingMiles = v.next_service_odometer - v.odometer;
          if (remainingMiles > 0 && remainingMiles <= 500) {
            return {
              id: `vehicle-service-odometer-${v.id}`,
              type: 'service',
              message: `${v.make_model} (${v.registration_number}) - Service om ${remainingMiles} mil`,
              date: new Date(now.getTime() + (remainingMiles * 24 * 60 * 60 * 1000)), // Estimate based on average usage
              vehicle: v,
              odometerBased: true
            };
          }
          return null;
        })
        .filter(Boolean);
      
      allNotifications.push(...serviceOdometerReminders);
    }
    
    // Sort by date (soonest first)
    return allNotifications.sort((a, b) => a.date - b.date);
  }, [agreements, vehicles]);

  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length;

  const handleMarkAsRead = (id) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const handleMarkAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadNotifications(allIds);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse"></span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-zinc-950 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Påminnelser</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Markera alla som lästa
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  Inga påminnelser
                </div>
              ) : (
                notifications.map(notification => {
                  const isRead = readNotifications.has(notification.id);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        !isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10 animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {notification.type === 'service' && (
                              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
                                Service
                              </span>
                            )}
                            {notification.type === 'payment' && (
                              <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded">
                                Betalning
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isRead ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-900 dark:text-white font-medium'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {notification.date.toLocaleDateString('sv-SE', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        {!isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

