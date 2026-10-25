# Phase B, step 5: Elastic IP (the server's fixed address)

## Why

A server's normal public address changes whenever it's stopped and started
(for example when resizing it after the Free plan upgrade). DNS (peyyala.com)
and your SSH logins need an address that never changes: an **Elastic IP**,
attached to `shared-web-1`.

Cost: about $3.60 a month (AWS charges for every public IPv4 address), from
credits while on the Free plan. An Elastic IP that isn't attached to a
running server costs the same and does nothing, so never leave one unattached.

Time: about 3 minutes, plus the first login.

## Steps (as `joshva-admin`, region Mumbai)

### A. Allocate it

**EC2** > **Network & Security** > **Elastic IPs** > **Allocate Elastic IP address**:

1. Network border group: `ap-south-1`
2. Public IPv4 address pool: **Amazon's pool of IPv4 addresses**
3. Tags: `Name` = `shared-web-1-ip`, `Stack` = `shared`
4. **Allocate**

### B. Attach it to the server

Select the new address > **Actions** > **Associate Elastic IP address**:

1. Resource type: **Instance**
2. Instance: `shared-web-1`
3. Private IP address: the only one offered
4. **Associate**

The instance's **Public IPv4 address** now shows the Elastic IP. The
temporary address from step 4 is released.

### C. First login

From the laptop (PowerShell):

```powershell
ssh -i "$HOME\.ssh\shared-web-key.pem" ubuntu@<elastic-ip>
```

The first time, ssh asks whether to trust the server ("Are you sure you want
to continue connecting"): type `yes`. It remembers the server from then on,
and warns if it ever changes.

On the server, a quick look:

```bash
lsb_release -d    # Ubuntu 24.04 LTS
nproc; free -h    # 2 CPUs, about 2 GB memory
df -h /           # about 29 GB disk
exit
```

## The address

Elastic IP: `...` (not a secret; needed for DNS in Phase D and for Phase C)

## Status

- [ ] Elastic IP allocated and tagged
- [ ] Associated with `shared-web-1`
- [ ] First SSH login works with `shared-web-key`
