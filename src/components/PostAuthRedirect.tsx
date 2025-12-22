import { usePostAuthRedirect } from '@/hooks/usePostAuthRedirect';

/**
 * Component that handles post-authentication redirects
 * This should be included in the main App layout
 */
export default function PostAuthRedirect() {
  usePostAuthRedirect();
  return null; // This component doesn't render anything
}