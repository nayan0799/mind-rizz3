# Acceptance checklist

Use a dedicated test Supabase project. Run both migrations before starting. Keep two independent browser profiles for students and a third for the administrator.

## Automated local checks

Run npm test for the shared ranking, timer, and CSV logic. Run npm run typecheck and npm run build for the full Next.js project. Those latter commands require installing npm dependencies and were not run in the generation environment.

## Public site

- At widths 360, 768, and 1440 pixels, verify navigation, registration CTA, level modal, rules, and footer without page-level horizontal overflow.
- Open and close navigation on mobile; test keyboard focus and Escape/backdrop handling for dialogs.
- Enable the OS reduced-motion preference and verify animations stop while content remains visible.
- Edit CMS text, visibility, list order, image assets, countdown, dark colors, and public theme. Verify the public page reflects saved values after refresh.
- Verify a past countdown shows the configured live/completed message or disappears.
- Verify no public gallery, contact, admin-login link, or certificate functionality appears.

## Authentication and permissions

- Sign up, verify email, log in, log out, reset a forgotten password, and update a password while signed in.
- Ensure an unverified account cannot register when email confirmation is enabled.
- Student A must not see Student B's profile, team token, email, phone, or college ID, including direct REST reads with B's UUID.
- With a student access token, call mutate for score, save_config, publish, checkin, and review_change. Each must fail.
- Direct authenticated INSERT/UPDATE/DELETE requests to all application tables must fail.
- Calling ranked_teams directly as anon/authenticated must fail; get_state must still return a safe public projection when enabled.
- Attempt profiles role/email updates through mutate; verify the trusted fields remain unchanged.
- Sign up with raw metadata containing role=admin. Verify the profile remains a student.
- A student must not upload, update, or delete event-assets. Admin image upload must succeed within the file limits.

## Registration

- Create a valid two-member team and verify leader identity, unique generated code, and QR token.
- Submit one member, three members, missing rules agreement, duplicate emails/IDs, incomplete fields, and invalid email format. Each must fail.
- Attempt registration before opens_at, after deadline, when closed, and at capacity.
- Run two simultaneous registration requests for the final slot. Exactly one should succeed.
- Try registering again with the same account or a member already registered elsewhere.
- Edit the personal profile after registration: the locked team pass must remain unchanged.
- Request a replacement and ensure it does not apply before approval. Reject it, then submit and approve a valid replacement.
- Attempt approval of a replacement who is already registered; the existing roster must remain unchanged.

## Event operation

- Download the QR image and print/save the complete pass to PDF. The QR should decode to the exact team token, not an invented graphic.
- On HTTPS with a phone camera, scan the pass. Verify both members and explicitly check in.
- Repeat the scan/check-in. The original attendance time must not be overwritten.
- Test missing camera permission and manual Team ID lookup.
- Try check-in before/after the event window and for a disqualified team.
- Start Level 1, pause, reload, resume, then end. The timer must retain its elapsed time. Earlier levels must finish before later levels start.
- Timer reaching zero must not silently end the offline level; the admin uses End level.
- Complete the three levels. Enter zero, maximum, negative, decimal, and over-maximum scores. Only whole numbers inside the range should save.
- Enter equal totals with different Level 3 scores. Verify configured tie-break priority.
- Enter exactly identical scores. Verify shared ranks, then assign explicit unique tie order and verify the order changes.

## Results, announcements, and exports

- Before publication, test hidden/admin/after-results/public leaderboard modes. Only explicit public mode exposes live score previews.
- Publication with absent confirmed teams, incomplete scores, unfinished levels, or unresolved ties must fail.
- Disqualify absent teams, complete eligible scores, resolve ties, and publish. Public and student results should match.
- While published, score/eligibility/tie-policy changes must fail; editing other CMS content must not unpublish or bypass the gate.
- Unpublish, correct scores, republish, and compare all totals.
- Schedule a future announcement. Verify it stays hidden until its publication time.
- Test everyone, checked-in, and specific-team audiences in anonymous/student/admin sessions.
- Export all six CSV types. Verify counts against the admin table, escaping of commas/quotes, and that a name beginning with '=' is not evaluated as a spreadsheet formula.

## Production handoff

Set real event dates, institution name, venue, deadline, capacity, SMTP credentials, and approved privacy copy. Confirm production environment variables, redirect URLs, HTTPS, backups, and a manual fallback for connectivity failures. Rehearse the entire event flow before opening registrations.