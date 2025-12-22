import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MapPin, Menu, X, User, LogOut, Heart, Settings, Bookmark, Bed } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (email: string, fullName?: string) => {
    if (fullName) {
      return fullName.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-lg shadow-soft py-3'
          : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300',
            isScrolled ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-primary-foreground/20'
          )}>
            <MapPin className={cn(
              'h-5 w-5 transition-colors',
              isScrolled ? 'text-primary-foreground' : 'text-primary-foreground'
            )} />
          </div>
          <span className={cn(
            'font-display text-xl font-bold transition-colors',
            isScrolled ? 'text-foreground' : 'text-primary-foreground'
          )}>
            Incredible India
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary smooth-transition',
              isScrolled ? 'text-foreground' : 'text-primary-foreground'
            )}
          >
            Explore
          </Link>
          <Link
            to="/map"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary smooth-transition',
              isScrolled ? 'text-foreground' : 'text-primary-foreground'
            )}
          >
            Interactive Map
          </Link>
          <Link
            to="/states"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary smooth-transition',
              isScrolled ? 'text-foreground' : 'text-primary-foreground'
            )}
          >
            States
          </Link>
          <Link
            to="/guides"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary smooth-transition',
              isScrolled ? 'text-foreground' : 'text-primary-foreground'
            )}
          >
            Guides
          </Link>
          <Link
            to="/hotels"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary smooth-transition',
              isScrolled ? 'text-foreground' : 'text-primary-foreground'
            )}
          >
            Hotels
          </Link>
        </div>

        {/* Auth Buttons / User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-10 w-10 rounded-full"
                onClick={() => navigate('/saved')}
                aria-label="Saved places"
              >
                <Bookmark className="h-5 w-5" />
                <span className="sr-only">Saved places</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src="" alt="Profile" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                        {getInitials(user.email, user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.full_name || 'Traveler'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                      {user.role === 'tour_guide' ? 'Tour Guide' : 'Tourist'}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  {user?.role === 'tour_guide' && (
                    <DropdownMenuItem onClick={() => navigate('/guides/' + user.id)}>
                      <User className="mr-2 h-4 w-4" />
                      My Guide Profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/saved')}>
                    <Heart className="mr-2 h-4 w-4" />
                    Saved Places
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {(user?.role === 'admin' || user?.role === 'hotel_partner') && (
                    <DropdownMenuItem onClick={() => navigate('/hotel-registration')}>
                      <Bed className="mr-2 h-4 w-4" />
                      Register Hotel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant={isScrolled ? 'ghost' : 'outline'}
                size="sm"
                onClick={() => navigate('/auth')}
                className="smooth-transition"
              >
                Sign In
              </Button>
              <Button
                variant={isScrolled ? 'default' : 'default'}
                size="sm"
                onClick={() => navigate('/auth')}
                className="smooth-transition"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className={cn('h-6 w-6', isScrolled ? 'text-foreground' : 'text-primary-foreground')} />
          ) : (
            <Menu className={cn('h-6 w-6', isScrolled ? 'text-foreground' : 'text-primary-foreground')} />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg animate-fade-in z-50">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link to="/" className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <MapPin className="h-4 w-4" />
              Explore
            </Link>
            <Link to="/map" className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <MapPin className="h-4 w-4" />
              Interactive Map
            </Link>
            <Link to="/states" className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <MapPin className="h-4 w-4" />
              States
            </Link>
            <Link to="/guides" className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <User className="h-4 w-4" />
              Guides
            </Link>
            <Link to="/hotels" className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <Heart className="h-4 w-4" />
              Hotels
            </Link>
            {user?.role === 'tour_guide' && (
              <Link to={'/guides/' + user.id} className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <User className="h-4 w-4" />
                My Guide Profile
              </Link>
            )}
            {(user?.role === 'admin' || user?.role === 'hotel_partner') && (
              <Link to="/hotel-registration" className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <Bed className="h-4 w-4" />
                Register Hotel
              </Link>
            )}
            <div className="border-t border-border pt-4 flex gap-3">
              {user ? (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>
                    My Profile
                  </Button>
                  <Button variant="destructive" onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}>
                    Sign In
                  </Button>
                  <Button variant="default" className="flex-1" onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}