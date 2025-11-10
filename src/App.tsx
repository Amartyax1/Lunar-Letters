import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './components/HomePage';
import { SignupPage } from './components/SignupPage';
import { LoginPage } from './components/LoginPage';
import { InboxPage } from './components/InboxPage';
import { WritePage } from './components/WritePage';
import { SentPage } from './components/SentPage';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './context/AuthContext'; // ⬅️ new
import { supabase } from './lib/supabaseClient'; // ⬅️ new

type Page = 'home' | 'signup' | 'login' | 'inbox' | 'write' | 'sent';

interface EditLetter {
  id: string;
  to: string;
  subject: string;
  content: string;
  backgroundColor: string;
}

export default function App() {
  const { user, logout } = useAuth(); // ⬅️ from Supabase
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [letterToEdit, setLetterToEdit] = useState<EditLetter | null>(null);

  // When user logs in or out, adjust current page
  useEffect(() => {
    if (user) {
      setCurrentPage('inbox');
    } else {
      setCurrentPage('home');
    }
  }, [user]);

  const handleSignup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) console.error('Signup error:', error.message);
  };

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error('Login error:', error.message);
  };

  const handleSignOut = async () => {
    await logout();
    setLetterToEdit(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleEditLetter = (letter: EditLetter) => {
    setLetterToEdit(letter);
    setCurrentPage('write');
  };

  const handleClearEdit = () => {
    setLetterToEdit(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isLoggedIn={!!user}
        onSignOut={handleSignOut}
      />

      <main className={user ? 'pb-20 md:pb-0' : ''}>
        {!user && currentPage === 'home' && (
          <HomePage
            onGetStarted={() => setCurrentPage('signup')}
            onNavigateToSignup={() => setCurrentPage('signup')}
          />
        )}

        {!user && currentPage === 'signup' && (
          <SignupPage
            onSignup={() => {}}
            onNavigateToLogin={() => setCurrentPage('login')}
          />
        )}

        {!user && currentPage === 'login' && (
          <LoginPage
            onLogin={() => {}}
            onNavigateToSignup={() => setCurrentPage('signup')}
          />
        )}

        {user && (currentPage === 'inbox' || currentPage === 'home') && <InboxPage />}
        {user && currentPage === 'write' && (
          <WritePage letterToEdit={letterToEdit} onClearEdit={handleClearEdit} />
        )}
        {user && currentPage === 'sent' && <SentPage onEditLetter={handleEditLetter} />}
      </main>

      <BottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isLoggedIn={!!user}
      />

      <Toaster />
    </div>
  );
}

