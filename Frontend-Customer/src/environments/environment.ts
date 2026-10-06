export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  /** Public customer site (this app in dev) */
  customerPortalUrl: 'http://localhost:4200',
  /** Separate organizer Angular app */
  adminPortalUrl: 'http://localhost:4201',
  logoutRedirectUrl: '/',
  /** Sign out after this long with no clicks, typing, or pointer movement. */
  idleTimeoutMs: 15 * 60 * 1000
};
