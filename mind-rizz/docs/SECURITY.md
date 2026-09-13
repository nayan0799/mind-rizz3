# Security notes

## Authorization boundary

The admin screen is a client UI. Actual authorization happens in PostgreSQL: mutate requires a verified Supabase session identity, looks up the trusted profiles.role column, and checks the requested action before changing data. Signup metadata cannot set roles. There are no browser service-role credentials.

All app tables have Row Level Security. Browser roles receive SELECT only, subject to policies. They have no direct INSERT/UPDATE/DELETE grants. All writes pass through the validated mutate RPC. Helper functions that expose complete rankings or modify records have their default PUBLIC execution grants revoked. get_state projects data appropriate to the caller.

- Anonymous callers: public event configuration, levels, published public announcements, count of teams, and a privacy-safe leaderboard only when enabled.
- Students: their own profile/team/members/attendance/change requests and allowed announcements. Unpublished team scores are hidden. Profile email and role cannot be changed through mutate.
- Administrators: all event records, score controls, publishing, content management, and audit log.
- Public leaderboard fields: team UUID/code/name, scores, total, rank, and optional tie order. No email, phone, college ID, member name, or QR secret is projected.

Tables use SECURITY DEFINER helpers with explicit search paths to avoid recursive RLS policy evaluation. Functions must remain owned by the migration owner. Do not grant untrusted accounts schema creation permissions or ownership of application functions.

## Registration integrity

mutate uses a transaction-scoped advisory lock for single-event changes. Capacity checks and team creation cannot race through different simultaneous requests. Exactly two JSON members are enforced by a table CHECK; a normalized member registry uses unique email/college-ID constraints. The registry updates transactionally when a replacement is approved. A rollback restores the previous team.

IDs use a database sequence; QR tokens are random UUIDs. Neither is a permission grant. Checking in a token still requires an administrator and a valid check-in window. A duplicate attendance row is rejected.

## Scoring and publication

Score ranges are checked both in the RPC and a table trigger. Score keys are unique per team and level. The app uses whole-number scores. Publication requires all levels completed, every confirmed team checked in, three scores per eligible team, and resolved ties. Unpublish to change scores, team eligibility, or tie-break policy. The CMS cannot bypass publication by modifying its generic configuration field.

Absent/disqualified teams cannot be scored or ranked. Restoring eligibility must happen before publishing. The published leaderboard is derived from protected scores, avoiding manual total/rank fields.

## Files and exports

Only administrators may upload event assets. Allowed types are PNG, JPEG, WebP, GIF, and ICO; the bucket limits files to 5 MB. SVG and HTML uploads are rejected. Production asset URLs must use HTTPS. Old uploads are not garbage-collected automatically: remove unused assets in Supabase Storage after verifying they are no longer referenced.

CSV output quotes cells and neutralizes common spreadsheet formula prefixes. Exports containing member information are sensitive. Share only with authorized organizers, encrypt backups, and delete exports when no longer needed.

## Before collecting real information

- Obtain appropriate participant consent and publish your institution's privacy notice. This package does not supply institution-specific legal policies.
- Configure SMTP, confirmation email, password policy, authentication rate limits, and optional CAPTCHA.
- Disable the local demo for the deployed backend environment.
- Review dependency updates and create a lockfile after a successful local install/test/build.
- Test policies with anonymous, two student, and admin sessions. Test direct REST requests, not just the visible UI.
- Use HTTPS, restrict organizer account access, and consider MFA before real event operation.
- Verify backups, log retention, account deletion procedures, and data retention policy. Self-service account deletion is not implemented; an authorized operator must handle it.
- Do not reuse the same database for multiple concurrent event deployments without adding event-scoped keys and authorization.
- Do not treat this generated source package as an audited or penetration-tested system. Complete a live deployment review.

The app records mutation action names and actor IDs, but does not store detailed before/after snapshots. SQL edits performed directly by a database operator bypass application logging; restrict database administration accordingly.