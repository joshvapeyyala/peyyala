# Phase B, step 4: The server (EC2 `shared-web-1`)

## Why

The machine that runs Caddy (HTTPS), PM2 and every project's site.

## Free plan (decided 2026-10-25)

The account is on AWS's **Free plan**: usage is paid from credits, only some
instance types are allowed (`t3a.medium` isn't), and the plan ends after
6 months or when the credits run out, whichever comes first. **If the account
isn't upgraded to the paid plan by then, AWS closes it**, with the site,
database and backups on it. Decision: stay on the Free plan for now with a
smaller allowed server, and upgrade before it ends.

- [ ] Credits balance and expiry noted here: ...
- [ ] Reminder set for 2 weeks before the earlier of the two dates: upgrade to
      the paid plan (Billing and Cost Management). Remaining credits stay
      usable until 12 months after sign-up.

Cheaper server = credits last longer. Resizing later (for example to
`t3a.medium` after upgrading) takes about 2 minutes of downtime: stop, change
instance type, start. Everything on the disk stays.

## The size

In the launch screen's **Instance type** dropdown, only types marked
**Free tier eligible** can be launched. Pick the first of these that is
listed:

| Choice | Type          | CPU, memory     | Approx. per month | Notes |
| ------ | ------------- | --------------- | ----------------- | ----- |
| 1st    | `t3.small`    | 2 vCPU, 2 GB    | ~$16              | x86, matches the plan's Ubuntu image |
| 2nd    | `t4g.small`   | 2 vCPU, 2 GB    | ~$12              | Arm: then also pick the **64-bit (Arm)** Ubuntu image in step 2 |
| 3rd    | `c7i-flex.large` | 2 vCPU, 4 GB | much more (~$60)  | only if neither small type is allowed; burns credits ~4× faster |

Not a `micro` type (1 GB): too little memory to build a Next.js site.

With 2 GB, the site runs comfortably (it uses ~130–400 MB); builds lean on
the 4 GB swap file from Phase C, so a deploy may take 5–10 minutes instead of
3–5. Several projects may not fit in 2 GB: revisit in Phase H.

Prices are estimates (Mumbai, before 18% GST), paid from credits while they
last.

## Other choices

| Choice                  | Value                                   | Why |
| ----------------------- | --------------------------------------- | --- |
| Operating system        | Ubuntu Server 24.04 LTS                 | supported until 2029; what the Phase C script targets |
| CPU credits             | **Standard** (`t3`/`t4g` only)          | the default, Unlimited, bills extra when the CPU stays busy; Standard slows down instead |
| Disk                    | 30 GB gp3, **encrypted**                | room for releases, logs and swap |
| Key pair                | `shared-web-key`                        | step 2 |
| Firewall                | `shared-web-sg`                         | step 3 |
| Metadata (IMDSv2)       | required                                | blocks a common way attackers steal server credentials |
| Termination protection  | on                                      | can't be deleted by a mis-click |

Time: about 10 minutes.

## Steps (as `joshva-admin`, region Mumbai)

**EC2** > **Instances** > **Launch instances**:

1. **Name and tags:** Name `shared-web-1`. Click **Add additional tags** and
   add `Stack` = `shared`.
2. **Application and OS Images:** **Ubuntu** > **Ubuntu Server 24.04 LTS
   (HVM), SSD Volume Type**. Architecture **64-bit (x86)**, or **64-bit (Arm)**
   if you'll pick `t4g.small`. (Not "Pro".)
3. **Instance type:** the first allowed type from the table above.
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
   - **Credit specification:** **Standard** (not shown for `c7i-flex`: skip)
   - **Metadata accessible:** Enabled
   - **Metadata version:** **V2 only (token required)**
   - leave everything else as it is
8. **Number of instances:** 1 > **Launch instance**.

If the launch is refused with a Free plan message (for example about the disk
size or encryption), stop and note the exact message.

## How to check

**Instances** > `shared-web-1`, after a minute or two:

- **Instance state:** Running
- **Status check:** all checks passed
- **Details** tab: the instance type you picked, Termination protection
  Enabled, IMDSv2 Required
- **Storage** tab: 30 GiB, Encrypted Yes
- **Security** tab: `shared-web-sg`

Don't log in yet: the public address changes when the Elastic IP is
attached in step 5. The first login is the check at the end of step 5.

## Status

- [x] `shared-web-1` launched (2026-10-25). It first came up as `t3.micro`
      (908 MB, too small); changed to **`t3.small`** (stop, change type,
      start). Confirmed from the server: `t3.small`, 2 vCPU, 1.9 GB.
- [x] Running, zone `ap-south-1b`
- [x] IMDSv2 required (a request without a token gets 401)
- [ ] Storage tab: Encrypted Yes; Details tab: termination protection Enabled

**Operating system:** AWS's Ubuntu option now installs **Ubuntu 26.04.1 LTS**
(supported until 2031), not 24.04. Kept: the Phase C script targets 26.04.
