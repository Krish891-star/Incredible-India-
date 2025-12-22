/**
 * Services Index
 * Export all services for easy import
 */

// Handle the UserRole naming conflict between auth.service and registration.service
// by explicitly importing and re-exporting with different names

// Export everything from database service
export * from './database.service';

// Export everything from directory service
export * from './directory.service';

// Handle auth service exports
import type { UserRole as AuthUserRoleType, User, AuthResponse } from './auth.service';
import { AuthService } from './auth.service';

export type { AuthUserRoleType as AuthUserRole };
export type { User, AuthResponse };
export { AuthService };

// Handle registration service exports
import type { UserRole as RegistrationUserRoleType, RegistrationData, RegistrationStatus } from './registration.service';
import { RegistrationService } from './registration.service';

export type { RegistrationUserRoleType as RegistrationUserRole };
export type { RegistrationData, RegistrationStatus };
export { RegistrationService };

// Export default modules
import databaseService from './database.service';
import authService from './auth.service';
import registrationService from './registration.service';
import directoryService from './directory.service';

export { databaseService, authService, registrationService, directoryService };
