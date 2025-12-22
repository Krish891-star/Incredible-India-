import { useAuth } from '@/lib/auth';

export type UserRole = 'tourist' | 'tour_guide' | 'admin';

export interface RolePermissions {
  canViewProfile: boolean;
  canEditProfile: boolean;
  canBookHotels: boolean;
  canCreateGuides: boolean;
  canManageGuides: boolean;
  canManageHotels: boolean;
  canManageBookings: boolean;
  canViewAdminPanel: boolean;
  canManageUsers: boolean;
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  canViewProfile: false,
  canEditProfile: false,
  canBookHotels: false,
  canCreateGuides: false,
  canManageGuides: false,
  canManageHotels: false,
  canManageBookings: false,
  canViewAdminPanel: false,
  canManageUsers: false
};

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  tourist: {
    canViewProfile: true,
    canEditProfile: true,
    canBookHotels: true,
    canCreateGuides: false,
    canManageGuides: false,
    canManageHotels: false,
    canManageBookings: false,
    canViewAdminPanel: false,
    canManageUsers: false
  },
  tour_guide: {
    canViewProfile: true,
    canEditProfile: true,
    canBookHotels: true,
    canCreateGuides: true,
    canManageGuides: true,
    canManageHotels: false,
    canManageBookings: true,
    canViewAdminPanel: false,
    canManageUsers: false
  },
  admin: {
    canViewProfile: true,
    canEditProfile: true,
    canBookHotels: true,
    canCreateGuides: true,
    canManageGuides: true,
    canManageHotels: true,
    canManageBookings: true,
    canViewAdminPanel: true,
    canManageUsers: true
  }
};

export function useRoleAccess() {
  const { user } = useAuth();
  
  const userRole = user?.role || 'tourist';
  const permissions = ROLE_PERMISSIONS[userRole as UserRole] || DEFAULT_PERMISSIONS;
  
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission] || false;
  };
  
  const isAuthorized = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRoles.includes(user.role as UserRole);
  };
  
  return {
    userRole,
    permissions,
    hasPermission,
    isAuthorized,
    isAuthenticated: !!user
  };
}