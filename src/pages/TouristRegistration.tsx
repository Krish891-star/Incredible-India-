import { useNavigate } from 'react-router-dom';
import UnifiedRegistration from '@/components/UnifiedRegistration';

export default function TouristRegistration() {
  const navigate = useNavigate();
  
  const handleComplete = () => {
    // Refresh the profile page to show updated status
    navigate('/profile');
  };
  
  return <UnifiedRegistration role="tourist" onComplete={handleComplete} />;
}