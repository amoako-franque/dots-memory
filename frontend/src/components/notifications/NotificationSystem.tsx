import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    title?: string;
    duration?: number;
}

interface NotificationContextType {
    showNotification: (notification: Omit<Notification, 'id'>) => void;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showInfo: (message: string, title?: string) => void;
    showWarning: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const newNotification: Notification = {
            ...notification,
            id,
            duration: notification.duration ?? 5000,
        };

        setNotifications(prev => [...prev, newNotification]);

        if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }
    }, [removeNotification]);

    const showSuccess = useCallback((message: string, title?: string) => {
        showNotification({ type: 'success', message, title });
    }, [showNotification]);

    const showError = useCallback((message: string, title?: string) => {
        showNotification({ type: 'error', message, title, duration: 7000 });
    }, [showNotification]);

    const showInfo = useCallback((message: string, title?: string) => {
        showNotification({ type: 'info', message, title });
    }, [showNotification]);

    const showWarning = useCallback((message: string, title?: string) => {
        showNotification({ type: 'warning', message, title });
    }, [showNotification]);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5" />;
            case 'error':
                return <AlertCircle className="h-5 w-5" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5" />;
            case 'info':
                return <Info className="h-5 w-5" />;
        }
    };

    const getColors = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return 'bg-[#F0F6FA] border-[#A8C5D9] text-[#5A8BB0]';
            case 'error':
                return 'bg-[#F5E8EA] border-[#D9A0A8] text-[#8B2E3C]';
            case 'warning':
                return 'bg-[#F5E6D3] border-[#E8D4B8] text-[#8B7355]';
            case 'info':
                return 'bg-[#D4E4F0] border-[#A8C5D9] text-[#5A8BB0]';
        }
    };

    return (
        <NotificationContext.Provider value={{ showNotification, showSuccess, showError, showInfo, showWarning }}>
            {children}
            <div className="fixed top-4 right-2 sm:right-4 z-50 space-y-2 w-full sm:max-w-md px-2 sm:px-0">
                {notifications.map((notification) => (
                    <Card
                        key={notification.id}
                        className={`border-2 ${getColors(notification.type)} shadow-lg animate-in slide-in-from-right w-full`}
                    >
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {notification.title && (
                                        <h4 className="font-semibold mb-1 text-sm sm:text-base">{notification.title}</h4>
                                    )}
                                    <p className="text-xs sm:text-sm break-words">{notification.message}</p>
                                </div>
                                <button
                                    onClick={() => removeNotification(notification.id)}
                                    className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity touch-manipulation"
                                    aria-label="Close notification"
                                >
                                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

