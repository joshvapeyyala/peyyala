# Phase B, step 0: Secure the AWS account

## Why

The **root** login (the email and password the account was created with)
can do everything: delete every resource, change billing, close the account.
No setting can limit it. Once the account runs the live site, the database
and the backups, a leaked root password would put all of it at risk.

So:

1. **MFA on root:** logging in needs the password **and** a 6-digit code
   from a phone app.
2. **A separate admin user, also with MFA, for daily work.** Root stays
   locked away for the few things only root can do.

Time: about 10 minutes. Cost: free.

## Steps

You need an authenticator app on your phone (Google Authenticator, Microsoft
Authenticator, Authy...).

### A. MFA on the root login (done before Phase B)

Root > top right, account name > **Security credentials** > **Multi-factor
authentication (MFA)** > **Assign MFA device** > name `root-phone`,
**Authenticator app** > scan the QR code > two codes in a row > **Add MFA**.

### B. Check root has no access keys

Same page, **Access keys**: there should be none. If any are listed, don't
delete them before checking "Last used": something might depend on them.

### C. Allow admin users to see billing

Needed so the admin user can set up the budget (step 1).

As root: top right > **Account** > **IAM user and role access to Billing
information** > **Edit** > tick **Activate IAM Access** > **Update**.

### D. Create the admin user

1. **IAM** > **Users** > **Create user**.
2. User name: `joshva-admin`.
3. Tick **Provide user access to the AWS Management Console**:
   - **I want to create an IAM user** (if asked)
   - **Custom password**: a strong one, saved in your password manager
   - untick "Users must create a new password at next sign-in"
4. Next > **Attach policies directly** > tick **AdministratorAccess** > Next.
5. Tag `Stack` = `shared` > **Create user**.
6. Copy the **Console sign-in URL**
   (`https://<account-id>.signin.aws.amazon.com/console`) and save it with
   the password.

### E. Sign in as the admin user and give it MFA

1. Sign out of root, open the sign-in URL from D6, sign in as `joshva-admin`.
2. Top right > **Security credentials** > **Assign MFA device** > name
   `admin-phone` > **Authenticator app**, as in A.
3. Sign out and in again to check the code is asked for.

### From now on

- Use `joshva-admin` for everything.
- Use root only when a step says so (changing the account email, closing the
  account, billing access like C).
- Keep the root login separate from the admin login.

## How to check it worked

- Root sign-in asks for a phone code.
- `joshva-admin` sign-in asks for a phone code.
- As `joshva-admin`, **Billing and Cost Management** opens without "access denied".

## Status

- [x] A. MFA on root
- [x] B. Root has no access keys (checked 2026-10-25)
- [x] C. IAM access to billing activated
- [x] D. `joshva-admin` created, sign-in URL saved
- [x] E. `joshva-admin` has MFA; daily work uses it
