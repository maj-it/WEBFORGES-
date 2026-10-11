# X-KERNEL CORE SECURITY SPECIFICATION

## Data Invariants
1. A **Project** must always belong to a specific operator (userId).
2. **CMS Data** keys must be unique within a user's scope and strictly formatted.
3. **Deployments** are publicly readable but only writable by the verified author.

## The Dirty Dozen Payloads (Target: DENIED)
1. **Identity Spoofing**: Attempt to create a project with a `userId` that is not the authenticated user's UID.
2. **Project Hijacking**: Attempt to update another user's project by guessing their `projectId`.
3. **Admin Escalation**: Injecting `isAdmin: true` into a user profile.
4. **Data Poisoning**: Creating a project with a 5MB version list (resource exhaustion).
5. **ID Infiltration**: Using a document ID containing malicious symbols or exceeding 128 chars.
6. **Time Warp**: Setting a future `createdAt` date for a deployment.
7. **CMS Overwrite**: Deleting another user's CMS keys.
8. **Deployment Shadowing**: Re-assigning an existing deployment `authorId`.
9. **Relational Orphan**: Creating a deployment for a non-existent project.
10. **State Skipping**: Manually setting `currentVersionIndex` to a negative value.
11. **Shadow Update**: Adding unexpected fields to the Project schema during update.
12. **Anonymous Write**: Attempting to write without an email-verified account.

## Test Runner (TDD)
The following will be verified using the security rules and simulated payloads.
