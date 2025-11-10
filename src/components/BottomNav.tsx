import { Inbox, Edit3, Send } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
}

export function BottomNav({ currentPage, onNavigate, isLoggedIn }: BottomNavProps) {
  if (!isLoggedIn) return null;

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'write', label: 'Write', icon: Edit3 },
    { id: 'sent', label: 'Sent', icon: Send },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm shadow-vintage">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 space-y-1 transition-colors ${
                isActive 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
