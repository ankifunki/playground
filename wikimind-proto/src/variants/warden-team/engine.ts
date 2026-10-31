/* The Warden team simulation: threads, proactive notes, rollouts, brain edits with apply/undo, and the work log.
   It is a mutable model on purpose (proposals carry their own apply and undo closures). React subscribes to it
   through useSyncExternalStore; every mutation ends in emit(), which bumps the version and re-renders. */
import { DIM, DIMS, G, LVL, makeAgents, makeBrains, makeWork, POOL, RANK } from './data'

const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const now = () => Date.now()

export function createWarden() {
  let version = 0, scrollSeq = 0, uid = 0
  const listeners = new Set<() => void>()
  const timers = new Set<number>(), intervals = new Set<number>()
  const later = (f: () => void, ms: number) => { const t = window.setTimeout(() => { timers.delete(t); f() }, ms); timers.add(t); return t }

  const A = makeAgents(), BR = makeBrains(), WORK = makeWork(now())
  A.forEach((a: any) => { a.hist = BR[a.id].hist })
  const S: any = { view: 'team', team: [], facts: ['Okta is the identity provider, owned by IT', 'Brex handles corporate cards, owned by Finance', 'Slack is the main chat tool', 'Production changes are logged in #change-log'], rules: [], rollouts: [], flow: null, typing: null, thinking: null, pi: 0, toast: null, walk: null, gsel: null, draft: null, profMsg: null, focus: null, q: '', traceBack: null }

  function emit(scroll?: boolean) { version++; if (scroll) scrollSeq++; listeners.forEach((l) => l()) }
  const ag = (id: string): any => A.find((a: any) => a.id === id)
  const thread = (k: string): any[] => (k === 'team' ? S.team : k.indexOf(':b') > 0 ? ag(k.split(':')[0]).bmsgs : ag(k).msgs)
  const named = (t: string) => A.find((a: any) => a.re.test(t) || (a.reCS && a.reCS.test(t))) || null
  const agentPend = (a: any) => a.msgs.filter((m: any) => !m.res && ((m.k === 'note' && m.kind !== 'fyi') || m.k === 'grule'))
  const fleetPend = () => S.team.filter((m: any) => !m.res && (m.k === 'plan' || m.k === 'revoke' || m.k === 'grule'))
  const stOf = (a: any) => (a.paused ? 'stopped' : a.flag || agentPend(a).length ? 'watch' : 'ok')
  function lineOf(a: any) {
    if (a.paused) return 'Paused. Nothing runs until you resume.'
    if (a.flag) return a.flag
    const n = agentPend(a).length
    if (n) return 'Waiting on you for ' + n + ' thing' + (n > 1 ? 's' : '') + '.'
    const last = a.msgs.filter((m: any) => m.k === 'note').slice(-1)[0]
    if (last && now() - last.ts < 5 * 60000) return 'Noticed: ' + last.title
    return a.line
  }
  const isLog = () => /:log$/.test(S.view), isTrace = () => S.view.indexOf('trace:') === 0, isBrain = () => S.view.indexOf(':b') > 0
  const logWho = () => S.view.split(':')[0], bAgent = () => ag(S.view.split(':')[0])
  const unitById = (id: string) => WORK.find((u: any) => u.id === id)
  const unitOf = () => unitById(S.view.slice(6))
  function backOf() {
    if (isLog()) { const w = logWho(); return w === 'all' ? 'team' : w }
    const tb = S.traceBack; if (tb && tb.indexOf('trace:') !== 0) return tb
    const u = unitOf(); return u ? u.agent + ':log' : 'team'
  }

  /* ---------- messages arrive one at a time, with a typing beat ---------- */
  const pipe: { k: string; m: any }[] = []; let busy = false
  function post(k: string, m: any) { pipe.push({ k, m }); if (!busy) drain() }
  function drain() {
    busy = true; const it = pipe[0]; S.typing = it.k; emit(S.view === it.k)
    const len = (it.m.text || it.m.title || '').length
    later(() => { pipe.shift(); S.typing = null; it.m.ts = now(); thread(it.k).push(it.m); emit(S.view === it.k); if (pipe.length) drain(); else busy = false }, 280 + Math.min(len * 6, 600))
  }
  const fleetSay = (t: string) => post('team', { k: 'a', text: t })
  const say = (a: any, t: string) => post(a.id, { k: 'a', text: t })
  const user = (k: string, t: string) => { thread(k).push({ k: 'u', text: t, ts: now() }); emit(true) }
  const rcpt = (k: string, t: string, w?: string) => post(k, { k: 'rcpt', text: t, w })
  function toast(m: string, goTo?: string) { S.toast = { m, go: goTo || null, id: now() + Math.random() }; emit() }

  /* ---------- navigation ---------- */
  let walkT = 0
  function stopWalk() { if (walkT) { clearInterval(walkT); intervals.delete(walkT); walkT = 0 } if (S.walk) S.walk.playing = false }
  function hashOf(id: string) { return id.replace(':b', '-brain').replace(':log', '-log').replace('trace:', 'trace-') }
  function go(id: string) {
    stopWalk(); S.walk = null; S.gsel = null; S.draft = null; S.profMsg = null
    if (id.indexOf('trace:') === 0 && !isTrace()) S.traceBack = S.view
    S.view = id; S.focus = null
    if (location.hash.slice(1) !== hashOf(id)) location.hash = hashOf(id)
    emit(); window.scrollTo(0, 0)
  }
  function viewFromHash(h: string) {
    if (h === 'team' || ag(h)) return h
    let m = h.match(/^([a-z]+)-brain$/); if (m && ag(m[1])) return m[1] + ':b'
    m = h.match(/^([a-z]+)-log$/); if (m && (m[1] === 'all' || ag(m[1]))) return m[1] + ':log'
    m = h.match(/^trace-(w\d+)$/); if (m && unitById(m[1])) return 'trace:' + m[1]
    return null
  }

  /* ---------- proactive notes, within each agent's attention budget ---------- */
  function proactive(manual: boolean) {
    if (S.pi >= POOL.length) { if (manual) toast('Nothing new right now. The team is quiet.'); return }
    const item = POOL[S.pi++], a = ag(item.agent)
    if (a.paused) { if (manual) toast(a.name + ' is paused, so it’s not watching for changes.'); return }
    if (a.spoke >= a.budget) { a.saved++; emit(); if (manual) toast(a.name + ' saved something for your digest.'); return }
    S.thinking = a.id; emit()
    later(() => { S.thinking = null; a.spoke++; post(a.id, { k: 'note', ...item }); if (S.view !== a.id) toast(a.name + ' noticed something. Tap to see.', a.id) }, 1500)
  }
  function noteGo(a: any, m: any, yes: boolean) {
    if (m.res) return
    if (m.kind === 'fyi') { m.res = 'Noted'; emit(); return }
    if (m.kind === 'ask') {
      if (yes) { m.res = 'Approved'; m.w = unitForNote(a, m, 'You said yes.'); rcpt(a.id, 'Done: ' + m.done, m.w); if (m.lesson) a.lessons.push(m.lesson); if (m.fact) S.facts.push(m.fact); if (m.clear) a.flag = null }
      else { m.res = 'Declined'; say(a, 'Okay. I won’t suggest this again unless something changes.') }
    } else {
      if (yes) { m.res = 'Going ahead'; m.w = unitForNote(a, m, 'You said go ahead.'); rcpt(a.id, m.done, m.w); if (m.lesson) a.lessons.push(m.lesson) }
      else { m.res = 'Stopped'; say(a, 'Okay, I won’t do it. I’ll ask before trying anything like it again.') }
    }
    emit()
  }

  /* ---------- fleet: onboarding and removing tools, team rules ---------- */
  function startOnboard(tool: string) { S.flow = { tool }; fleetSay(tool + ', got it. One question: who will use it, and should the team only read it, or also act in it?') }
  function onboardAnswer(l: string) {
    const tool = S.flow.tool; S.flow = null
    const mode = /\bact\b|write|change|edit/.test(l) ? 'act' : 'read'
    const aud = /\beveryone\b|\ball\b|company/.test(l) ? 'all' : /financ|spend|account/.test(l) ? 'fin' : /people|\bhr\b|hiring/.test(l) ? 'ppl' : 'eng'
    const map: any = { eng: ['iris', 'sol'], all: ['iris', 'sol', 'pia'], fin: ['fen', 'sol'], ppl: ['pia', 'iris'] }
    post('team', { k: 'plan', tool, mode, aud, agents: map[aud] })
  }
  function planGo(m: any, yes: boolean) {
    if (m.res) return
    if (!yes) { m.res = 'Not rolled out'; S.flow = { tool: m.tool }; fleetSay('Okay. Tell me who should use ' + m.tool + ', and whether the team reads or acts, and I’ll redo the plan.'); emit(); return }
    m.res = 'Rolling out'
    const R = { tool: m.tool, mode: m.mode, agents: m.agents, stage: 0 }
    S.rollouts.push(R)
    const first = ag(R.agents[0]); first.tools.push(R.tool)
    S.facts.push(R.tool + ': ' + ({ eng: 'engineering', all: 'company-wide', fin: 'finance', ppl: 'people team' } as any)[m.aud] + ' tool, added by you')
    post('team', { k: 'rollout', ref: R })
    fleetSay('Added ' + R.tool + ' to shared knowledge, so everyone knows what it is and who owns it.')
    later(() => post(first.id, { k: 'note', kind: 'fyi', src: 'new tool: ' + R.tool, title: 'Watching how ' + R.tool + ' gets used', why: 'I’m connected read-only. I’ll learn the patterns for a week before suggesting anything.' }), 1800)
    if (R.agents.indexOf('sol') > 0) later(() => {
      post('sol', { k: 'note', kind: 'ask', src: 'new tool: ' + R.tool, title: 'Audit-log access for ' + R.tool + '?', why: 'So I can review what happens in it before it goes live for me. Read-only.', done: 'I can read the ' + R.tool + ' audit log.' })
      if (S.view !== 'sol') toast('Sol needs something for ' + R.tool + '. Tap to see.', 'sol')
    }, 3600)
    emit()
  }
  function skipDay() {
    const R = S.rollouts.find((r: any) => r.stage === 0)
    if (!R) { toast('No rollout is waiting on a clean day.'); return }
    R.stage = 1; R.agents.slice(1).forEach((id: string) => ag(id).tools.push(R.tool))
    fleetSay('Clean day. ' + R.tool + ' is now connected for ' + R.agents.slice(1).map((id: string) => ag(id).name).join(' and ') + ' too. Nothing in it can act on its own yet.')
    emit()
  }
  function startRevoke(name: string) {
    const key = name.toLowerCase(), hold: string[] = []; let real: string | null = null
    A.forEach((a: any) => a.tools.forEach((t: string) => { if (t.toLowerCase() === key) { real = t; if (!hold.includes(a.id)) hold.push(a.id) } }))
    if (!hold.length) { fleetSay('Nobody on the team has access to ' + name + '. Nothing to revoke.'); return }
    post('team', { k: 'revoke', tool: real, holders: hold })
  }
  function revokeGo(m: any, yes: boolean) {
    if (m.res) return
    if (!yes) { m.res = 'Kept'; emit(); return }
    m.res = 'Revoked'
    A.forEach((a: any) => { a.tools = a.tools.filter((t: string) => t !== m.tool) })
    S.facts = S.facts.filter((f: string) => f.indexOf(m.tool) < 0)
    rcpt('team', 'Revoked ' + m.tool + ' for ' + m.holders.map((i: string) => ag(i).name).join(' and ') + '. Audit history kept.')
    emit()
  }
  function ruleFrom(l: string) {
    let m: RegExpMatchArray | null
    if ((m = l.match(/(?:never|no|don[’']?t).*?(?:on|during)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?/))) return { rule: 'No changes on ' + cap1(m[1]) + 's', code: 'change_window: exclude ' + m[1].slice(0, 3) }
    if ((m = l.match(/(?:never|don[’']?t)\s+touch\s+(.+?)[.!?]*$/))) return { rule: 'Never touch ' + m[1], code: 'boundaries.protected += "' + m[1] + '"' }
    return null
  }
  function gruleGo(k: string, m: any, yes: boolean) {
    if (m.res) return
    if (!yes) { m.res = 'Not applied'; emit(); return }
    m.res = 'Applied'; S.rules.push(m)
    rcpt(k, 'Rule added for ' + (m.scope.length === A.length ? 'the whole team' : ag(m.scope[0]).name) + ': ' + m.rule + '.')
    emit()
  }
  function resolve(k: string, m: any, yes: boolean) {
    if (!m) return
    if (m.k === 'note') noteGo(ag(k), m, yes)
    else if (m.k === 'plan') planGo(m, yes)
    else if (m.k === 'revoke') revokeGo(m, yes)
    else if (m.k === 'grule') gruleGo(k, m, yes)
  }
  function pause(a: any, on: boolean) { a.paused = on; if (on) say(a, 'Paused. Nothing runs until you resume me.'); else say(a, 'Back at it.'); emit() }

  function handleTeam(t: string) {
    user('team', t)
    const l = t.toLowerCase(), who = named(t), allw = /everything|\ball\b|team|everyone|everybody/.test(l)
    let m: RegExpMatchArray | null
    if (S.flow) { if (/^(cancel|never ?mind)/.test(l)) { S.flow = null; fleetSay('Okay, dropped.'); return } onboardAnswer(l); return }
    if (/^(yes|yep|yeah|ok|okay|sure|do it|go ahead|approve|roll it out)\b/.test(l) || /^(no|nope|not yet|skip|cancel|hold off|change)\b/.test(l)) {
      const yes = /^(yes|yep|yeah|ok|okay|sure|do it|go ahead|approve|roll it out)\b/.test(l), p = fleetPend()
      if (!p.length) { fleetSay('Nothing here is waiting on you. Check the people with a badge.'); return }
      if (p.length > 1) { fleetSay('Two things are waiting. Tap the one you mean, so nothing is approved by mistake.'); return }
      resolve('team', p[0], yes); return
    }
    if (/\b(trace|audit|log|logs|who did|what happened)\b/.test(l)) {
      const qq = t.replace(/.*?\b(trace|audit|logs?|who did|what happened)\b(\s+(to|with|on|for|of))?\s*/i, '').replace(/^the\s+/i, '').replace(/[?.!]+$/, '').trim()
      if (who && (!qq || who.re.test(qq) || (who.reCS && who.reCS.test(qq)))) { S.q = ''; go(who.id + ':log') } else { S.q = qq; go('all:log') }
      return
    }
    if (who && /\b(open|talk to|go to|show|see)\b/.test(l)) { go(who.id); return }
    if (/\b(stop|pause|freeze|halt)\b/.test(l)) {
      if (who && !allw) { pause(who, true); fleetSay(who.name + ' is paused.'); return }
      A.forEach((a: any) => { a.paused = true }); fleetSay('Everyone is paused. Nothing runs until you resume.'); emit(); return
    }
    if (/\b(resume|unpause|start again)\b/.test(l)) {
      if (who && !allw) { pause(who, false); fleetSay(who.name + ' is back.'); return }
      if (!A.some((a: any) => a.paused)) { fleetSay('Everyone is already working.'); return }
      fleetSay('Resuming the whole team needs a second person. I’ve asked Dev.')
      later(() => { A.forEach((a: any) => { a.paused = false }); fleetSay('Dev confirmed. Everyone is back.'); emit() }, 2400); return
    }
    if (((m = t.match(/\b(?:onboard|connect|set up|bring in)\s+(?:the\s+|new\s+)?(?:tool\s+|vendor\s+)?([A-Za-z][A-Za-z0-9.\-]*)/i)) || (m = t.match(/\badd\s+(?:the\s+)?(?:new\s+)?(?:tool|vendor)\s+([A-Za-z][A-Za-z0-9.\-]*)/i))) && !/^(a|an|the|that|this|it|rule|everything|new|my)$/i.test(m[1])) { startOnboard(cap1(m[1])); return }
    if ((m = t.match(/\b(?:offboard|drop|revoke|retire|remove)\s+(?:the\s+)?(?:vendor\s+|tool\s+|access\s+to\s+)?([A-Za-z][A-Za-z0-9.\-]*)/i)) && !/^(a|an|the|that|this|it|everything|my)$/i.test(m[1])) { startRevoke(m[1]); return }
    const r: any = ruleFrom(l)
    if (r) { r.k = 'grule'; r.scope = A.map((a: any) => a.id); post('team', r); return }
    if (/\b(never|don[’']?t)\b/.test(l)) { fleetSay('I couldn’t turn that into a precise rule. Say it with a day, a system, or a person, like “never touch the finance team.”'); return }
    if (/knowledge|facts|what do (you|we) know|shared/.test(l)) { post('team', { k: 'facts' }); return }
    if (/need|status|how(’s|'s| is| are)|doing|going|today/.test(l)) {
      const c = A.reduce((s: number, a: any) => s + agentPend(a).length, 0) + fleetPend().length
      fleetSay(c ? c + ' thing' + (c > 1 ? 's' : '') + ' need you. Look for the badges above.' : 'Nothing needs you right now.'); return
    }
    if (who) { go(who.id); return }
    fleetSay('I can onboard or remove a tool for the team, pause or resume anyone, add a rule for everyone, or open a teammate. Tap a face to talk to one directly.')
  }
  function handleAgent(a: any, t: string) {
    user(a.id, t)
    const l = t.toLowerCase(), r: any = ruleFrom(l)
    if (/\b(log|trace|audit|what happened)\b/.test(l)) { S.q = ''; go(a.id + ':log'); return }
    if (r) { r.k = 'grule'; r.scope = [a.id]; post(a.id, r); return }
    if (/^(yes|yep|yeah|ok|okay|sure|do it|go ahead|approve)\b/.test(l) || /^(no|nope|not yet|skip|don[’']?t|hold off|stop it)\b/.test(l)) {
      const yes = /^(yes|yep|yeah|ok|okay|sure|do it|go ahead|approve)\b/.test(l), p = agentPend(a)
      if (!p.length) { say(a, 'Nothing is waiting on you.'); return }
      if (p.length > 1) { say(a, 'Two things are waiting. Tap the one you mean, so nothing is approved by mistake.'); return }
      resolve(a.id, p[0], yes); return
    }
    if (/\b(stop|pause|freeze)\b/.test(l)) { if (/everything|everyone|\ball\b|team/.test(l)) { go('team'); handleTeam('pause everyone'); return } pause(a, true); return }
    if (/\b(resume|unpause|start again)\b/.test(l)) { pause(a, false); return }
    if (/learn/.test(l)) { post(a.id, { k: 'lessons' }); return }
    if (/less|fewer|quiet|calm/.test(l)) { a.budget = Math.max(1, a.budget - 1); say(a, 'Okay. I’ll speak up at most ' + a.budget + ' time' + (a.budget > 1 ? 's' : '') + ' a day and save the rest for a daily digest.'); emit(); return }
    if (/\bmore\b|proactive/.test(l)) { a.budget = Math.min(6, a.budget + 1); say(a, 'Okay, up to ' + a.budget + ' times a day.'); emit(); return }
    if (/^why|why\?|tell me more|explain/.test(l)) {
      const n = a.msgs.filter((m: any) => m.k === 'note').slice(-1)[0]
      if (n) { say(a, 'I picked this up from ' + n.src + '. ' + n.why); return }
      say(a, 'Ask me about something I did or suggested.'); return
    }
    if (/what did|today|doing|status|how/.test(l)) { say(a, a.line + ' Recently: ' + a.recent.join('; ').toLowerCase() + '.'); return }
    if (/\b(never|don[’']?t)\b/.test(l)) { say(a, 'I couldn’t turn that into a precise rule. Give me a day, a system, or a person.'); return }
    say(a, 'I can tell you what I’ve done or learned, take a rule for myself, speak up more or less, or pause. Anything that changes the whole team goes through the team chat.')
  }
  function sim(k: string) {
    if (k === 'notice') proactive(true)
    if (k === 'day') skipDay()
    if (k === 'alert') {
      const f = ag('fen'); if (f.flag) { toast('Already raised.'); return }
      f.flag = 'Held 3 invoices: bank details changed.'
      post('fen', { k: 'note', kind: 'ask', src: 'invoice checks', title: 'Confirm bank changes for 3 vendors', why: 'Each vendor changed bank details in the last 48 hours, so I held their invoices. Release only if you or the vendor confirmed by phone.', done: 'Released 3 invoices after your check.', clear: true })
      if (S.view !== 'fen') toast('Fen held 3 invoices. Tap to see.', 'fen')
      emit()
    }
  }

  /* ---------- the work log ---------- */
  function mkUnit(agent: string, title: string, status: string, why: string, steps: any[], rev: boolean, ts?: number) { const id = 'w' + (1100 + ++uid); WORK.push({ id, agent, title, status, why, steps, rev, ts: ts || now() }); return id }
  function unitForNote(a: any, m: any, said: string) {
    const t = now(), start = m.ts || t, gap = Math.max(5, Math.round((t - start) / 1000))
    if (m.unit) { const u = unitById(m.unit); if (u) { const o = Math.round((t - u.ts) / 1000); u.steps.push({ k: 'Approved', d: said, who: 'You', s: o }, { k: 'Did', d: m.done, who: a.name, s: o + 3 }); u.status = 'Done'; return u.id } }
    return mkUnit(a.id, m.title.replace(/\?$/, ''), 'Done', 'Raised by ' + a.name + ' on its own, learned from ' + m.src + '. Approved by you.', [{ k: 'Noticed', d: 'Learned from ' + m.src + '. ' + m.why, who: a.name, s: 0 }, { k: 'Proposed', d: m.title, who: a.name, s: 2 }, { k: 'Approved', d: said, who: 'You', s: gap }, { k: 'Did', d: m.done, who: a.name, s: gap + 3 }], true, start)
  }
  function brainUnit(a: any, m: any, dev: boolean) {
    return mkUnit(a.id, 'Changed how ' + a.name + ' works: ' + m.label.charAt(0).toLowerCase() + m.label.slice(1), 'Done', 'A change to ' + a.name + '’s brain, made by you' + (dev ? ' and approved by Dev' : '') + '.', [{ k: 'Requested', d: m.label, who: 'You', s: 0 }, { k: 'Changed', d: m.before + ' → ' + m.after, who: 'Policy engine', s: 1 }].concat(dev ? [{ k: 'Approved', d: 'Second approval, because it widens what ' + a.name + ' can do.', who: 'Dev', s: 2 }] : []), false)
  }
  function matchQ(u: any) {
    if (!S.q) return true
    const q = S.q.toLowerCase().replace(/^the\s+/, '')
    if (q === 'blocked') return u.status === 'Blocked'
    if (q === 'approved by you') return u.steps.some((s: any) => s.who === 'You')
    return (u.title + ' ' + u.why + ' ' + u.steps.map((s: any) => s.d + ' ' + s.who).join(' ')).toLowerCase().indexOf(q) >= 0
  }
  function searchLog(v: string) {
    const l = v.toLowerCase().trim()
    if (/^(everything|clear|all|show all)/.test(l)) S.q = ''; else if (/blocked/.test(l)) S.q = 'blocked'; else if (/approved/.test(l)) S.q = 'approved by you'; else S.q = v.replace(/^(find|show|search( for)?)\s+/i, '').trim()
    go((isLog() ? logWho() : 'all') + ':log')
  }
  function undoUnit(id: string) {
    const u = unitById(id)
    if (u && u.status === 'Done') { u.status = 'Undone'; u.steps.push({ k: 'Undone', d: 'You reversed it from this trace. Every change was rolled back.', who: 'You', s: Math.round((now() - u.ts) / 1000) }); toast('Undone. The trace keeps both.'); emit() }
  }

  /* ---------- the brain map walkthrough ---------- */
  function playWalk(a: any) {
    stopWalk(); S.gsel = null; S.walk = { id: a.id, i: 0, playing: true }; emit()
    walkT = window.setInterval(() => {
      const g = G[a.id]
      if (!S.walk || S.walk.id !== a.id) { stopWalk(); return }
      if (S.walk.i >= g.walk.steps.length - 1) { stopWalk(); emit(); return }
      S.walk.i++; emit()
    }, 2300)
    intervals.add(walkT)
  }
  const pickNode = (id: string) => { stopWalk(); S.walk = null; S.gsel = S.gsel === id ? null : id; emit() }
  const clearMap = () => { stopWalk(); S.walk = null; S.gsel = null; emit() }
  const closeWalk = () => { stopWalk(); S.walk = null; emit() }
  const pickStage = (i: number) => { stopWalk(); if (S.walk) { S.walk.i = i; emit() } }

  /* ---------- operating profile dials ---------- */
  const isWide = (P: any, D: any) => D.auto > P.auto || D.reach > P.reach || D.prec < P.prec
  function setDial(k: string, v: number) { const a = bAgent(); if (!S.draft || S.draft.id !== a.id) S.draft = { id: a.id, v: { ...a.prof } }; S.draft.v[k] = v; S.profMsg = null; emit() }
  const resetDials = () => { S.draft = null; S.profMsg = null; emit() }
  function applyProf(a: any) {
    if (!S.draft || S.draft.id !== a.id) return
    const P = a.prof, D = S.draft.v, old = { ...P }, wide = isWide(P, D)
    const ch = DIMS.filter((d: any) => D[d.k] !== P[d.k]).map((d: any) => d.name + ': ' + d.words[P[d.k] - 1].toLowerCase() + ' → ' + d.words[D[d.k] - 1].toLowerCase())
    const nv = { ...D }; S.draft = null
    const doIt = () => {
      a.prof = nv; a.budget = [0, 1, 3, 5, 8][nv.pro - 1]
      a.hist.push({ t: 'Tuned the operating profile (' + ch.length + ' dial' + (ch.length === 1 ? '' : 's') + ')', ts: 'Today', undo: () => { a.prof = old; a.budget = [0, 1, 3, 5, 8][old.pro - 1] } })
      mkUnit(a.id, 'Tuned ' + a.name + '’s operating profile', 'Done', 'Operating profile changed by you' + (wide ? ' and approved by Dev' : '') + '.', [{ k: 'Requested', d: ch.join('; '), who: 'You', s: 0 }, { k: 'Changed', d: 'Profile updated. Takes effect on the next task.', who: 'Policy engine', s: 1 }].concat(wide ? [{ k: 'Approved', d: 'Second approval, because it widens what ' + a.name + ' can do.', who: 'Dev', s: 2 }] : []), false)
    }
    if (wide) { S.profMsg = { id: a.id, t: 'Sent to Dev, because it widens what ' + a.name + ' can do.' }; emit(); later(() => { doIt(); S.profMsg = { id: a.id, t: 'Dev approved. The new profile is live.' }; emit() }, 2200) }
    else { doIt(); S.profMsg = { id: a.id, t: 'Applied. You can undo it from Changes.' }; emit() }
  }
  function dialNL(a: any, l: string) {
    const map: [RegExp, string, number][] = [[/more careful|double.?check|be careful|more precise/, 'prec', 1], [/faster|less careful|move fast/, 'prec', -1], [/more (on its own|autonomous|independent)|act alone|ask me less/, 'auto', 1], [/ask me more|less autonomous|check with me more/, 'auto', -1], [/speak up less|quieter|less proactive/, 'pro', -1], [/speak up more|more proactive/, 'pro', 1], [/learn faster|adapt more|learn more/, 'learn', 1], [/stick to (the )?playbooks|learn less|stop adapting/, 'learn', -1], [/narrower|less access|smaller scope/, 'reach', -1], [/broader|wider scope/, 'reach', 1]]
    for (const [re, k, d] of map) if (re.test(l)) {
      const dd = DIM(k)
      if (!S.draft || S.draft.id !== a.id) S.draft = { id: a.id, v: { ...a.prof } }
      const v = Math.max(1, Math.min(5, S.draft.v[k] + d)); S.draft.v[k] = v; S.profMsg = null
      sayB(a, 'Moved ' + dd.name.toLowerCase() + ' to “' + dd.words[v - 1].toLowerCase() + '.” The profile at the top shows what would have changed last week. Tap Apply when it looks right.')
      emit(); later(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 400); return true
    }
    return false
  }

  /* ---------- editing the brain: every change is a proposal with apply and undo ---------- */
  const sayB = (a: any, t: string) => post(a.id + ':b', { k: 'a', text: t })
  const propose = (a: any, o: any) => { S.focus = null; o.k = 'chg'; post(a.id + ':b', o) }
  const lastChg = (a: any) => { for (let i = a.bmsgs.length - 1; i >= 0; i--) { const m = a.bmsgs[i]; if (m.k === 'chg' && !m.res) return m } return null }
  const findSop = (B: any, q: string) => { q = q.toLowerCase(); return B.sops.find((s: any) => new RegExp(s.kw, 'i').test(q) || s.name.toLowerCase().indexOf(q) >= 0) }
  const findAcc = (B: any, q: string) => B.access.find((x: any) => x.sys.toLowerCase() === q.toLowerCase())
  const cleanTo = (t: string) => cap1(t.replace(/^(please\s+)?(change (it|this|that)?\s*to|make (it|this)( say)?|it should (be|say)|should (be|say)|replace (it )?with|instead,?)\s*/i, '').replace(/[.!?]+$/, '').trim())
  function removeAcc(a: any, ac: any) { const B = BR[a.id]; return { label: 'Remove ' + ac.sys + ' access for ' + a.name, before: ac.sys + ': ' + LVL[ac.lvl], after: 'No access', note: 'Only ' + a.name + ' loses it. To remove ' + ac.sys + ' from everyone, ask in team chat.', apply: () => B.access.splice(B.access.indexOf(ac), 1), undo: () => B.access.push(ac) } }
  function accessLevel(a: any, sys: string, w: string) {
    const B = BR[a.id], ac = findAcc(B, sys)
    if (!ac) { sayB(a, a.name + ' has no access to ' + sys + '. To connect it, onboard it from team chat.'); return }
    const lv = /read/.test(w) ? 'read' : /propos|ask|approv/.test(w) ? 'propose' : 'act'
    if (ac.lvl === lv) { sayB(a, 'No change needed. In ' + ac.sys + ', ' + a.name + ' already ' + LVL[lv].toLowerCase() + '.'); return }
    const old = ac.lvl, up = RANK[lv] > RANK[old]
    propose(a, { label: ac.sys + ': ' + LVL[old].toLowerCase() + ' → ' + LVL[lv].toLowerCase(), before: ac.sys + ': ' + LVL[old], after: ac.sys + ': ' + LVL[lv], note: up && lv === 'act' ? 'Acting on its own needs a second approver. Apply sends it to Dev.' : up ? 'More access takes effect on the next request.' : 'Less access takes effect right away.', second: up && lv === 'act', apply: () => { ac.lvl = lv }, undo: () => { ac.lvl = old } })
  }
  function chgGo(a: any, m: any, yes: boolean) {
    if (!m || m.res) return
    if (!yes) { m.res = 'Cancelled'; emit(); return }
    const k = a.id + ':b'
    if (m.second) { m.res = 'Sent to Dev for approval'; emit(); later(() => { m.apply(); a.hist.push({ t: m.label, ts: 'Today', undo: m.undo }); rcpt(k, 'Dev approved: ' + m.label + '.', brainUnit(a, m, true)); emit() }, 2200); return }
    m.apply(); a.hist.push({ t: m.label, ts: 'Today', undo: m.undo }); m.res = 'Applied'; rcpt(k, 'Updated. You can undo it from Changes.', brainUnit(a, m, false)); emit()
  }
  function revert(a: any, i: number) {
    let n = 0
    for (let j = a.hist.length - 1; j >= i; j--) if (a.hist[j].undo) { a.hist[j].undo(); n++; a.hist.splice(j, 1) }
    rcpt(a.id + ':b', 'Went back. Undid ' + n + ' change' + (n === 1 ? '' : 's') + '.'); emit()
  }
  function focusText(a: any, f: any) {
    const B = BR[a.id]
    if (f.sec === 'job') return 'job description'
    if (f.sec === 'people') return B.people[f.i]
    if (f.sec === 'sops') { const s = B.sops[f.i]; if (!s) return ''; return f.j == null ? 'when ' + s.name.toLowerCase() + ' runs' : s.steps[f.j] ? s.steps[f.j].t : s.name }
    if (f.sec === 'access') return B.access[f.i] ? B.access[f.i].sys + ' access' : ''
    if (f.sec === 'bounds') return B.bounds[f.i] ? B.bounds[f.i].t : ''
    if (f.sec === 'lessons') return a.lessons[f.i] || ''
    if (f.sec === 'know') return B.know[f.i] || ''
    return ''
  }
  function focusedEdit(a: any, f: any, t: string, l: string) {
    const B = BR[a.id], txt = cleanTo(t), rm = /^(remove|delete|drop)\b/.test(l)
    let o: any = null
    if (f.sec === 'job') {
      if (rm) { sayB(a, 'Every agent needs a job. Tell me what to change instead.'); return }
      const oj = B.job; o = { label: 'Rewrite ' + a.name + '’s job', before: oj, after: txt, apply: () => { B.job = txt }, undo: () => { B.job = oj } }
    } else if (f.sec === 'people' || f.sec === 'know' || f.sec === 'lessons') {
      const arr = f.sec === 'people' ? B.people : f.sec === 'know' ? B.know : a.lessons, old = arr[f.i], lab = ({ people: 'working relationships', know: 'what ' + a.name + ' knows', lessons: 'a learned habit' } as any)[f.sec]
      if (rm) o = { label: f.sec === 'lessons' ? 'Forget a learned habit' : 'Remove a line from ' + lab, before: old, after: f.sec === 'lessons' ? '(forgotten, won’t be relearned)' : '(removed)', apply: () => arr.splice(arr.indexOf(old), 1), undo: () => arr.push(old) }
      else o = { label: 'Change ' + lab, before: old, after: txt, apply: () => { arr[arr.indexOf(old)] = txt }, undo: () => { arr[arr.indexOf(txt)] = old } }
    } else if (f.sec === 'sops') {
      const s = B.sops[f.i]
      if (f.j == null) {
        if (rm) { const si = B.sops.indexOf(s); o = { label: 'Remove the ' + s.name.toLowerCase() + ' playbook', before: s.name, after: '(removed)', note: a.name + ' will ask you whenever this comes up instead.', apply: () => B.sops.splice(B.sops.indexOf(s), 1), undo: () => B.sops.splice(si, 0, s) } }
        else { const ot = s.trigger; o = { label: 'Change when ' + s.name.toLowerCase() + ' runs', before: ot, after: txt, apply: () => { s.trigger = txt }, undo: () => { s.trigger = ot } } }
      } else {
        const st = s.steps[f.j], idx = f.j
        if (rm) o = { label: 'Remove a step from ' + s.name.toLowerCase(), before: st.t + (st.h ? ' (asks you)' : ''), after: '(removed)', apply: () => s.steps.splice(s.steps.indexOf(st), 1), undo: () => s.steps.splice(idx, 0, st) }
        else {
          const keep = /^(make it\s+)?(ask me|without asking|on its own|do it on its own|don[’']?t ask)/.test(l)
          const nh = /ask me|approv|check with me/.test(l) ? true : /without asking|on its own|don[’']?t ask/.test(l) ? false : !!st.h
          const nt = { t: keep ? st.t : txt, h: nh }
          o = { label: 'Change a step in ' + s.name.toLowerCase(), before: st.t + (st.h ? ' (asks you)' : ''), after: nt.t + (nt.h ? ' (asks you)' : ''), apply: () => { s.steps[s.steps.indexOf(st)] = nt }, undo: () => { s.steps[s.steps.indexOf(nt)] = st } }
          if (nt.h === false && st.h) { o.note = 'Dropping a check widens what ' + a.name + ' does alone, so it needs a second approver.'; o.second = true }
        }
      }
    } else if (f.sec === 'access') {
      const ac = B.access[f.i]
      if (rm) o = removeAcc(a, ac)
      else {
        const lv = /read/.test(l) ? 'read' : /propos|ask|approv/.test(l) ? 'propose' : /\bact|own|itself/.test(l) ? 'act' : null
        if (!lv) { sayB(a, 'Should ' + a.name + ' read, propose, or act on its own in ' + ac.sys + '?'); return }
        S.focus = null; accessLevel(a, ac.sys, lv); return
      }
    } else if (f.sec === 'bounds') {
      const bd = B.bounds[f.i]
      if (bd.src === 'team') { S.focus = null; sayB(a, 'That’s a team rule, so changing it changes all 4 agents. Say it in team chat and it goes to a second approver.'); emit(); return }
      if (rm) o = { label: 'Remove a hard rule', before: bd.t, after: '(removed)', note: 'Removing a rule widens what ' + a.name + ' can do, so it needs a second approver.', second: true, apply: () => B.bounds.splice(B.bounds.indexOf(bd), 1), undo: () => B.bounds.push(bd) }
      else { const obt = bd.t; o = { label: 'Change a hard rule', before: obt, after: txt, apply: () => { bd.t = txt }, undo: () => { bd.t = obt } } }
    }
    if (o) propose(a, o)
  }
  function brainEdit(a: any, t: string) {
    user(a.id + ':b', t)
    const B = BR[a.id], l = t.toLowerCase(), f = S.focus, p = lastChg(a)
    let m: RegExpMatchArray | null
    if (/^(apply|yes|do it|ok|okay|go ahead)\b/.test(l) && p) { chgGo(a, p, true); return }
    if (/^(cancel|no|never ?mind)\b/.test(l)) { if (p) { chgGo(a, p, false); return } if (f) { S.focus = null; sayB(a, 'Okay, nothing changed.'); emit(); return } }
    if (/what changed|history|this week|recent changes/.test(l)) { const hs = a.hist.slice(-3).reverse(); sayB(a, hs.length ? 'Latest: ' + hs.map((x: any) => x.t + ' (' + x.ts + ')').join('; ') + '.' : 'No changes yet.'); return }
    if (dialNL(a, l)) return
    if (f && f.id === a.id) { focusedEdit(a, f, t, l); return }
    if ((m = t.match(/add (?:a |one )?step to (?:the )?([a-z\- ]+?)\s*(?::|,|—| saying| that says| -)\s*(.+)$/i))) {
      const s = findSop(B, m[1])
      if (!s) { sayB(a, 'Which playbook? ' + a.name + ' has: ' + B.sops.map((x: any) => x.name.toLowerCase()).join(', ') + '.'); return }
      const st = { t: cap1(m[2].replace(/[.!?]+$/, '')), h: /ask me|approv|check with me/i.test(m[2]) }
      propose(a, { label: 'Add a step to ' + s.name.toLowerCase(), before: '(nothing)', after: st.t + (st.h ? ' (asks you)' : ''), note: 'Goes last. Takes effect on the next run.', apply: () => s.steps.push(st), undo: () => s.steps.splice(s.steps.indexOf(st), 1) }); return
    }
    if ((m = l.match(/make (\w+) (read[- ]?only|reads?|proposes?|acts?)\b/))) { accessLevel(a, m[1], m[2]); return }
    if ((m = l.match(/(?:remove|revoke) (?:access to |its access to )?(\w+)/))) { const ac = findAcc(B, m[1]); if (ac) { propose(a, removeAcc(a, ac)); return } }
    if ((m = l.match(/forget (?:the |that )?(.+?)[.!?]*$/))) {
      const w = m[1].split(' ')[0]; let li = -1; a.lessons.forEach((x: string, i: number) => { if (x.toLowerCase().indexOf(w) >= 0) li = i })
      if (li < 0) { sayB(a, 'I don’t have a habit like that.'); return }
      const old = a.lessons[li]; propose(a, { label: 'Forget a learned habit', before: old, after: '(forgotten, won’t be relearned)', apply: () => a.lessons.splice(a.lessons.indexOf(old), 1), undo: () => a.lessons.push(old) }); return
    }
    const r = ruleFrom(l)
    if (r) { const b = { t: r.rule, src: 'you' }; propose(a, { label: 'Add a hard rule for ' + a.name, before: '(nothing)', after: r.rule, note: 'The policy engine enforces it, not ' + a.name + '’s judgment.', apply: () => B.bounds.push(b), undo: () => B.bounds.splice(B.bounds.indexOf(b), 1) }); return }
    sayB(a, 'Tap the line you want to change, or say something like “add a step to ' + B.sops[0].name.toLowerCase() + ': tell me when it’s done” or “make ' + B.access[0].sys + ' read only.”')
  }
  function pick(sec: string, i: number, j: number | null) { const a = bAgent(); S.focus = { id: a.id, sec, i, j }; emit(); document.getElementById('in')?.focus() }
  const unpick = () => { S.focus = null; emit() }

  /* ---------- the message bar: one input, routed by where you are ---------- */
  function send(v: string) {
    v = (v || '').trim(); if (!v) return
    if (S.view === 'team') handleTeam(v); else if (isLog() || isTrace()) searchLog(v); else if (isBrain()) brainEdit(bAgent(), v); else handleAgent(ag(S.view), v)
  }
  function stopAll() { const allP = A.every((x: any) => x.paused); if (S.view !== 'team') go('team'); handleTeam(allP ? 'resume everyone' : 'pause everyone') }
  function chips(): { pill: string | null; list: string[] } {
    if (isLog()) return { pill: null, list: ['Blocked', 'Approved by you', 'Everything'] }
    if (isTrace()) return { pill: null, list: ['Blocked', 'Everything'] }
    if (isBrain()) {
      const a = bAgent(), B = BR[a.id]
      if (lastChg(a)) return { pill: null, list: ['Apply', 'Cancel'] }
      if (S.focus && S.focus.id === a.id) return { pill: focusText(a, S.focus), list: ['Remove it', 'Cancel'] }
      if (a.id === 'iris') return { pill: null, list: ['Be more careful', 'Add a step to onboarding: notify the manager', 'Make Jamf read only', 'Make AWS act'] }
      return { pill: null, list: ['Speak up less', 'Add a step to ' + B.sops[0].name.toLowerCase() + ': tell me when it’s done', 'What changed this week?'] }
    }
    if (S.view === 'team') { const p = fleetPend(); return { pill: null, list: S.flow ? ['Engineering, read only', 'Everyone, read only', 'Engineering, they can act'] : p.length === 1 ? ['Yes', 'No'] : ['What needs me?', 'Onboard Linear', 'Pause everyone'] } }
    const q = agentPend(ag(S.view))
    return { pill: null, list: q.length === 1 && q[0].kind === 'unless' ? ['Go ahead', 'Don’t', 'Why?'] : q.length === 1 ? ['Yes', 'No', 'Why?'] : ['What have you learned?', 'What did you do today?', 'Speak up less'] }
  }

  /* ---------- lifecycle ---------- */
  const t0 = now()
  ag('sol').msgs.push({ k: 'note', kind: 'ask', src: 'failed-login spikes', title: 'Read access to Okta sign-in logs?', why: 'Three failed-login spikes this week. I need the logs to tell if they’re attacks. Read-only, 30 days.', done: 'I can read Okta sign-in logs for 30 days.', ts: t0 - 40 * 60000 })
  ag('fen').msgs.push({ k: 'note', kind: 'ask', src: 'invoice match', title: 'Pay the Acme invoice, $4,200?', why: 'It matches PO-118 and Acme is approved, but the bank account on file is new. I want a person to confirm.', done: 'Paid Acme $4,200 after your confirmation.', unit: 'w1025', ts: t0 - 25 * 60000 })
  const v0 = viewFromHash(location.hash.slice(1)); if (v0) S.view = v0
  const onHash = () => { const v = viewFromHash(location.hash.slice(1)); if (v && v !== S.view) { S.view = v; S.focus = null; emit(); window.scrollTo(0, 0) } }
  function start() {
    addEventListener('hashchange', onHash)
    later(() => proactive(false), 8000)
    const iv = window.setInterval(() => proactive(false), 30000); intervals.add(iv)
  }
  function stop() {
    removeEventListener('hashchange', onHash)
    timers.forEach((t) => clearTimeout(t)); timers.clear()
    intervals.forEach((t) => clearInterval(t)); intervals.clear(); walkT = 0
  }

  return {
    S, A, BR, WORK,
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } },
    getVersion: () => version, getScrollSeq: () => scrollSeq, start, stop,
    ag, thread, agentPend, fleetPend, stOf, lineOf, isLog, isTrace, isBrain, logWho, bAgent, unitById, unitOf, backOf, matchQ, isWide, lastChg, chips,
    go, send, stopAll, resolve, pause, sim, toast, undoUnit, playWalk, pickNode, clearMap, closeWalk, pickStage,
    setDial, resetDials, applyProf, chgGo, revert, pick, unpick, clearQ: () => { S.q = ''; emit() }, hideToast: () => { S.toast = null; emit() },
  }
}
export type Warden = ReturnType<typeof createWarden>
