'use client';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import Link from 'next/link';

import {
  Brain,
  ArrowUpRight,
  X,
  Check,
  ChevronRight,
  Users,
  Timer,
  Target,
  Trophy,
  Zap,
  Sparkles,
  Menu,
  LogOut
} from 'lucide-react';

import {useApp} from './provider';

import {remaining} from '@/lib/ranking';

import type {
  Level,
  Member,
  Standing
} from '@/lib/types';


/* =========================================================
   ICON EXPORTS
========================================================= */

export {
  ArrowUpRight,
  Brain,
  Check,
  ChevronRight,
  Users,
  Timer,
  Target,
  Trophy,
  Zap,
  Sparkles
};


/* =========================================================
   ICON
========================================================= */

export function Icon({
  name,
  size=24
}:{
  name:string;
  size?:number;
}){

  const icons:Record<
    string,
    typeof Brain
  >={

    Brain,
    Users,
    Timer,
    Target,
    Trophy,
    Zap,
    Sparkles

  };

  const I=icons[name]||Sparkles;

  return <I size={size}/>;
}


/* =========================================================
   BRAND
========================================================= */

export function Brand(){

  const {state}=useApp();

  return (

    <Link
      className="brand"
      href="/"
    >

      {
        state.config.logo_url

          ? (

            <img
              src={state.config.logo_url}
              alt=""
              width="30"
              height="30"
            />

          )

          : <Brain size={30}/>

      }

      <span>

        {state.config.logo_name}

        <i>
          ®
        </i>

      </span>

    </Link>

  );
}


/* =========================================================
   CURRENT TIME
========================================================= */

export function useNow(){

  const [
    now,
    setNow
  ]=useState<number|null>(null);


  useEffect(()=>{

    setNow(Date.now());


    const t=setInterval(
      ()=>setNow(Date.now()),
      1000
    );


    return ()=>clearInterval(t);

  },[]);


  return now;
}


/* =========================================================
   COUNTDOWN
========================================================= */

export function Countdown(){

  const {
    state:{
      config:c
    }
  }=useApp();


  const now=useNow();


  if(!c.countdown){

    return null;

  }


  const d=
    now===null

      ? null

      : Math.max(
          0,
          Date.parse(c.starts_at)-now
        );


  if(d===0){

    return c.after_countdown==='hide'

      ? null

      : (

        <div className="live">

          <span/>

          {c.after_countdown}

        </div>

      );

  }


  const nums=

    d===null

      ? [
          '--',
          '--',
          '--',
          '--'
        ]

      : [

          Math.floor(
            d/86400000
          ),

          Math.floor(
            d/3600000
          )%24,

          Math.floor(
            d/60000
          )%60,

          Math.floor(
            d/1000
          )%60

        ].map(
          n=>String(n).padStart(2,'0')
        );


  return (

    <div className="countdown">

      {nums.map((n,i)=>

        <div key={i}>

          <strong>
            {n}
          </strong>

          <small>

            {
              [
                'DAYS',
                'HOURS',
                'MINUTES',
                'SECONDS'
              ][i]
            }

          </small>

        </div>

      )}

    </div>

  );
}


/* =========================================================
   LEVEL CLOCK
========================================================= */

export function LevelClock({
  level
}:{
  level:Level;
}){

  const now=useNow();


  const sec=remaining(
    level,
    now??(
      Date.parse(
        level.started_at||''
      )||0
    )
  );


  return (

    <span className="clock">

      {String(
        Math.floor(sec/60)
      ).padStart(2,'0')}

      :

      {String(
        sec%60
      ).padStart(2,'0')}

    </span>

  );
}


/* =========================================================
   REVEAL
========================================================= */

export function Reveal({
  children,
  className=''
}:{
  children:React.ReactNode;
  className?:string;
}){

  const ref=
    useRef<HTMLDivElement>(null);


  useEffect(()=>{

    const el=ref.current;


    if(!el){

      return;

    }


    const observer=
      new IntersectionObserver(
        entries=>
          entries.forEach(e=>{

            if(e.isIntersecting){

              e.target.classList.add(
                'revealed'
              );


              observer.unobserve(
                e.target
              );

            }

          }),
        {
          threshold:.08
        }
      );


    observer.observe(el);


    return ()=>observer.disconnect();

  },[]);


  return (

    <div
      ref={ref}
      className={
        'reveal '+className
      }
    >

      {children}

    </div>

  );
}


/* =========================================================
   MODAL
========================================================= */

export function Modal({
  title,
  onClose,
  children
}:{
  title:string;
  onClose:()=>void;
  children:React.ReactNode;
}){

  const ref=
    useRef<HTMLDialogElement>(null);


  useEffect(()=>{

    const el=ref.current;


    el?.showModal();


    return ()=>el?.close();

  },[]);


  return (

    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={e=>{

        if(e.target===ref.current){

          onClose();

        }

      }}
    >

      <div className="modal-head">

        <h2>
          {title}
        </h2>


        <button
          aria-label="Close dialog"
          className="icon-button"
          onClick={onClose}
        >

          <X/>

        </button>

      </div>


      {children}

    </dialog>

  );
}


/* =========================================================
   INPUT FIELD
========================================================= */

export function Field({
  label,
  ...props
}:React.InputHTMLAttributes<HTMLInputElement>&{
  label:string;
}){

  return (

    <label className="field">

      <span>
        {label}
      </span>


      <input
        {...props}
      />

    </label>

  );
}


/* =========================================================
   SELECT OPTION TYPE
========================================================= */

type SelectOption=
  | string
  | {
      value:string;
      label:string;
    };


/* =========================================================
   SELECT
========================================================= */

export function Select({
  label,
  options,
  ...props
}:React.SelectHTMLAttributes<HTMLSelectElement>&{
  label:string;
  options:SelectOption[];
}){

  return (

    <label className="field">

      <span>
        {label}
      </span>


      <select
        {...props}
        style={{
          colorScheme:'dark',
          ...props.style
        }}
      >

        {options.map(
          (option,index)=>{

            const item=

              typeof option==='string'

                ? {
                    value:option,
                    label:option
                  }

                : option;


            return (

              <option
                key={
                  `${item.value}-${index}`
                }
                value={item.value}
                style={{
                  backgroundColor:'#09152a',
                  color:'#eeeeee'
                }}
              >

                {item.label}

              </option>

            );

          }
        )}

      </select>

    </label>

  );
}


/* =========================================================
   TEXTAREA
========================================================= */

export function Textarea({
  label,
  ...props
}:React.TextareaHTMLAttributes<HTMLTextAreaElement>&{
  label:string;
}){

  return (

    <label className="field">

      <span>
        {label}
      </span>


      <textarea
        rows={4}
        {...props}
      />

    </label>

  );
}


/* =========================================================
   TOGGLE
========================================================= */

export function Toggle({
  label,
  value,
  onChange
}:{
  label:string;
  value:boolean;
  onChange:(v:boolean)=>void;
}){

  return (

    <label className="toggle">

      <input
        type="checkbox"
        checked={value}
        onChange={e=>
          onChange(
            e.target.checked
          )
        }
      />


      <span>
        {label}
      </span>

    </label>

  );
}


/* =========================================================
   MEMBER FIELDS
========================================================= */

export function MemberFields({
  value,
  onChange,
  leader=false
}:{
  value:Member;
  onChange:(m:Member)=>void;
  leader?:boolean;
}){


  const update=(
    key:keyof Member,
    val:string
  )=>{

    onChange({
      ...value,
      [key]:val
    });

  };


  return (

    <div className="form-grid">


      {/* =================================================
          FULL NAME
      ================================================= */}

      <Field
        label="Full name"
        type="text"
        required
        autoComplete="name"
        value={value.name}
        readOnly={leader}
        onChange={e=>
          update(
            'name',
            e.target.value
          )
        }
      />


      {/* =================================================
          EMAIL
      ================================================= */}

      <Field
        label="Email"
        type="email"
        required
        autoComplete="email"
        placeholder="example@gmail.com"
        value={value.email}
        readOnly={leader}
        onChange={e=>
          update(
            'email',
            e.target.value
          )
        }
      />


      {/* =================================================
          PHONE
      ================================================= */}

      <Field
        label="Phone number"
        type="tel"
        required
        inputMode="numeric"
        autoComplete="tel"
        maxLength={10}
        minLength={10}
        pattern="[6-9][0-9]{9}"
        placeholder="10-digit mobile number"
        value={value.phone}
        onChange={e=>{

          const phone=
            e.target.value
              .replace(/\D/g,'')
              .slice(0,10);


          update(
            'phone',
            phone
          );

        }}
      />


      {/* =================================================
          ROLL NUMBER
      ================================================= */}
         <Field
         label="Roll No"
         type="text"
         required
         minLength={1}
         maxLength={30}
         placeholder="Enter roll number / serial number"
         value={value.roll_no}
         onChange={e=>
         update(
      'roll_no',
      e.target.value
      )
      }
         />


      {/* =================================================
          DEPARTMENT / BRANCH
      ================================================= */}

      <Field
        label="Department / Branch"
        type="text"
        required
        placeholder="e.g. CSE, ECE, Mechanical"
        value={value.branch}
        onChange={e=>
          update(
            'branch',
            e.target.value
          )
        }
      />


      {/* =================================================
          DIPLOMA / DEGREE
      ================================================= */}

      <Select
        label="Diploma / Degree"
        required
        value={value.course}
        options={[

          {
            value:'',
            label:'Select Diploma / Degree'
          },

          {
            value:'diploma',
            label:'Diploma'
          },

          {
            value:'degree',
            label:'Degree'
          }

        ]}
        onChange={e=>
          update(
            'course',
            e.target.value
          )
        }
      />


      {/* =================================================
          YEAR
      ================================================= */}

      <Select
        label="Year"
        required
        value={value.year}
        options={[

          {
            value:'',
            label:'Select Year'
          },

          {
            value:'1',
            label:'1st Year'
          },

          {
            value:'2',
            label:'2nd Year'
          },

          {
            value:'3',
            label:'3rd Year'
          },

          {
            value:'4',
            label:'4th Year'
          }

        ]}
        onChange={e=>
          update(
            'year',
            e.target.value
          )
        }
      />


    </div>

  );
}


/* =========================================================
   LEADERBOARD
========================================================= */

export function Board({
  rows,
  published=false
}:{
  rows:Standing[];
  published?:boolean;
}){

  return (

    <>


      {
        published &&
        rows.length>0 &&

        <div className="podium">

          {rows.slice(0,3).map(r=>

            <div
              className={
                'card place-'+r.rank
              }
              key={r.id}
            >

              <Trophy/>


              <small>
                #{r.rank} PLACE
              </small>


              <h3>
                {r.name}
              </h3>


              <strong>

                {r.total}

                <span>
                  {' '}PTS
                </span>

              </strong>

            </div>

          )}

        </div>

      }


      <div className="table-wrap">

        <table>

          <thead>

            <tr>

              <th>
                Rank
              </th>

              <th>
                Team
              </th>

              <th>
                Level 1
              </th>

              <th>
                Level 2
              </th>

              <th>
                Level 3
              </th>

              <th>
                Total
              </th>

            </tr>

          </thead>


          <tbody>

            {rows.map(r=>

              <tr key={r.id}>

                <td>
                  #{r.rank}
                </td>


                <td>

                  <strong>
                    {r.name}
                  </strong>


                  <small>
                    {r.code}
                  </small>

                </td>


                {r.scores.map(
                  (n,i)=>

                    <td key={i}>
                      {n??'--'}
                    </td>

                )}


                <td>

                  <strong>
                    {r.total}
                  </strong>

                </td>

              </tr>

            )}

          </tbody>

        </table>


        {
          !rows.length &&

          <p className="empty">
            No scores to show yet.
          </p>

        }

      </div>

    </>

  );
}


/* =========================================================
   SHELL
========================================================= */

export function Shell({
  kind,
  tab,
  setTab,
  tabs,
  children
}:{
  kind:'student'|'admin';
  tab:string;
  setTab:(t:string)=>void;
  tabs:string[];
  children:React.ReactNode;
}){

  const {
    state,
    demo,
    logout,
    error
  }=useApp();


  const [
    open,
    setOpen
  ]=useState(false);


  return (

    <div
      className={
        'workspace '+
        kind+
        '-workspace '+
        (
          kind==='student' &&
          state.profile?.theme==='light'
            ? 'light'
            : ''
        )
      }
    >


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={
          open
            ? 'sidebar open'
            : 'sidebar'
        }
      >


        <Brand/>


        <small className="eyebrow">

          {
            kind==='admin'
              ? 'CONTROL ROOM'
              : 'PARTICIPANT SPACE'
          }

        </small>


        <nav>

          {tabs.map((x,i)=>

            <button
              key={x}
              className={
                tab===x
                  ? 'selected'
                  : ''
              }
              onClick={()=>{

                setTab(x);

                setOpen(false);

              }}
            >

              <span>
                {String(i+1).padStart(2,'0')}
              </span>


              {x}


              <ChevronRight
                size={14}
              />

            </button>

          )}

        </nav>


        {/* SIDEBAR FOOTER */}

        <div className="sidebar-foot">


          <small>

            {
              demo
                ? 'Demo account'
                : state.profile?.email
            }

          </small>


          <button
            className="text-button"
            onClick={async()=>{

              await logout();

              location.href='/';

            }}
          >

            <LogOut
              size={16}
            />

            Sign out

          </button>


        </div>


      </aside>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="workspace-main">


        <header className="workspace-header">


          <button
            aria-label="Toggle navigation"
            className="icon-button mobile"
            onClick={()=>
              setOpen(!open)
            }
          >

            <Menu/>

          </button>


          <span>

            {
              kind==='admin'
                ? 'Event management'
                : 'Your event journey'
            }


            {' / '}


            <strong>
              {tab}
            </strong>

          </span>


          <span className="badge">

            {state.config.edition}

            {' '}

            EDITION

          </span>


        </header>


        {/* ERROR */}

        {
          error &&

          <p className="alert">
            {error}
          </p>

        }


        {/* PAGE TITLE */}

        <div className="page-title">


          <small className="eyebrow">

            {
              kind==='admin'
                ? 'BEHIND THE CHALLENGE'
                : 'THINK. PLAY. CONQUER.'
            }

          </small>


          <h1>
            {tab}
          </h1>


        </div>


        {children}


      </main>


    </div>

  );
}


/* =========================================================
   ASYNC BUTTON
========================================================= */

export function AsyncButton({
  children,
  run,
  className='button'
}:{
  children:React.ReactNode;
  run:()=>Promise<void>;
  className?:string;
}){

  const {notify}=useApp();


  const [
    busy,
    setBusy
  ]=useState(false);


  return (

    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async()=>{

        setBusy(true);


        try{

          await run();

        }catch(e){

          notify(
            e instanceof Error
              ? e.message
              : 'Something went wrong.'
          );

        }finally{

          setBusy(false);

        }

      }}
    >

      {
        busy
          ? 'Saving...'
          : children
      }

    </button>

  );
}