import { useNavigate } from 'react-router-dom';
import UnifiedRegistration from '@/components/UnifiedRegistration';

export default function GuideRegistration() {
  const navigate = useNavigate();
  
  const handleComplete = () => {
    // Refresh the profile page to show updated status
    navigate('/profile');
  };
  
  return <UnifiedRegistration role="tour_guide" onComplete={handleComplete} />;
}