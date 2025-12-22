import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar';

// Mock the useAuth hook
jest.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

describe('Navbar', () => {
  const renderWithRouter = (component: React.ReactNode) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  test('renders navbar with logo and navigation links', () => {
    renderWithRouter(<Navbar />);
    
    // Check if the logo/link is rendered
    expect(screen.getByText('Incredible India')).toBeInTheDocument();
  });

  test('renders auth buttons when user is not logged in', () => {
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});