export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  /** Public customer Angular app */
  customerPortalUrl: 'http://localhost:4200',
  /** This organizer app (dev) */
  adminPortalUrl: 'http://localhost:4201',
  logoutRedirectUrl: '/login',
  /** Sign out after this long with no clicks, typing, or pointer movement. */
  idleTimeoutMs: 15 * 60 * 1000
};
