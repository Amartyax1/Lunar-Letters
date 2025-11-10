import { Bell, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState, useEffect } from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
  onSignOut: () => void;
}

interface Notification {
  id: string;
  message: string;
  time: string;
}

export function Navigation({ currentPage, onNavigate, isLoggedIn, onSignOut }: NavigationProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', message: "You have 2 drafts waiting", time: '2h ago' },
    { id: '2', message: "5 days till the next drop!", time: '1d ago' },
  ]);
  const [unreadCount, setUnreadCount] = useState(2);

  const handleNotificationClick = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const [daysUntilDrop, setDaysUntilDrop] = useState(5);

  useEffect(() => {
    // Calculate days until next month (1st of next month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const diffTime = nextMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysUntilDrop(diffDays);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm shadow-vintage">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 group"
          >
            <Moon className="w-6 h-6 text-foreground group-hover:text-accent transition-colors" />
            <span className="font-display tracking-tight text-foreground">
              Lunar Letters
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {!isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('login')}
                >
                  Log In
                </Button>
                <Button
                  onClick={() => onNavigate('signup')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={currentPage === 'inbox' ? 'secondary' : 'ghost'}
                  onClick={() => onNavigate('inbox')}
                >
                  Inbox
                </Button>
                <Button
                  variant={currentPage === 'write' ? 'secondary' : 'ghost'}
                  onClick={() => onNavigate('write')}
                >
                  Write
                </Button>
                <Button
                  variant={currentPage === 'sent' ? 'secondary' : 'ghost'}
                  onClick={() => onNavigate('sent')}
                >
                  Sent
                </Button>
                
                {/* Notifications Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 paper-texture z-[60]" sideOffset={8}>
                    <div className="p-3 border-b border-border bg-card">
                      <p className="font-mono text-sm text-muted-foreground">Messages from Luna</p>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm bg-card">
                        No new notifications
                      </div>
                    ) : (
                      <div className="bg-card">
                        {notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id)}
                            className="p-4 cursor-pointer flex flex-col items-start hover:bg-secondary/50"
                          >
                            <p className="text-sm">{notification.message}</p>
                            <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  onClick={onSignOut}
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            {isLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 paper-texture z-[60]" sideOffset={8}>
                  <div className="p-3 border-b border-border bg-card">
                    <p className="font-mono text-sm text-muted-foreground">Messages from Luna</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm bg-card">
                      No new notifications
                    </div>
                  ) : (
                    <div className="bg-card">
                      {notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id)}
                          className="p-4 cursor-pointer flex flex-col items-start hover:bg-secondary/50"
                        >
                          <p className="text-sm">{notification.message}</p>
                          <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => isLoggedIn ? onSignOut() : onNavigate('login')}
            >
              {isLoggedIn ? 'Sign Out' : 'Log In'}
            </Button>
          </div>
        </div>
      </div>


    </nav>
  );
}