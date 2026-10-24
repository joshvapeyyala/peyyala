# Phase B, step 1: Budget alert

## Why

AWS bills at the end of the month. A budget watches spending during the
month and emails a warning before a limit is reached, so a misconfiguration
or misuse shows up within days, not on the bill. It only warns; it never
stops anything.

## The budget

An existing budget is used: **My Monthly Cost Budget** (monthly cost).

It covers the **whole account**, so until Phase H it must cover the old setup
and the new one together:

```
old setup (last month's bill)  +  new setup (~$55–60)  ≈  budget
```

| When                              | Amount                                  |
| --------------------------------- | --------------------------------------- |
| Before Phase B (old setup only)   | $25                                     |
| Phase B to H (old + new)          | last month's bill + $70, rounded up     |
| After Phase H (old setup deleted) | about $70                               |

Alerts (email): 85% of the budget actual, 100% actual, and 100% forecasted.
The forecasted one warns earliest.

## Changing the amount

As `joshva-admin`: **Budgets** > **My Monthly Cost Budget** > **Edit** >
budgeted amount > Next > check the alerts and their email > **Save**.

Use the currency the console shows; for INR, about ₹85 per dollar.

## If an alert arrives unexpectedly

**Billing and Cost Management** > **Cost Explorer**, grouped by **Service**,
shows what's costing money. Figures can lag up to a day.

## Status

- [x] Budget exists (My Monthly Cost Budget, $25)
- [ ] Amount raised to cover the setup (you'll do this later). Until then,
      expect alerts: the planned EC2 + RDS alone is about $55–60 a month
      once any free tier or credits stop covering it
- [ ] Alerts checked: 85% actual, 100% actual, 100% forecasted, to your email
- [ ] Amount lowered to about $70 after Phase H
