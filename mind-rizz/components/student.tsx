'use client';

import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import QRCode from 'qrcode';

import {useApp} from './provider';
import {Auth} from './auth';

import {
  Shell,
  Countdown,
  MemberFields,
  Field,
  Toggle,
  Textarea,
  Select,
  AsyncButton,
  LevelClock,
  Icon
} from './ui';

import {blankMember} from '@/lib/defaults';
import {supabase} from '@/lib/supabase';

import type {Member,Team} from '@/lib/types';


/* =========================================================
   STUDENT ROUTER
========================================================= */

export function StudentRouter(){

  const path=usePathname();
  const router=useRouter();

  const {state,loading}=useApp();

  const mode=path.split('/')[2]||'dashboard';


  if(
    [
      'login',
      'signup',
      'forgot-password',
      'reset-password'
    ].includes(mode)
  ){

    return <Auth mode={mode}/>;

  }


  if(loading){

    return (
      <main className="auth-wrap">
        Loading your dashboard...
      </main>
    );

  }


  if(!state.profile){

    return <Auth/>;

  }


  /*
   * Admin accounts should never use the student dashboard.
   */
  if(state.profile.role==='admin'){

    router.replace('/admin');

    return null;

  }


  return <Student/>;

}


/* =========================================================
   STUDENT DASHBOARD
========================================================= */

function Student(){

  const {
    state
  }=useApp();


  const [tab,setTab]=useState('Overview');


  const me=state.profile!;


  /*
   * Find the team belonging to the current student.
   */
  const team=
    state.teams.find(
      t =>
        t.owner_id===me.id ||
        t.members.some(
          m =>
            m.email?.toLowerCase()===
            me.email?.toLowerCase()
        )
    );


  const now=Date.now();


  const announcements=
    state.announcements.filter(
      a =>
        a.published &&
        Date.parse(a.publish_at)<=now &&
        (
          a.audience==='everyone' ||

          (
            a.audience==='checked-in' &&
            !!team?.checked_in_at
          ) ||

          (
            a.audience==='team' &&
            a.team_id===team?.id
          )
        )
    );


  return (

    <Shell
      kind="student"
      tab={tab}
      setTab={setTab}
      tabs={[
        'Overview',
        'My team',
        'QR pass',
        'Levels',
        'Announcements',
        'Change member',
        'Settings'
      ]}
    >


      {/* =================================================
          OVERVIEW
      ================================================= */}

      {tab==='Overview' && (

        <>

          <div className="dashboard-welcome card">

            <div>

              <small className="eyebrow">
                READY TO THINK BIG?
              </small>


              <h2>
                Hey, {me.name.split(' ')[0]}.
              </h2>


              <p>
                Your journey to the next level starts here.
              </p>


              <button
                type="button"
                className="button"
                onClick={()=>
                  setTab(team?'QR pass':'My team')
                }
              >

                {team
                  ? 'Show my team pass'
                  : 'Create your team'}

                {' '}→

              </button>

            </div>


            <Countdown/>

          </div>


          <div className="stat-grid">


            <div className="card">

              <small>
                TEAM
              </small>

              <h3>
                {team?.name||'Not registered'}
              </h3>

            </div>


            <div className="card">

              <small>
                MEMBERS
              </small>

              <h3>
                {team?'2 / 2':'0 / 2'}
              </h3>

            </div>


            <div className="card">

              <small>
                CHECK-IN
              </small>

              <h3>
                {team?.checked_in_at
                  ? 'Checked in'
                  : 'Not checked in'}
              </h3>

            </div>


          </div>


          <h2>
            Your level progress
          </h2>


          <div className="level-grid">

            {state.levels.map(l=>

              <div
                className="card"
                key={l.id}
              >

                <span className="badge">
                  {l.status}
                </span>


                <h3>
                  {l.name}
                </h3>


                <LevelClock level={l}/>

              </div>

            )}

          </div>

        </>

      )}


      {/* =================================================
          MY TEAM
      ================================================= */}

      {tab==='My team' && (

        team

          ? (

            <div className="card">


              <div className="section-heading">

                <div>

                  <small>
                    {team.code}
                  </small>


                  <h2>
                    {team.name}
                  </h2>

                </div>


                <span className="badge">
                  {team.status}
                </span>

              </div>


              <div className="form-grid">


                {team.members.map((m,i)=>

                  <div
                    className="member-card"
                    key={i}
                  >

                    <Icon name="Users"/>


                    <h3>
                      {m.name}
                    </h3>


                    <span className="badge">

                      {i===0
                        ? 'TEAM LEADER'
                        : 'MEMBER 2'}

                    </span>


                    <p>

                      <strong>
                        Email:
                      </strong>
                      {' '}
                      {m.email}

                      <br/>

                      <strong>
                        Phone:
                      </strong>
                      {' '}
                      {m.phone}

                      <br/>

                      <strong>
                        Roll No:
                      </strong>
                      {' '}
                      {m.roll_no}

                      <br/>

                      <strong>
                        Department:
                      </strong>
                      {' '}
                      {m.branch}

                      <br/>

                      <strong>
                        Course:
                      </strong>
                      {' '}
                      {m.course==='diploma'
                        ? 'Diploma'
                        : 'Degree'}

                      <br/>

                      <strong>
                        Year:
                      </strong>
                      {' '}
                      {getYearLabel(m.year)}

                    </p>

                  </div>

                )}

              </div>


              <p>

                Registered{' '}

                {new Date(
                  team.created_at
                ).toLocaleString()}.

                {' '}

                Member replacements require organizer approval.

              </p>


            </div>

          )

          : <CreateTeam/>

      )}


      {/* =================================================
          QR PASS
      ================================================= */}

      {tab==='QR pass' && (

        team

          ? <Pass team={team}/>

          : (

            <p className="empty">
              Create your team first to receive your QR pass.
            </p>

          )

      )}


      {/* =================================================
          LEVELS
      ================================================= */}

      {tab==='Levels' && (

        <div className="stack">


          {state.levels.map(l=>

            <div
              className="card"
              key={l.id}
            >


              <div className="section-heading">

                <div>

                  <span className="badge">
                    LEVEL {l.id} / {l.status}
                  </span>


                  <h2>
                    {l.name}
                  </h2>

                </div>


                <LevelClock level={l}/>

              </div>


              <p>
                {l.description}
              </p>


              <h3>
                Instructions
              </h3>


              <p className="preline">
                {l.instructions}
              </p>


              <h3>
                Rules
              </h3>


              <p>
                {l.rules}
              </p>


              <small>
                {l.minutes} minutes · Challenges happen offline.
              </small>


            </div>

          )}

        </div>

      )}


      {/* =================================================
          ANNOUNCEMENTS
      ================================================= */}

      {tab==='Announcements' && (

        announcements.length

          ? announcements.map(a=>

              <article
                className="card"
                key={a.id}
              >

                <small>

                  {new Date(
                    a.publish_at
                  ).toLocaleString()}

                </small>


                <h2>
                  {a.title}
                </h2>


                <p>
                  {a.message}
                </p>

              </article>

            )

          : (

            <p className="empty">
              No announcements for your team yet.
            </p>

          )

      )}


      {/* =================================================
          CHANGE MEMBER
      ================================================= */}

      {tab==='Change member' && (

        team && team.owner_id===me.id

          ? <ChangeMember team={team}/>

          : (

            <p className="empty">
              Only a registered team leader can request a member change.
            </p>

          )

      )}


      {/* =================================================
          SETTINGS
      ================================================= */}

      {tab==='Settings' && <Settings/>}


    </Shell>

  );

}


/* =========================================================
   YEAR LABEL
========================================================= */

function getYearLabel(
  year:Member['year']
){

  switch(year){

    case '1':
      return '1st Year';

    case '2':
      return '2nd Year';

    case '3':
      return '3rd Year';

    case '4':
      return '4th Year';

    default:
      return '';

  }

}


/* =========================================================
   MEMBER VALIDATION
========================================================= */

function validateMember(
  member:Member,
  number:number
){

  /*
   * Indian mobile number:
   * exactly 10 digits
   * first digit must be 6, 7, 8 or 9
   */
  const phoneRegex=
    /^[6-9][0-9]{9}$/;


  /*
   * Roll number:
   * minimum 1 character
   * maximum 30 characters
   *
   * Allowed:
   * A-Z
   * a-z
   * 0-9
   * /
   * _
   * -
   */
  const rollNoRegex=
    /^[A-Za-z0-9/_-]{1,30}$/;


  if(!member.name.trim()){

    return (
      `Member ${number}: Enter your full name.`
    );

  }


  if(!member.email.trim()){

    return (
      `Member ${number}: Enter your email address.`
    );

  }


  if(
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      member.email.trim()
    )
  ){

    return (
      `Member ${number}: Enter a valid email address.`
    );

  }


  if(!phoneRegex.test(member.phone.trim())){

    return (
      `Member ${number}: Enter a valid 10-digit Indian mobile number.`
    );

  }


  if(!rollNoRegex.test(member.roll_no.trim())){

    return (
      `Member ${number}: Enter a valid Roll No.`
    );

  }


  if(!member.branch.trim()){

    return (
      `Member ${number}: Enter your Department / Branch.`
    );

  }


  if(!member.course){

    return (
      `Member ${number}: Select Diploma or Degree.`
    );

  }


  if(!member.year){

    return (
      `Member ${number}: Select your year.`
    );

  }


  return null;

}


/* =========================================================
   CREATE TEAM
========================================================= */

function CreateTeam(){

  const {
    state,
    act,
    notify
  }=useApp();


  const [name,setName]=useState('');


  /*
   * Member 1 automatically uses
   * the logged-in user's profile.
   */
  const [a,setA]=useState<Member>({

    ...blankMember,

    name:state.profile?.name||'',

    email:state.profile?.email||'',

    phone:state.profile?.phone||'',

    roll_no:state.profile?.roll_no||'',

    branch:state.profile?.branch||'',

    course:state.profile?.course||'',

    year:state.profile?.year||''

  });


  const [b,setB]=useState<Member>({
    ...blankMember
  });


  const [agreed,setAgreed]=useState(false);

  const [review,setReview]=useState(false);

  const [busy,setBusy]=useState(false);


  const handleSubmit=async()=>{


    /* =====================================================
       TEAM NAME
    ===================================================== */

    const cleanTeamName=
      name.trim();


    if(cleanTeamName.length<2){

      notify(
        'Enter a valid team name.'
      );

      return;

    }


    if(cleanTeamName.length>80){

      notify(
        'Team name must be 80 characters or less.'
      );

      return;

    }


    /* =====================================================
       MEMBER 1 VALIDATION
    ===================================================== */

    const errorA=
      validateMember(a,1);


    if(errorA){

      notify(errorA);

      return;

    }


    /* =====================================================
       MEMBER 2 VALIDATION
    ===================================================== */

    const errorB=
      validateMember(b,2);


    if(errorB){

      notify(errorB);

      return;

    }


    /* =====================================================
       NORMALIZED VALUES
    ===================================================== */

    const emailA=
      a.email.trim().toLowerCase();


    const emailB=
      b.email.trim().toLowerCase();


    const phoneA=
      a.phone.trim();


    const phoneB=
      b.phone.trim();


    const rollA=
      a.roll_no.trim().toLowerCase();


    const rollB=
      b.roll_no.trim().toLowerCase();


    /* =====================================================
       DUPLICATE EMAIL
    ===================================================== */

    if(emailA===emailB){

      notify(
        'Member 1 and Member 2 must have different email addresses.'
      );

      return;

    }


    /* =====================================================
       DUPLICATE PHONE
    ===================================================== */

    if(phoneA===phoneB){

      notify(
        'Member 1 and Member 2 must have different phone numbers.'
      );

      return;

    }


    /* =====================================================
       DUPLICATE ROLL NUMBER
    ===================================================== */

    if(rollA===rollB){

      notify(
        'Member 1 and Member 2 must have different Roll No.'
      );

      return;

    }


    /* =====================================================
       REVIEW
    ===================================================== */

    if(!review){

      setReview(true);

      return;

    }


    /* =====================================================
       AGREEMENT
    ===================================================== */

    if(!agreed){

      notify(
        'Please agree to the event rules before registering.'
      );

      return;

    }


    setBusy(true);


    try{


      const clean=(m:Member):Member=>({

        name:m.name.trim(),

        email:m.email.trim().toLowerCase(),

        phone:m.phone.trim(),

        roll_no:m.roll_no.trim(),

        branch:m.branch.trim(),

        course:m.course,

        year:m.year

      });


      await act(
        'create_team',
        {
          name:cleanTeamName,

          members:[
            clean(a),
            clean(b)
          ],

          agreed

        }
      );


    }catch(err){

      notify(
        err instanceof Error
          ? err.message
          : 'Registration failed.'
      );

    }finally{

      setBusy(false);

    }

  };


  return (

    <form
      className="card"
      onSubmit={async e=>{

        e.preventDefault();

        await handleSubmit();

      }}
    >


      <span className="badge">
        EXACTLY 2 MEMBERS
      </span>


      <h2>

        {review
          ? 'Review your registration'
          : 'Build your dream team.'}

      </h2>


      {!review ? (

        <>


          {/* =================================================
              TEAM NAME
          ================================================= */}

          <Field
            label="Team name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={e=>
              setName(e.target.value)
            }
          />


          {/* =================================================
              MEMBER 1
          ================================================= */}

          <h3>
            Member 1 / Team Leader
          </h3>


          <MemberFields
            value={a}
            onChange={setA}
            leader
          />


          {/* =================================================
              MEMBER 2
          ================================================= */}

          <h3>
            Member 2
          </h3>


          <MemberFields
            value={b}
            onChange={setB}
          />


        </>

      ) : (


        /* ===================================================
           REVIEW SCREEN
        =================================================== */

        <div className="review">


          <h3>
            {name}
          </h3>


          {/* MEMBER 1 */}

          <div className="card">

            <span className="badge">
              MEMBER 1 · TEAM LEADER
            </span>


            <h3>
              {a.name}
            </h3>


            <p>

              <strong>
                Email:
              </strong>
              {' '}
              {a.email}

              <br/>

              <strong>
                Phone:
              </strong>
              {' '}
              {a.phone}

              <br/>

              <strong>
                Roll No:
              </strong>
              {' '}
              {a.roll_no}

              <br/>

              <strong>
                Department / Branch:
              </strong>
              {' '}
              {a.branch}

              <br/>

              <strong>
                Course:
              </strong>
              {' '}
              {a.course==='diploma'
                ? 'Diploma'
                : 'Degree'}

              <br/>

              <strong>
                Year:
              </strong>
              {' '}
              {getYearLabel(a.year)}

            </p>


          </div>


          {/* MEMBER 2 */}

          <div className="card">

            <span className="badge">
              MEMBER 2
            </span>


            <h3>
              {b.name}
            </h3>


            <p>

              <strong>
                Email:
              </strong>
              {' '}
              {b.email}

              <br/>

              <strong>
                Phone:
              </strong>
              {' '}
              {b.phone}

              <br/>

              <strong>
                Roll No:
              </strong>
              {' '}
              {b.roll_no}

              <br/>

              <strong>
                Department / Branch:
              </strong>
              {' '}
              {b.branch}

              <br/>

              <strong>
                Course:
              </strong>
              {' '}
              {b.course==='diploma'
                ? 'Diploma'
                : 'Degree'}

              <br/>

              <strong>
                Year:
              </strong>
              {' '}
              {getYearLabel(b.year)}

            </p>


          </div>


          <p>

            Team size:
            {' '}
            <strong>
              2 / 2
            </strong>

            <br/>

            Both members must be unique participants.

          </p>


        </div>

      )}


      {/* =====================================================
          AGREEMENT
      ===================================================== */}

      <Toggle
        label="I agree to the event rules and confirm both members' details."
        value={agreed}
        onChange={setAgreed}
      />


      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="actions">


        {review && (

          <button
            type="button"
            className="button secondary"
            onClick={()=>
              setReview(false)
            }
            disabled={busy}
          >
            Edit details
          </button>

        )}


        <button
          type="submit"
          className="button"
          disabled={busy}
        >

          {busy

            ? 'Submitting...'

            : review

              ? 'Confirm and register'

              : 'Review team'}

          {' '}→

        </button>


      </div>


    </form>

  );

}


/* =========================================================
   QR PASS
========================================================= */

function Pass({
  team
}:{
  team:Team
}){

  const {state}=useApp();


  const [qr,setQr]=useState('');

  const [error,setError]=useState('');


  useEffect(()=>{

    QRCode.toDataURL(
      team.qr_token,
      {
        width:320,
        margin:2,
        errorCorrectionLevel:'M'
      }
    )

      .then(setQr)

      .catch(()=>{

        setError(
          'Unable to create QR image. Please refresh.'
        );

      });

  },[team.qr_token]);


  return (

    <div className="pass-area">


      <div className="team-pass">


        <div className="pass-header">

          <Icon name="Brain"/>

          {state.config.name}

          <span>
            TEAM PASS
          </span>

        </div>


        <h2>
          {team.name}
        </h2>


        <p className="pass-code">
          {team.code}
        </p>


        {qr

          ? (

            <img
              src={qr}
              width="240"
              height="240"
              alt={
                'QR check-in pass for '+
                team.name
              }
            />

          )

          : (

            <p>
              {error||'Creating QR pass...'}
            </p>

          )

        }


        <div className="pass-members">

          {team.members.map((m,i)=>

            <div key={i}>

              <small>

                {i===0
                  ? 'LEADER'
                  : 'MEMBER'}

              </small>


              <strong>
                {m.name}
              </strong>


            </div>

          )}

        </div>


        <span className="badge">

          {team.status}

          {' · '}

          {team.checked_in_at
            ? 'CHECKED IN'
            : 'AWAITING CHECK-IN'}

        </span>


        <p>
          {state.config.venue}
        </p>


      </div>


      <div className="actions no-print">


        <button
          type="button"
          className="button"
          onClick={()=>
            window.print()
          }
        >
          Print / save as PDF
        </button>


        {qr && (

          <a
            className="button secondary"
            download={team.code+'-qr.png'}
            href={qr}
          >
            Download QR
          </a>

        )}


      </div>


      <p className="no-print">

        Bring your student IDs.

        Keep this pass private;

        it is your team's check-in token.

      </p>


    </div>

  );

}


/* =========================================================
   CHANGE MEMBER
========================================================= */

function ChangeMember({
  team
}:{
  team:Team
}){

  const {
    state,
    act,
    notify
  }=useApp();


  const [member,setMember]=useState<Member>({
    ...blankMember
  });


  const [reason,setReason]=useState('');

  const [busy,setBusy]=useState(false);


  return (

    <>


      <form
        className="card"
        onSubmit={async e=>{

          e.preventDefault();


          const validation=
            validateMember(member,2);


          if(validation){

            notify(validation);

            return;

          }


          if(!reason.trim()){

            notify(
              'Please enter a reason for the member replacement.'
            );

            return;

          }


          setBusy(true);


          try{

            await act(
              'request_change',
              {
                member,
                reason:reason.trim()
              }
            );


            setMember({
              ...blankMember
            });


            setReason('');


          }catch(err){

            notify(
              err instanceof Error
                ? err.message
                : 'Request failed.'
            );

          }finally{

            setBusy(false);

          }

        }}
      >


        <h2>
          Request a member replacement
        </h2>


        <p>

          Current member:
          {' '}

          <strong>
            {team.members[1]?.name}
          </strong>.

          {' '}

          No change is made until an organizer approves.

        </p>


        <MemberFields
          value={member}
          onChange={setMember}
        />


        <Textarea
          label="Reason"
          required
          value={reason}
          onChange={e=>
            setReason(e.target.value)
          }
        />


        <button
          type="submit"
          className="button"
          disabled={busy}
        >

          {busy
            ? 'Sending...'
            : 'Send request'}

        </button>


      </form>


      {state.requests
        .filter(
          r =>
            r.team_id===team.id
        )
        .map(r=>

          <div
            className="card"
            key={r.id}
          >

            <span className="badge">
              {r.status}
            </span>


            <h3>
              {r.member.name}
            </h3>


            <p>
              {r.reason}
            </p>


          </div>

        )}


    </>

  );

}


/* =========================================================
   SETTINGS
========================================================= */

function Settings(){

  const {
    state,
    act,
    notify
  }=useApp();


  const current=state.profile!;


  const [profile,setProfile]=useState<Member>({

    name:current.name||'',

    email:current.email||'',

    phone:current.phone||'',

    roll_no:current.roll_no||'',

    branch:current.branch||'',

    course:current.course||'',

    year:current.year||''

  });


  const [password,setPassword]=useState('');


  return (

    <div className="stack">


      {/* =================================================
          PROFILE
      ================================================= */}

      <div className="card">


        <h2>
          Your profile
        </h2>


        <MemberFields
          value={profile}
          onChange={setProfile}
          leader
        />


        <p>

          Your login email stays unchanged.

          Team pass details remain locked after registration.

        </p>


        <AsyncButton
          run={async()=>{


            const validation=
              validateMember(profile,1);


            if(validation){

              throw new Error(validation);

            }


            await act(
              'profile',
              {
                ...profile,
                email:state.profile!.email
              }
            );

          }}
        >

          Save profile

        </AsyncButton>


      </div>


      {/* =================================================
          APPEARANCE
      ================================================= */}

      <div className="card">


        <h2>
          Appearance
        </h2>


        <Select
          label="Your dashboard theme"
          value={state.profile!.theme}
          options={[
            'dark',
            'light'
          ]}
          onChange={e=>

            void act(
              'profile',
              {
                theme:e.target.value
              }
            )

              .catch(err=>
                notify(
                  err instanceof Error
                    ? err.message
                    : 'Unable to update theme.'
                )
              )

          }
        />


        <p>

          This changes only your dashboard,

          not the official event website.

        </p>


      </div>


      {/* =================================================
          ACCOUNT SECURITY
      ================================================= */}

      <div className="card">


        <h2>
          Account security
        </h2>


        <Field
          label="New password (at least 8 characters)"
          type="password"
          minLength={8}
          value={password}
          onChange={e=>
            setPassword(e.target.value)
          }
        />


        <AsyncButton
          run={async()=>{


            if(!supabase){

              throw new Error(
                'Supabase is not configured.'
              );

            }


            if(password.length<8){

              throw new Error(
                'Use at least 8 characters.'
              );

            }


            const {error}=
              await supabase.auth.updateUser({
                password
              });


            if(error){

              throw error;

            }


            setPassword('');


            notify(
              'Password updated.'
            );


          }}
        >

          Update password

        </AsyncButton>


      </div>


    </div>

  );

}