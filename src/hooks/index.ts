/**
 * Hooks Index
 * Export all custom hooks for easy import
 */

export * from './useSupabase';
export * from './usePostAuthRedirect';

// Export default modules
import useSupabase from './useSupabase';
import { usePostAuthRedirect } from './usePostAuthRedirect';

export { useSupabase, usePostAuthRedirect };