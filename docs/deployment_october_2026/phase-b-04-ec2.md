# Phase B, step 4: The server (EC2 `shared-web-1`)

## Why

The machine that runs Caddy (HTTPS), PM2 and every project's site. One server
for all projects, as planned.

| Choice                  | Value                                   | Why |
| ----------------------- | --------------------------------------- | --- |
| Operating system        | Ubuntu Server 24.04 LTS, 64-bit (x86)   | supported until 2029; what the Phase C script targets |
| Size                    | t3a.medium (2 vCPU, 4 GB)               | several Next.js sites plus builds need the memory |
| CPU credits             | **Standard**                            | the default, Unlimited, bills extra when the CPU stays busy for long; Standard slows down instead of charging |
| Disk                    | 30 GB gp3, **encrypted**                | room for releases, logs and swap |
| Key pair                | `shared-web-key`                        | step 2 |
| Firewall                | `shared-web-sg`                         | step 3 |
| Metadata (IMDSv2)       | required                                | blocks a common way attackers steal server credentials |
| Termination protection  | on                                      | can't be deleted by a mis-click |

**Cost starts now:** roughly $30–37 a month for the server plus about $3 for
the disk, billed by the second while it runs.

Time: about 10 minutes.

## Steps (as `joshva-admin`, region Mumbai)

**EC2** > **Instances** > **Launch instances**:

1. **Name and tags:** Name `shared-web-1`. Click **Add additional tags** and
   add `Stack` = `shared`.
2. **Application and OS Images:** **Ubuntu** > **Ubuntu Server 24.04 LTS
   (HVM), SSD Volume Type**. Architecture **64-bit (x86)**. (Not "Pro", not
   Arm.)
3. **Instance type:** `t3a.medium`.
4. **Key pair:** `shared-web-key`.
5. **Network settings** > **Edit**:
   - VPC: the default VPC
   - Subnet: No preference
   - Auto-assign public IP: **Enable** (replaced by the Elastic IP in step 5)
   - Firewall: **Select existing security group** > `shared-web-sg`
6. **Configure storage:** `30` GiB, **gp3**. Click **Advanced** and set
   **Encrypted: Encrypted** (KMS key: the default `aws/ebs`). Delete on
   termination: Yes.
7. **Advanced details** (expand):
   - **Termination protection:** Enable
   - **Credit specification:** **Standard**
   - **Metadata accessible:** Enabled
   - **Metadata version:** **V2 only (token required)**
   - leave everything else as it is
8. **Number of instances:** 1 > **Launch instance**.

## How to check

**Instances** > `shared-web-1`, after a minute or two:

- **Instance state:** Running
- **Status check:** 3/3 (or 2/2) checks passed
- **Details** tab: Instance type `t3a.medium`, Termination protection
  Enabled, IMDSv2 Required
- **Storage** tab: 30 GiB, Encrypted Yes
- **Security** tab: `shared-web-sg`

Don't log in yet: the public address changes when the Elastic IP is
attached in step 5. The first login is the check at the end of step 5.

## Status

- [ ] `shared-web-1` launched as above
- [ ] Running, status checks passed
- [ ] Details, storage and security confirmed
