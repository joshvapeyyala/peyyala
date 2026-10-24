# Phase B, step 2: Key pair

## Why

The server allows login with a key only, never a password. A key pair is
two halves:

- the **public** half, which AWS puts on the server when it's created
- the **private** half (`shared-web-key.pem`), a file only you have

Logging in proves you hold the private file. Anyone with a copy of it can
log in, so it's treated like a password. If it's lost, you can't log in
(recovery is possible but fiddly), so it's also backed up.

Time: about 5 minutes. Cost: free.

## Steps

### A. Create it (as `joshva-admin`, region Mumbai)

1. **EC2** > left menu **Network & Security** > **Key Pairs** > **Create key pair**.
2. Name: `shared-web-key`.
3. Key pair type: **ED25519** (modern, short, secure).
4. Private key file format: **.pem** (works with the `ssh` built into Windows).
5. Tag `Stack` = `shared` > **Create key pair**.

The browser downloads `shared-web-key.pem` once. AWS doesn't keep a copy, so
it can't be downloaded again.

### B. Put it where ssh looks, and lock it down (Windows)

In PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.ssh"
Move-Item "$HOME\Downloads\shared-web-key.pem" "$HOME\.ssh\shared-web-key.pem"
icacls "$HOME\.ssh\shared-web-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

The last line makes the file readable by your Windows user only. Without it,
`ssh` refuses to use the key ("UNPROTECTED PRIVATE KEY FILE").

### C. Back it up

Open the file in Notepad and save its whole contents (from
`-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END ...-----`) as a secure note
in your password manager, named `AWS shared-web-key.pem`. Don't email it,
upload it to a drive, or commit it anywhere.

### D. Delete the download

Check `Downloads` no longer has a copy (Move-Item moved it, but a second
download could have left one).

## How it's used (step 4 onward)

```powershell
ssh -i "$HOME\.ssh\shared-web-key.pem" ubuntu@<elastic-ip>
```

GitHub Actions (Phase F) gets its own separate key, never this one.

## If it leaks

Create a new key pair, add its public half to the server
(`~/.ssh/authorized_keys`), remove the old one, and delete the old key pair in
the console.

## Status

- [x] `shared-web-key` created (ED25519, .pem). Fingerprint
      `SHA256:MpA60Hcba2W0BbLNGe/URvIRu+RaXpBgRLvmV65p0sw`: compare with
      the one the EC2 console shows under Key Pairs
- [x] File in `C:\Users\J\.ssh\shared-web-key.pem`, readable by your user only
- [x] Backed up in the password manager
- [x] No copy left in Downloads
