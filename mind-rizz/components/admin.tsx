'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useApp } from './provider';
import { Auth } from './auth';
import AdminPopupSettings from './AdminPopupSettings';

import {
  Shell,
  AsyncButton,
  Field,
  Select,
  Textarea,
  Toggle,
  Modal,
  LevelClock,
  Icon,
} from './ui';

import { ConfigEditor } from './editors';
import { Scanner } from './scanner';

import { csv } from '@/lib/ranking';

import type {
  Level,
  Announcement,
} from '@/lib/types';

/* =========================================================
   TYPES
========================================================= */

const tabs: string[] = [
  'Overview',
  'Home',
  'About',
  'Why participate',
  'How it works',
  'Rules',
  'Design',
  'Event settings',
  'Welcome Popup',
  'Registration',
  'Teams',
  'Change requests',
  'Check-in',
  'Attendance',
  'Levels',
  'Announcements',
  'Export data',
  'Activity log',
];
type AdminTab = (typeof tabs)[number];

type TeamMode =
  | 'Teams'
  | 'Check-in'
  | 'Attendance';

type AttendanceFilter =
  | 'All'
  | 'Checked in'
  | 'Not checked in';

type StatusFilter =
  | 'All'
  | 'confirmed'
  | 'disqualified';

type ExportType =
  | 'Teams'
  | 'Members'
  | 'Attendance';

/* =========================================================
   ADMIN ROUTER
========================================================= */

export function AdminRouter() {
  const path = usePathname();
  const router = useRouter();

  const {
    state,
    loading,
    error,
  } = useApp();

  /*
   * Direct admin login route
   */
  if (path === '/admin/login') {
    return <Auth admin />;
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <main className="auth-wrap">
        <h1>Loading the control room...</h1>

        <p>
          Please wait while Mind Rizz loads the
          administrator dashboard.
        </p>
      </main>
    );
  }

  /*
   * Supabase / application error
   */
  if (error) {
    return (
      <main className="auth-wrap">
        <h1>Unable to load admin dashboard</h1>

        <p>{error}</p>

        <a
          className="button"
          href="/admin/login"
        >
          Login again
        </a>
      </main>
    );
  }

  /*
   * Not logged in
   */
  if (!state.profile) {
    return <Auth admin />;
  }

  /*
   * Logged in but not administrator
   */
  if (state.profile.role !== 'admin') {
    return (
      <main className="auth-wrap">
        <h1>Organizer access only.</h1>

        <p>
          Your account does not have administrator
          permissions.
        </p>

        <button
          type="button"
          className="button"
          onClick={() =>
            router.replace('/student/dashboard')
          }
        >
          Student dashboard
        </button>
      </main>
    );
  }

  /*
   * Administrator
   */
  return <Admin />;
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export function Admin() {
  const {
    state,
  } = useApp();

  const [tab, setTab] =
    useState<AdminTab>('Overview');

  const checked =
    state.teams.filter(
      (team) =>
        Boolean(team.checked_in_at),
    ).length;

  const confirmed =
    state.teams.filter(
      (team) =>
        team.status === 'confirmed',
    ).length;

  const notCheckedIn =
    Math.max(
      0,
      state.team_count - checked,
    );

  const configTabs: AdminTab[] = [
    'Home',
    'About',
    'Why participate',
    'How it works',
    'Rules',
    'Design',
    'Event settings',
    'Registration',
  ];

  return (
   <Shell
  kind="admin"
  tab={tab}
  setTab={(value) => setTab(value as AdminTab)}
  tabs={tabs}
>
      {/* =================================================
          OVERVIEW
      ================================================= */}

      {tab === 'Overview' && (
        <>
          {/* Dashboard Welcome */}

          <div className="dashboard-welcome card">
            <div>
              <small className="eyebrow">
                EVERY GREAT EVENT STARTS HERE
              </small>

              <h2>
                You're in control.
              </h2>

              <p>
                Manage the experience.
                Let the minds do the rest.
              </p>
            </div>

            <Icon
              name="Brain"
              size={90}
            />
          </div>

          {/* Statistics */}

          <div className="stat-grid">

            <div className="card">
              <small>
                Total teams
              </small>

              <h2>
                {state.team_count}
              </h2>
            </div>

            <div className="card">
              <small>
                Confirmed
              </small>

              <h2>
                {confirmed}
              </h2>
            </div>

            <div className="card">
              <small>
                Checked in
              </small>

              <h2>
                {checked}
              </h2>
            </div>

            <div className="card">
              <small>
                Not checked in
              </small>

              <h2>
                {notCheckedIn}
              </h2>
            </div>

          </div>

          {/* Levels */}

          <div className="level-grid">

            {state.levels.length > 0 ? (
              state.levels.map(
                (level) => (
                  <div
                    className="card"
                    key={level.id}
                  >
                    <span className="badge">
                      {level.status}
                    </span>

                    <h3>
                      {level.name}
                    </h3>

                    <LevelClock
                      level={level}
                    />
                  </div>
                ),
              )
            ) : (
              <p className="empty">
                No levels configured yet.
              </p>
            )}

          </div>

          {/* Event Focus */}

          <div className="card event-focus">

            <h3>
              Event-day focus
            </h3>

            <p>
              Keep registration, QR check-in,
              attendance and level controls
              ready for the live event.
            </p>

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setTab('Check-in')
              }
            >
              Open check-in →
            </button>

          </div>
        </>
      )}

      {/* =================================================
          WELCOME POPUP
      ================================================= */}

      {tab === 'Welcome Popup' && (
        <AdminPopupSettings />
      )}

      {/* =================================================
          CONFIGURATION
      ================================================= */}

      {configTabs.includes(tab) && (
        <ConfigEditor
          section={tab}
          key={tab}
        />
      )}

      {/* =================================================
          TEAMS / ATTENDANCE / CHECK-IN
      ================================================= */}

      {(
        tab === 'Teams' ||
        tab === 'Attendance' ||
        tab === 'Check-in'
      ) && (
        <Teams
          mode={tab}
        />
      )}

      {/* =================================================
          CHANGE REQUESTS
      ================================================= */}

      {tab === 'Change requests' && (
        <ChangeRequests />
      )}

      {/* =================================================
          LEVELS
      ================================================= */}

      {tab === 'Levels' && (
        <div className="stack">
          {state.levels.length > 0 ? (
            state.levels.map(
              (level) => (
                <LevelEditor
                  level={level}
                  key={level.id}
                />
              ),
            )
          ) : (
            <p className="empty">
              No levels configured yet.
            </p>
          )}
        </div>
      )}

      {/* =================================================
          ANNOUNCEMENTS
      ================================================= */}

      {tab === 'Announcements' && (
        <Announcements />
      )}

      {/* =================================================
          EXPORT DATA
      ================================================= */}

      {tab === 'Export data' && (
        <Exports />
      )}

      {/* =================================================
          ACTIVITY LOG
      ================================================= */}

      {tab === 'Activity log' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Time
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {state.logs.length > 0 ? (
                state.logs.map(
                  (log, index) => (
                    <tr
                      key={`${log.created_at}-${index}`}
                    >
                      <td>
                        {new Date(
                          log.created_at,
                        ).toLocaleString()}
                      </td>

                      <td>
                        {log.action}
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr>
                  <td colSpan={2}>
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p>
            Showing the latest 100
            recorded actions.
          </p>
        </div>
      )}
    </Shell>
  );
}

/* =========================================================
   CHANGE REQUESTS
========================================================= */

function ChangeRequests() {
  const {
    state,
    act,
  } = useApp();

  return (
    <div className="stack">
      {state.requests.length > 0 ? (
        state.requests.map(
          (request) => {
            const team =
              state.teams.find(
                (team) =>
                  team.id ===
                  request.team_id,
              );

            return (
              <div
                className="card"
                key={request.id}
              >
                <span className="badge">
                  {request.status}
                </span>

                <h2>
                  {team?.name ??
                    'Unknown team'}
                </h2>

                <p>
                  Replacement:{' '}

                  <strong>
                    {request.member.name}
                  </strong>{' '}

                  (
                  {request.member.email}
                  )
                </p>

                <p>
                  {request.member.college}
                  {' · '}
                  {request.member.college_id}
                  {' · '}
                  {request.member.branch}
                  {' · '}
                  {request.member.phone}
                </p>

                <p>
                  {request.reason}
                </p>

                {request.status ===
                  'pending' && (
                  <div className="actions">
                    <AsyncButton
                      run={() =>
                        act(
                          'review_change',
                          {
                            id: request.id,
                            approve: true,
                          },
                        )
                      }
                    >
                      Approve
                    </AsyncButton>

                    <AsyncButton
                      className="button secondary"
                      run={() =>
                        act(
                          'review_change',
                          {
                            id: request.id,
                            approve: false,
                          },
                        )
                      }
                    >
                      Reject
                    </AsyncButton>
                  </div>
                )}
              </div>
            );
          },
        )
      ) : (
        <p className="empty">
          No member change requests.
        </p>
      )}
    </div>
  );
}

/* =========================================================
   TEAMS
========================================================= */

function Teams({
  mode,
}: {
  mode: TeamMode;
}) {
  const {
    state,
    act,
    notify,
  } = useApp();

  const [search, setSearch] =
    useState('');

  const [attendance, setAttendance] =
    useState<AttendanceFilter>('All');

  const [status, setStatus] =
    useState<StatusFilter>('All');

  const [college, setCollege] =
    useState('');

  const [branch, setBranch] =
    useState('');

  const [selected, setSelected] =
    useState<string | null>(null);

  const team =
    state.teams.find(
      (item) =>
        item.id === selected,
    );

  const searchValue =
    search.trim().toLowerCase();

  const collegeValue =
    college.trim().toLowerCase();

  const branchValue =
    branch.trim().toLowerCase();

  const rows =
    state.teams.filter(
      (item) => {
        const matchesSearch =
          !searchValue ||
          `${item.name} ${item.code}`
            .toLowerCase()
            .includes(searchValue);

        const matchesAttendance =
          attendance === 'All' ||
          (
            attendance === 'Checked in' &&
            Boolean(item.checked_in_at)
          ) ||
          (
            attendance === 'Not checked in' &&
            !item.checked_in_at
          );

        const matchesStatus =
          status === 'All' ||
          item.status === status;

        const matchesCollege =
          !collegeValue ||
          item.members.some(
            (member) =>
              member.college
                .toLowerCase()
                .includes(
                  collegeValue,
                ),
          );

        const matchesBranch =
          !branchValue ||
          item.members.some(
            (member) =>
              member.branch
                .toLowerCase()
                .includes(
                  branchValue,
                ),
          );

        return (
          matchesSearch &&
          matchesAttendance &&
          matchesStatus &&
          matchesCollege &&
          matchesBranch
        );
      },
    );

  function scan(token: string) {
    const value =
      token.trim();

    if (!value) {
      return;
    }

    const found =
      state.teams.find(
        (item) =>
          item.qr_token === value ||
          item.code === value,
      );

    if (found) {
      setSelected(
        found.id,
      );

      notify(
        `Team ${found.code} found.`,
      );
    } else {
      notify(
        'No matching team pass. Check the token or Team ID.',
      );
    }
  }

  return (
    <>
      {/* Scanner */}

      {mode === 'Check-in' && (
        <Scanner
          onScan={scan}
        />
      )}

      {/* Filters */}

      <div className="filters">
        <Field
          label="Search name / Team ID"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
        />

        <Select
          label="Check-in"
          options={[
            'All',
            'Checked in',
            'Not checked in',
          ]}
          value={attendance}
          onChange={(event) =>
            setAttendance(
              event.target.value as AttendanceFilter,
            )
          }
        />

        <Select
          label="Status"
          options={[
            'All',
            'confirmed',
            'disqualified',
          ]}
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value as StatusFilter,
            )
          }
        />

        <Field
          label="College"
          value={college}
          onChange={(event) =>
            setCollege(
              event.target.value,
            )
          }
        />

        <Field
          label="Department"
          value={branch}
          onChange={(event) =>
            setBranch(
              event.target.value,
            )
          }
        />
      </div>

      {/* Team table */}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                Team ID
              </th>

              <th>
                Team
              </th>

              <th>
                Members
              </th>

              <th>
                Status
              </th>

              <th>
                Check-in
              </th>

              <th>
                Details
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (item) => (
                <tr
                  key={item.id}
                >
                  <td>
                    {item.code}
                  </td>

                  <td>
                    <strong>
                      {item.name}
                    </strong>

                    <small>
                      {item.members[0]
                        ?.college ??
                        '—'}
                    </small>
                  </td>

                  <td>
                    {item.members.length}
                    {' / 2'}
                  </td>

                  <td>
                    <span className="badge">
                      {item.status}
                    </span>
                  </td>

                  <td>
                    {item.checked_in_at
                      ? 'Checked in'
                      : 'Not yet'}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setSelected(
                          item.id,
                        )
                      }
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        {!rows.length && (
          <p className="empty">
            No matching teams.
          </p>
        )}
      </div>

      {/* Team details modal */}

      {team && (
        <Modal
          title={team.name}
          onClose={() =>
            setSelected(null)
          }
        >
          <p>
            {team.code}
            {' · '}
            {team.status}
          </p>

          {team.members.length > 0 ? (
            team.members.map(
              (member, index) => (
                <div
                  className="member-card"
                  key={`${team.id}-${index}`}
                >
                  <h3>
                    {member.name}
                    {' / '}
                    {index === 0
                      ? 'Leader'
                      : 'Member'}
                  </h3>

                  <p>
                    {member.email}
                    {' · '}
                    {member.phone}

                    <br />

                    {member.college}
                    {' · '}
                    {member.college_id}

                    <br />

                    {member.branch}
                    {' · Semester '}
                    {member.semester}
                  </p>
                </div>
              ),
            )
          ) : (
            <p>
              No members found.
            </p>
          )}

          <p>
            <strong>
              Registration:
            </strong>{' '}

            {new Date(
              team.created_at,
            ).toLocaleString()}

            <br />

            <strong>
              Check-in:
            </strong>{' '}

            {team.checked_in_at
              ? new Date(
                  team.checked_in_at,
                ).toLocaleString()
              : 'Not checked in'}
          </p>

          <div className="actions">
            {/* Check in */}

            {!team.checked_in_at &&
              team.status ===
                'confirmed' && (
                <AsyncButton
                  run={() =>
                    act(
                      'checkin',
                      {
                        id: team.id,
                      },
                    )
                  }
                >
                  Verify and check in
                </AsyncButton>
              )}

            {/* Change team status */}

            <AsyncButton
              className="button secondary"
              run={async () => {
                const nextStatus =
                  team.status ===
                  'confirmed'
                    ? 'disqualified'
                    : 'confirmed';

                const confirmed =
                  window.confirm(
                    team.status ===
                      'confirmed'
                      ? 'Disqualify this team?'
                      : 'Restore this team?',
                  );

                if (!confirmed) {
                  return;
                }

                await act(
                  'team_status',
                  {
                    id: team.id,
                    status: nextStatus,
                  },
                );
              }}
            >
              {team.status ===
              'confirmed'
                ? 'Disqualify'
                : 'Restore team'}
            </AsyncButton>
          </div>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   LEVEL EDITOR
========================================================= */

function LevelEditor({
  level,
}: {
  level: Level;
}) {
  const { act } =
    useApp();

  const [localLevel, setLocalLevel] =
    useState<Level>(level);

  /*
   * Keep server runtime state synchronized
   * while preserving locally edited fields.
   */
  useEffect(() => {
    setLocalLevel(
      (previous) => ({
        ...previous,

        id: level.id,

        status:
          level.status,

        started_at:
          level.started_at,

        remaining:
          level.remaining,
      }),
    );
  }, [
    level.id,
    level.status,
    level.started_at,
    level.remaining,
  ]);

  function patch(
    key: keyof Level,
    value: unknown,
  ) {
    setLocalLevel(
      (previous) => ({
        ...previous,
        [key]: value,
      }),
    );
  }

  const commands =
    level.status === 'upcoming'
      ? ['start']
      : level.status === 'active'
        ? ['pause', 'end']
        : level.status === 'paused'
          ? ['resume', 'end']
          : [];

  return (
    <div className="card">
      <div className="section-heading">
        <div>
          <span className="badge">
            LEVEL {localLevel.id}
            {' / '}
            {level.status}
          </span>

          <h2>
            {localLevel.name}
          </h2>
        </div>

        <LevelClock
          level={level}
        />
      </div>

      <div className="form-grid">
        <Field
          label="Name"
          value={localLevel.name}
          onChange={(event) =>
            patch(
              'name',
              event.target.value,
            )
          }
        />

        <Field
          label="Short description"
          value={localLevel.short}
          onChange={(event) =>
            patch(
              'short',
              event.target.value,
            )
          }
        />

        <Field
          label="Minutes"
          type="number"
          min="1"
          value={localLevel.minutes}
          onChange={(event) =>
            patch(
              'minutes',
              Number(
                event.target.value,
              ),
            )
          }
        />

        <Field
          label="Maximum score"
          type="number"
          min="1"
          value={localLevel.maximum}
          onChange={(event) =>
            patch(
              'maximum',
              Number(
                event.target.value,
              ),
            )
          }
        />

        <Select
          label="Difficulty"
          options={[
            'Easy',
            'Medium',
            'Hard',
          ]}
          value={localLevel.difficulty}
          onChange={(event) =>
            patch(
              'difficulty',
              event.target.value,
            )
          }
        />
      </div>

      <Textarea
        label="Description"
        value={localLevel.description}
        onChange={(event) =>
          patch(
            'description',
            event.target.value,
          )
        }
      />

      <Textarea
        label="Instructions"
        value={localLevel.instructions}
        onChange={(event) =>
          patch(
            'instructions',
            event.target.value,
          )
        }
      />

      <Textarea
        label="Rules"
        value={localLevel.rules}
        onChange={(event) =>
          patch(
            'rules',
            event.target.value,
          )
        }
      />

      <Toggle
        label="Visible on public website"
        value={localLevel.visible}
        onChange={(value) =>
          patch(
            'visible',
            value,
          )
        }
      />

      <div className="actions">
        {/* Save level */}

        <AsyncButton
          className="button secondary"
          run={() =>
            act(
              'save_level',
              {
                level: localLevel,
              },
            )
          }
        >
          Save level details
        </AsyncButton>

        {/* Level controls */}

        {commands.map(
          (command) => (
            <AsyncButton
              key={command}
              run={async () => {
                if (
                  command === 'end'
                ) {
                  const confirmed =
                    window.confirm(
                      'End and lock this level?',
                    );

                  if (!confirmed) {
                    return;
                  }
                }

                await act(
                  'level_control',
                  {
                    id: localLevel.id,
                    command,
                  },
                );
              }}
            >
              {command} level
            </AsyncButton>
          ),
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ANNOUNCEMENTS
========================================================= */

function Announcements() {
  const {
    state,
    act,
  } = useApp();

  function freshAnnouncement(): Announcement {
    return {
      id: '',
      title: '',
      message: '',
      audience: 'everyone',
      team_id: '',
      published: false,
      publish_at:
        new Date().toISOString(),
    };
  }

  const [item, setItem] =
    useState<Announcement>(
      freshAnnouncement(),
    );

  function updateItem(
    changes: Partial<Announcement>,
  ) {
    setItem(
      (previous) => ({
        ...previous,
        ...changes,
      }),
    );
  }

  async function saveAnnouncement() {
    const title =
      item.title.trim();

    const message =
      item.message.trim();

    const parsedDate =
      Date.parse(
        item.publish_at,
      );

    if (!title) {
      throw new Error(
        'Please enter an announcement title.',
      );
    }

    if (!message) {
      throw new Error(
        'Please enter an announcement message.',
      );
    }

    if (
      !Number.isFinite(
        parsedDate,
      )
    ) {
      throw new Error(
        'Please enter a valid publish time.',
      );
    }

    if (
      item.audience === 'team' &&
      !item.team_id
    ) {
      throw new Error(
        'Please select a team.',
      );
    }

    await act(
      'announcement',
      {
        item: {
          ...item,
          title,
          message,
        },
      },
    );

    setItem(
      freshAnnouncement(),
    );
  }

  return (
    <>
      {/* Create / edit */}

      <div className="card">
        <h2>
          {item.id
            ? 'Edit announcement'
            : 'New announcement'}
        </h2>

        <Field
          label="Title"
          value={item.title}
          onChange={(event) =>
            updateItem({
              title:
                event.target.value,
            })
          }
        />

        <Textarea
          label="Message"
          value={item.message}
          onChange={(event) =>
            updateItem({
              message:
                event.target.value,
            })
          }
        />

        <div className="form-grid">
          <Select
            label="Audience"
            options={[
              'everyone',
              'checked-in',
              'team',
            ]}
            value={item.audience}
            onChange={(event) =>
              updateItem({
                audience:
                  event.target
                    .value as Announcement['audience'],
              })
            }
          />

          <Field
            label="Publish time (ISO 8601 with timezone)"
            value={
              item.publish_at
            }
            onChange={(event) =>
              updateItem({
                publish_at:
                  event.target.value,
              })
            }
          />
        </div>

        {/* Team selection */}

        {item.audience === 'team' && (
          <label className="field">
            <span>
              Team
            </span>

            <select
              value={
                item.team_id
              }
              onChange={(event) =>
                updateItem({
                  team_id:
                    event.target.value,
                })
              }
            >
              <option value="">
                Select a team
              </option>

              {state.teams.map(
                (team) => (
                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.code}
                    {' · '}
                    {team.name}
                  </option>
                ),
              )}
            </select>
          </label>
        )}

        <Toggle
          label="Published (visible at the scheduled time)"
          value={
            item.published
          }
          onChange={(value) =>
            updateItem({
              published:
                value,
            })
          }
        />

        <div className="actions">
          <AsyncButton
            run={saveAnnouncement}
          >
            Save announcement
          </AsyncButton>

          <button
            type="button"
            className="button secondary"
            onClick={() =>
              setItem(
                freshAnnouncement(),
              )
            }
          >
            Clear
          </button>
        </div>
      </div>

      {/* Existing announcements */}

      {state.announcements.length > 0 ? (
        state.announcements.map(
          (announcement) => (
            <div
              className="card"
              key={announcement.id}
            >
              <span className="badge">
                {announcement.audience}
                {' / '}
                {announcement.published
                  ? 'published'
                  : 'draft'}
              </span>

              <h3>
                {announcement.title}
              </h3>

              <p>
                {announcement.message}
              </p>

              <p>
                <small>
                  Publish:{' '}
                  {new Date(
                    announcement.publish_at,
                  ).toLocaleString()}
                </small>
              </p>

              <div className="actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setItem(
                      announcement,
                    )
                  }
                >
                  Edit
                </button>

                <AsyncButton
                  className="button secondary"
                  run={async () => {
                    const confirmed =
                      window.confirm(
                        'Delete this announcement?',
                      );

                    if (!confirmed) {
                      return;
                    }

                    await act(
                      'delete_announcement',
                      {
                        id: announcement.id,
                      },
                    );

                    if (
                      item.id ===
                      announcement.id
                    ) {
                      setItem(
                        freshAnnouncement(),
                      );
                    }
                  }}
                >
                  Delete
                </AsyncButton>
              </div>
            </div>
          ),
        )
      ) : (
        <p className="empty">
          No announcements yet.
        </p>
      )}
    </>
  );
}

/* =========================================================
   CSV EXPORTS
========================================================= */

function Exports() {
  const {
    state,
  } = useApp();

  function download(
    kind: ExportType,
  ) {
    let rows:
      Record<string, unknown>[] =
      [];

    /*
     * Teams CSV
     */
    if (kind === 'Teams') {
      rows =
        state.teams.map(
          (team) => ({
            team_id:
              team.code,

            name:
              team.name,

            status:
              team.status,

            registered_at:
              team.created_at,
          }),
        );
    }

    /*
     * Members CSV
     */
    if (kind === 'Members') {
      rows =
        state.teams.flatMap(
          (team) =>
            team.members.map(
              (member, index) => ({
                team_id:
                  team.code,

                role:
                  index === 0
                    ? 'leader'
                    : 'member',

                ...member,
              }),
            ),
        );
    }

    /*
     * Attendance CSV
     */
    if (
      kind === 'Attendance'
    ) {
      rows =
        state.teams.map(
          (team) => ({
            team_id:
              team.code,

            team:
              team.name,

            checked_in:
              Boolean(
                team.checked_in_at,
              ),

            checked_in_at:
              team.checked_in_at,
          }),
        );
    }

    const csvData =
      csv(rows);

    const blob =
      new Blob(
        [csvData],
        {
          type:
            'text/csv;charset=utf-8',
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        'a',
      );

    link.href =
      url;

    link.download =
      `mind-rizz-${kind.toLowerCase()}.csv`;

    document.body.appendChild(
      link,
    );

    link.click();

    link.remove();

    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          url,
        );
      },
      1000,
    );
  }

  const exportTypes: ExportType[] = [
    'Teams',
    'Members',
    'Attendance',
  ];

  return (
    <div className="benefit-grid">
      {exportTypes.map(
        (kind) => (
          <div
            className="card"
            key={kind}
          >
            <Icon
              name="Sparkles"
            />

            <h3>
              {kind}
            </h3>

            <p>
              {kind ===
              'Members'
                ? 'Contains personal information. Store and share securely.'
                : 'Download a spreadsheet-compatible CSV.'}
            </p>

            <button
              type="button"
              className="button secondary"
              onClick={() =>
                download(
                  kind,
                )
              }
            >
              Export {kind} CSV
            </button>
          </div>
        ),
      )}
    </div>
  );
}

/* =========================================================
   IMPORTANT: DEFAULT EXPORT
========================================================= */

export default AdminRouter;