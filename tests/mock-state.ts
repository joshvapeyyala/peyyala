// What the stand-ins in setup.ts recorded during a test, and the switches that
// steer them. Reset before every test.

export const mocks = {
  // requireAdmin() passes when true, and redirects to the login page when false
  signedIn: true,
  // Request headers seen by the actions (e.g. the contact form's visitor IP)
  headers: new Headers(),
  // Cache tags passed to updateTag(), and how often refresh() ran
  updatedTags: [] as string[],
  refreshes: 0,
  // Work scheduled with after(), run by the test when it wants
  afterTasks: [] as (() => unknown)[],
  // Emails sent, and whether sending should fail
  mails: [] as { subject: string; text: string; replyTo?: string }[],
  mailFails: false,
};

export function resetMocks() {
  Object.assign(mocks, { signedIn: true, headers: new Headers(), updatedTags: [], refreshes: 0, afterTasks: [], mails: [], mailFails: false });
}

// What the redirect() stand-in throws, like Next.js's own redirect error
export class RedirectError extends Error {
  constructor(readonly url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}
