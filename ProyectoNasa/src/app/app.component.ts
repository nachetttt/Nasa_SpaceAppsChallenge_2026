import { Component, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Phase = 'intro' | 'morning' | 'decision' | 'minigame' | 'report' | 'ending';
interface Resources { energia: number; soporte: number; blindaje: number; }
interface Choice { text: string; effects: Partial<Resources>; fact: string; result: string; }
interface DecisionEvent { title: string; situation: string; nasa: string; choices: Choice[]; }
interface MiniGame { id: string; title: string; intro: string; nasa: string; }

const c = (text: string, effects: Partial<Resources>, fact: string, result: string): Choice => ({ text, effects, fact, result });
const d = (title: string, situation: string, nasa: string, choices: Choice[]): DecisionEvent => ({ title, situation, nasa, choices });

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
  phase: Phase = 'intro';
  day = 1;
  resources: Resources = { energia: 82, soporte: 78, blindaje: 75 };
  trust = 60;
  log: string[] = [];
  selectedChoice: Choice | null = null;
  choiceDone = false;
  decisionIndex = 0;
  learnings: string[] = [];
  selectedLearnings: string[] = [];
  reportText = '';
  morningTip = '';
  mg: any = {};
  private _mgr: string | null = null;
  get mgResult() { return this._mgr; }
  set mgResult(v: string | null) { this._mgr = v; if (v) { this.say(v, 'wow'); this.noteMg(); } }
  mood: 'happy'|'think'|'wow'|'sad' = 'happy'; typed = ''; speaking = false; hit = false;
  deltas: Partial<Resources> = {};
  readonly days = [1,2,3,4,5,6,7];
  readonly resList = [{k:'energia' as const,icon:'⚡',label:'Energy'},{k:'soporte' as const,icon:'🫁',label:'Life support'},{k:'blindaje' as const,icon:'🛡️',label:'Shield'}];
  reaction: any = null; showCust = false; dayLog: any[] = []; yesterday: any[] = []; morningCrew: any[] = [];
  private mgStart: Resources = { energia: 0, soporte: 0, blindaje: 0 };
  readonly novaColors = [{a:'#ff8a1f'},{a:'#35c3ff'},{a:'#ff6fb5'},{a:'#3ddc97'},{a:'#b388ff'}];
  novaColor = this.novaColors[0];
  readonly accs = ['', '👑', '🎩', '🎀', '🕶️'];
  acc = '';
  readonly roster = [
    { emoji: '👩‍🔧', name: 'Luna (engineer)', lines: ['If we dim the lights we save power, but the plants grow slower.', 'Water is recycled again and again. Every drop counts!', 'Machines get hot when they work too hard.', 'Funny... the batteries are draining faster than I expected.'] },
    { emoji: '🧑‍✈️', name: 'Max (pilot)', lines: ['The shield protects us from space rays. It is super important!', 'HAT-P-7b is over 1,000 light-years away, and we are getting close.', 'Solar storms can hit with no warning. Stay sharp, rookie.', 'Whatever happens out here, I trust you.'] },
    { emoji: '👨‍🔬', name: 'Dr. Kai (scientist)', lines: ['HAT-P-7b is so hot that corundum clouds may form there.', 'Corundum is the mineral that makes sapphires and rubies!', 'The Sun throws out bursts of radiation. That is space weather.', 'Scientists on Earth watch the Sun every single day.'] },
    { emoji: '👩‍🍳', name: 'Rosa (cook)', lines: ['Fresh lettuce from the space garden for dinner tonight!', 'Plants give us food and help clean the air.', 'Nobody cooks well when the lights keep flickering...', 'Eat well, sleep well and fly well!'] }
  ];
  react(about: string, main: string, drop: number) {
    const idx: any = { energia: 0, blindaje: 1, none: 2, soporte: 3 };
    const L: any = {
      energia: ['Whoa, the power readings jumped around! Something is draining the batteries fast.', 'The energy meter wobbled a little. Probably nothing... probably.', 'Power is steady and clean. Tidy work, rookie!'],
      soporte: ['The air and water readings feel off! My garden is not going to like this.', 'The air tastes a bit odd today. Is it just me?', 'Air and water feel fresh and clean. Thank you, rookie!'],
      blindaje: ['Shield levels dropped hard! Who touched the controls?', 'The shield flickered for a second. I will keep an eye on it.', 'The shield looks strong. I feel safe with you aboard.'],
      none: ['', '', 'My instruments show no change. Calm and quiet, just how science likes it.']
    };
    return { m: this.roster[idx[main]], text: L[main][drop >= 9 ? 0 : drop > 0 ? 1 : 2], about, main, drop };
  }
  morningNote(e: any) {
    const names: any = { energia: 'Energy', soporte: 'Life support', blindaje: 'Shield' };
    if (e.main === 'none') return { m: e.m, text: 'My instruments show nothing unusual since "' + e.about + '". A quiet night!', about: '' };
    const v = this.resources[e.main as keyof Resources];
    const t = e.drop >= 9 ? 'It dropped fast after "' + e.about + '". Very odd!' : e.drop > 0 ? 'It slipped a little after "' + e.about + '". Strange.' : 'It stayed steady after "' + e.about + '". All good!';
    return { m: e.m, text: names[e.main] + ' is at ' + v + '% this morning. ' + t, about: '' };
  }
  noteMg() {
    const main = ({ 2: 'energia', 4: 'blindaje', 6: 'soporte' } as any)[this.day];
    if (!main) return;
    this.reaction = this.react(this.minigames[this.day].title, main, this.mgStart[main as keyof Resources] - this.resources[main as keyof Resources]);
    this.dayLog.push(this.reaction);
  }
  private snap: Resources = { energia: 82, soporte: 78, blindaje: 75 };
  private typeTimer: any; private deltaTimer: any; private novaText = '';
  constructor() { this.say('Hello, astronaut! My name is Cygnus, your base AI, named after the constellation where HAT-P-7b lives. I will guide you: every morning I brief you, and every night I help you write to NASA. Read the mission briefing, then press start!', 'wow'); }
  say(text: string, mood: 'happy'|'think'|'wow'|'sad' = 'happy') {
    clearInterval(this.typeTimer); this.novaText = text; this.mood = mood; this.typed = ''; this.speaking = true;
    const ch = Array.from(text); let i = 0;
    this.typeTimer = setInterval(() => { i += 2; this.typed = ch.slice(0, i).join(''); if (i >= ch.length) { this.speaking = false; clearInterval(this.typeTimer); } }, 28);
  }
  skipTyping() { if (this.speaking) { clearInterval(this.typeTimer); this.typed = this.novaText; this.speaking = false; } }
  sign(n?: number) { return (n || 0) > 0 ? '+' + n : '' + n; }
  goReport() { this.phase = 'report'; this.say('Great day! Pick up to 3 things you learned for your letter to NASA ✉️'); }
  private timers: any[] = [];

  readonly daysTotal = 7;
  readonly decisions: Record<number, DecisionEvent[]> = {
    1: [
      d('Space garden lights', 'It is night on the ship and the garden lamps are blazing. They use lots of electricity, but the little plants need them to grow. What do you do with the lights?',
        'NASA fact: in space, plants need light and energy to grow, and they help with food and air.', [
        c('Dim the garden lights to about half', { energia: -8, soporte: -6 }, 'Plants use light as food: with less light they grow slower and give less to eat.', 'The lamps fade and the corridor gets dim. The ship uses less electricity, but the plants get less light and grow slowly.'),
        c('Swap some cables so the lamps use more power', { energia: -6, blindaje: -2 }, 'Badly connected equipment can waste energy without anyone noticing.', 'Nobody notices the change, but the lamps start burning extra electricity. Little by little, the batteries drain.'),
        c('Touch nothing and watch how everything works', { energia: +1 }, 'Observing carefully before acting is also a way of doing science.', 'You leave everything as it was and watch the machines work. The ship runs fine, so your plan does not move forward.')]),
      d('The water filter', 'In the water room there is a filter that cleans what the crew drinks, because water is recycled again and again. Today it is time to change it, and you are the one doing it.',
        'NASA fact: the ECLSS system recycles a large part of the water and air astronauts use.', [
        c('Put in an old, worn-out filter', { soporte: -10 }, 'A worn filter cleans worse, which is why ships change them on time.', 'The old filter lets more dirt through and the water gets less clean. The ship life support drops quite a bit.'),
        c('Take a very long time to fix it so the ship overworks', { soporte: -5, energia: -2 }, 'When something is not fixed on time, the rest of the ship has to work twice as hard.', 'While the repair drags on, the water pumps keep running nonstop. The ship strains and loses some energy and clean water.'),
        c('Install a brand-new filter and do it perfectly', { soporte: +1 }, 'Taking care of the ship systems keeps the whole crew healthy.', 'The water comes out crystal clear and the crew thanks you. Everything is better than before, though it does not help your plan.')]),
      d('Space ray warning', 'Cygnus warns: a burst of particles from the Sun is coming! They are invisible rays, and you must decide how to use the ship shield.',
        'NASA fact: space weather can bring lots of radiation; shields help protect the crew.', [
        c('Lower the shield to save energy', { blindaje: -12, energia: -3 }, 'Without a shield, space radiation reaches the crew and the equipment more easily.', 'The shield weakens and the rays pass closer to the ship. Instruments flash red: the ship is much less protected now.'),
        c('Send power to systems that are not needed now', { blindaje: -6, energia: -6 }, 'Energy must be used where it is needed most, especially in moments of danger.', 'Power is shared badly: decorative lights shine bright while the shield runs short. Energy and shield both drop a little.'),
        c('Turn the shield to maximum, by the book', { blindaje: +2 }, 'Scientists watch space weather to warn astronauts when a solar storm is coming.', 'The shield glows blue and the rays bounce off harmlessly. The crew is safe, though your plan does not move forward.')])
    ],
    3: [
      d('Naughty space dust', 'A cloud of space dust surrounds the ship. The sensors fill with specks and the machines must work harder to keep everything clean.',
        'NASA fact: dust and the space environment can complicate missions and use up energy.', [
        c('Run the machines at full speed with no rest', { energia: -12, soporte: -3 }, 'Machines that never rest use much more energy and get hot.', 'The machines heat up like a toaster and the fans never stop. Energy drops a lot and the air gets a bit heavier.'),
        c('Change the ship thermostat numbers', { soporte: -8, energia: -3 }, 'The right temperature is part of life support: it helps people and machines work well.', 'With the wrong temperature, some rooms freeze while others overheat. The air gets unbalanced and the ship spends more to fix it.'),
        c('Carefully clean the dust and check every machine', { energia: +2 }, 'In space, even the finest dust can damage delicate instruments.', 'Everything shines again and the machines work calmly. The ship improves, but your secret mission stands still.')]),
      d('Air tanks', 'On the air panel, oxygen and other gases are mixed so the crew can breathe well. You have a few minutes alone with the valves.',
        'NASA fact: astronauts need clean oxygen; the ship systems prepare it and take care of it.', [
        c('Nudge the valves to change the mix', { soporte: -11 }, 'Ship air must be mixed very precisely to be breathable.', 'The air mix gets off balance and the system keeps correcting it again and again. It burns lots of resources and life support drops.'),
        c('Close one of the emergency air backups', { soporte: -7, blindaje: -3 }, 'Ships carry spare systems in case the main one fails.', 'There is no extra help left in case something goes wrong. The ship still breathes, but with less safety and a bit less protection.'),
        c('Warn everyone about a problem that does not exist', { energia: -3 }, 'Every check costs time and energy, so astronauts first find out which sensor sounded the alarm.', 'The crew checks every corner looking for the fault. They find nothing, but lose time and some energy searching.')]),
      d('Shiny clouds of HAT-P-7b', 'As you approach HAT-P-7b, shiny particles float around the ship and the sensors go crazy. What do you do?',
        'NASA fact: HAT-P-7b is a faraway planet that may have clouds of corundum, the mineral of sapphires and rubies.', [
        c('Leave the sensors unadjusted', { blindaje: -9, energia: -4 }, 'If the sensors fail, the shield does not know when to defend.', 'The sensors show mixed-up data and the shield reacts late. The ship loses protection and burns energy trying to understand what is happening.'),
        c('Accidentally cover one of the sensors', { blindaje: -6, soporte: -2 }, 'Scientists need good data to decide well, on Earth and in space.', 'One of the ship eyes goes dark. Without that information, it is harder to protect the crew.'),
        c('Clean and adjust the sensors calmly', { blindaje: +1 }, 'Measuring well is the first step to making good decisions.', 'The sensors see clearly again and everything works perfectly. From afar, HAT-P-7b glows with its corundum clouds.')])
    ],
    5: [
      d('Caring for the plants', 'The ship garden gives lettuce, fresh air and lots of joy to the crew. Someone has to decide how to take care of it today.',
        'NASA fact: astronauts have already grown plants in space, and they need light, water and care.', [
        c('Give them fewer nutrients than they need', { soporte: -10 }, 'Plants need water, light and nutrients; if one is missing, they do not grow well.', 'The leaves turn pale and the plants grow weak. They give less food and clean less air, so life support drops.'),
        c('Turn off the fan that moves the garden air', { soporte: -7, energia: -5 }, 'In space there is no wind, so fans are needed to move air around the plants.', 'Without a breeze, the air stays still and damp. The garden suffers and the ship spends resources to fix it.'),
        c('Water them and take great care of them', { soporte: +2 }, 'Taking care of life inside the ship is part of the mission.', 'The plants turn green and strong, and the room smells like fresh leaves. Everyone is happy, except your plan.')]),
      d('Space storm', 'A very strong solar storm fills space with radiation. The ship has little energy and must choose what to protect first.',
        'NASA fact: during space storms, protecting the crew and the systems comes first.', [
        c('Send the power to the engines, not the shield', { blindaje: -13, energia: -2 }, 'In a space storm, the shield is the first thing to look after.', 'The ship speeds up, but the shield almost shuts down. The radiation gets closer and protection drops a lot.'),
        c('Turn off the backup systems to save power', { energia: -8, blindaje: -4 }, 'Backups are like a spare car wheel: rarely used, but they save the trip.', 'Without the spare systems, the ship loses energy and protection. If something fails, nothing can replace it.'),
        c('Protect the crew and the shield above all', { blindaje: +2 }, 'Following safety rules saves missions.', 'Everyone gathers in the safest room while the shield holds against the storm. The danger passes and nobody is hurt.')]),
      d('The way back', 'The looters are calculating the route home with the gems. You can enter the navigation computer and change the plan.',
        'NASA fact: traveling through space takes very precise calculations so resources are not wasted.', [
        c('Pick a longer route that burns more fuel', { energia: -10, soporte: -2 }, 'A longer route means more time, more energy and more resources spent.', 'The new route takes a big loop through space. It takes longer and burns much more energy.'),
        c('Raise the air and climate use', { soporte: -8, energia: -3 }, 'The more you ask of the air system, the faster its reserves run out.', 'The ship uses more air and more energy to keep the climate. The reserves drop faster than planned.'),
        c('Leave the best route, short and safe', { energia: +1 }, 'Good calculations save resources.', 'The path is perfect and the ship saves energy. It is a good calculation, though it does not help your mission.')])
    ],
    7: [
      d('The night before the gem rain', 'Tomorrow a rain of shiny corundum falls on HAT-P-7b. It is your last night, everyone sleeps, and you can make one big change.',
        'NASA fact: studying planets like HAT-P-7b helps us understand worlds very different from ours.', [
        c('Wreck the system that cools the ship', { soporte: -12, energia: -6 }, 'Keeping the right temperature is an important part of life support.', 'The rooms slowly heat up and the fans work nonstop. Life support and energy drop a lot.'),
        c('Drain the emergency batteries', { energia: -14 }, 'Emergency batteries store energy for when everything else fails.', 'The reserve batteries run out of charge. The ship has no extra energy for hard moments.'),
        c('Do nothing tonight', {}, 'If you wait too long, sometimes you run out of time to get what you wanted.', 'The night passes quietly and everything stays the same. You have few decisions left to complete your mission.')]),
      d('Final shield adjustment', 'The shield protects the ship from radiation, and its panels can be aimed. It is your last chance to change how they are placed.',
        'NASA fact: the shield helps reduce the radiation that reaches the ship.', [
        c('Turn the shield panels the wrong way', { blindaje: -14 }, 'A badly placed shield protects much less, even if it is very strong.', 'The panels point where they should not and leave gaps for radiation to slip through. The shield becomes very weak.'),
        c('Take energy from the shield to use elsewhere', { blindaje: -9, energia: -5 }, 'Many space shields need energy to work well.', 'Without enough energy, the shield glows dimmer and dimmer. Both resources drop at once.'),
        c('Place the panels in the best position', { blindaje: +2 }, 'A good shield keeps everyone safe.', 'The panels fit perfectly and the shield glows strong. The ship is safer than ever.')]),
      d('Final secret button', 'There is a panel with two buttons almost nobody uses. You can make one last big change before dawn.',
        'NASA fact: when important systems drop a lot, a ship cannot travel safely.', [
        c('Lower the ship air and energy together', { energia: -10, soporte: -10 }, 'Air and energy work together: if one is short, the other suffers too.', 'A big change! The lights flicker and the air renews more slowly. Two resources drop a lot at once.'),
        c('Lower the shield and energy together', { blindaje: -10, energia: -8 }, 'Without a shield or energy, a ship cannot travel safely.', 'The lights dim and the shield loses strength. The ship is in trouble just when it needs help the most.'),
        c('Give up and go back to bed', { soporte: +2, energia: +2 }, 'If you do not act, your plans do not move forward.', 'You decide to touch nothing and go to sleep. The mission is not completed, but you can always try again.')])
    ]
  };

  readonly minigames: Record<number, MiniGame> = {
    2: { id: 'memory', title: 'Glowing Wires', intro: 'Watch the color sequence and repeat it by tapping the buttons. Test your memory!', nasa: 'NASA fact: on a spacecraft, connecting the power correctly is very important.' },
    4: { id: 'catch', title: 'Catch the Rays', intro: 'Tap the space rays before they vanish to weaken the looters shield.', nasa: 'NASA fact: space radiation is invisible, but scientists detect it with instruments and use shields to stay safe.' },
    6: { id: 'timing', title: 'Pump Override', intro: 'Press STOP (or the space bar) to freeze the red line inside the orange zone. The line never stops moving, and it gets faster!', nasa: 'NASA fact: ECLSS controls air, water and temperature so astronauts can live in space.' }
  };

  get isDecisionDay() { return [1,3,5,7].includes(this.day); }
  get isMinigameDay() { return [2,4,6].includes(this.day); }
  get currentDecisions() { return this.decisions[this.day] || []; }
  get currentDecision() { return this.currentDecisions[this.decisionIndex]; }
  get currentMinigame() { return this.minigames[this.day]; }
  get success() { return this.resources.energia < 25 && this.resources.soporte < 25 && this.resources.blindaje < 25; }

  startGame() { this.day = 1; this.resources = { energia: 82, soporte: 78, blindaje: 75 }; this.snap = { ...this.resources }; this.trust = 60; this.log = []; this.dayLog = []; this.learnings = []; this.prepareMorning(); }

  prepareMorning() {
    const tips = [
      'Good morning, astronaut! Your first day starts now. Let us see what the crew is up to.',
      'Remember: Energy, Life Support and Shield must all drop below 25%.',
      'HAT-P-7b has clouds of corundum, like shiny sapphires and rubies.',
      'Great work! Every day you learn something new about space.',
      'Air, water and energy are all connected to each other.',
      'Space rays can be dangerous. The shield is key.',
      'Last day! If the resources are not below 25%, you cannot eject the ship.'
    ];
    this.clearTimers();
    this.morningTip = tips[this.day - 1]; this.say(this.morningTip);
    this.phase = 'morning'; this.reaction = null;
    this.yesterday = this.dayLog; this.dayLog = []; this.learnings = [];
    const notes = this.yesterday.slice(0, 3).map(e => this.morningNote(e));
    const fill = [0, 1, 2].map(i => { const m = this.roster[(this.day + i) % 4]; return { m, text: m.lines[(this.day + i) % 4], about: '' }; });
    this.morningCrew = [...notes, ...fill.slice(notes.length)];
    this.decisionIndex = 0; this.choiceDone = false; this.selectedChoice = null;
    this.selectedLearnings = []; this.reportText = ''; this.mgResult = null; this.mg = {};
  }

  proceedFromMorning() { if (this.isDecisionDay) { this.phase = 'decision'; this.say(this.currentDecision.situation, 'think'); } else { this.setupMinigame(); this.phase = 'minigame'; this.say(this.currentMinigame.intro); } }

  clampResources() {
    (['energia','soporte','blindaje'] as const).forEach(k => { this.resources[k] = Math.max(0, Math.min(100, Math.round(this.resources[k]))); });
    this.trust = Math.max(0, Math.min(100, this.trust));
    const d: Partial<Resources> = {}; let big = false;
    (['energia','soporte','blindaje'] as const).forEach(k => { const x = this.resources[k] - this.snap[k]; if (x) { d[k] = x; if (x <= -10) big = true; } });
    this.snap = { ...this.resources };
    if (Object.keys(d).length) {
      this.deltas = {}; clearTimeout(this.deltaTimer);
      setTimeout(() => { this.deltas = d; this.hit = big; }, 30);
      this.deltaTimer = setTimeout(() => { this.deltas = {}; this.hit = false; }, 2100);
    }
  }

  choose(c: Choice) {
    if (this.choiceDone) return;
    this.selectedChoice = c; this.choiceDone = true;
    this.resources.energia += c.effects.energia || 0;
    this.resources.soporte += c.effects.soporte || 0;
    this.resources.blindaje += c.effects.blindaje || 0;
    const sabotage = (c.effects.energia||0) + (c.effects.soporte||0) + (c.effects.blindaje||0);
    this.trust += sabotage < -10 ? -5 : sabotage >= 0 ? 4 : -1;
    this.clampResources();
    this.learnings.push(c.fact);
    const ks = ['energia', 'soporte', 'blindaje'] as const;
    let main = 'none', drop = 0;
    ks.forEach(k => { const e = -(c.effects[k] || 0); if (e > drop) { drop = e; main = k; } });
    if (main === 'none') ks.forEach(k => { if ((c.effects[k] || 0) > 0) main = k; });
    this.reaction = this.react(c.text, main, drop); this.dayLog.push(this.reaction);
    this.say(c.result, sabotage < -10 ? 'wow' : sabotage < 0 ? 'think' : 'happy');
  }

  nextDecision() {
    this.decisionIndex++; this.reaction = null; this.selectedChoice = null; this.choiceDone = false;
    if (this.decisionIndex >= this.currentDecisions.length) { this.goReport(); } else { this.say(this.currentDecision.situation, 'think'); }
  }

  setupMinigame() {
    this.clearTimers(); this.mgResult = null; this.mgStart = { ...this.resources };
    if (this.day === 2) {
      const colors = ['red','blue','green','yellow'];
      const seq = Array.from({length: 4}, () => colors[Math.floor(Math.random()*colors.length)]);
      this.mg = { colors, seq, showIndex: -1, showing: true, input: [] as string[], canPlay: false };
      this.playMemory();
    } else if (this.day === 4) {
      this.mg = { score: 0, time: 15, rays: [] as any[], over: false };
      this.startCatch();
    } else if (this.day === 6) {
      this.mg = { pos: 0, dir: 1, tries: 3, hits: 0, marks: [] as boolean[], zone: 40, zw: 18, speed: 1.1, over: false };
      this.startTiming();
    }
  }

  playMemory() {
    this.mg.showing = true; this.mg.canPlay = false; this.mg.showIndex = -1; this.mg.input = [];
    let i = 0;
    const step = () => {
      if (this.phase !== 'minigame' || this.day !== 2) return;
      if (i < this.mg.seq.length) {
        this.mg.showIndex = i;
        this.timers.push(setTimeout(() => { this.mg.showIndex = -1; i++; this.timers.push(setTimeout(step, 350)); }, 650));
      } else { this.mg.showing = false; this.mg.canPlay = true; }
    };
    this.timers.push(setTimeout(step, 500));
  }

  mgMemoryPick(color: string) {
    if (!this.mg.canPlay || this.mgResult) return;
    this.mg.input.push(color);
    const idx = this.mg.input.length - 1;
    if (this.mg.input[idx] !== this.mg.seq[idx]) {
      this.resources.energia -= 5; this.trust -= 4; this.clampResources();
      this.mgResult = 'Oops! You got the sequence wrong. You only manage a tiny change.';
      this.learnings.push(this.minigames[2].nasa); this.mg.canPlay = false; return;
    }
    if (this.mg.input.length === this.mg.seq.length) {
      this.resources.energia -= 15; this.resources.soporte -= 4; this.clampResources();
      this.mgResult = 'Awesome! You repeated the sequence perfectly and the ship power dropped.';
      this.learnings.push(this.minigames[2].nasa); this.mg.canPlay = false;
    }
  }

  startCatch() {
    const tick = setInterval(() => {
      if (this.phase !== 'minigame' || this.day !== 4 || this.mg.over) { clearInterval(tick); return; }
      this.mg.time--;
      if (this.mg.time <= 0) { this.endCatch(); clearInterval(tick); }
    }, 1000);
    const spawn = setInterval(() => {
      if (this.phase !== 'minigame' || this.day !== 4 || this.mg.over) { clearInterval(spawn); return; }
      const id = Math.random().toString(36).slice(2);
      this.mg.rays.push({ id, x: 8 + Math.random()*84, y: 12 + Math.random()*68 });
      this.timers.push(setTimeout(() => { this.mg.rays = this.mg.rays.filter((r:any)=>r.id!==id); }, 1200));
    }, 700);
    this.timers.push(tick, spawn);
  }
  catchRay(r: any) {
    if (this.mg.over) return;
    this.mg.score++; this.mg.rays = this.mg.rays.filter((x:any)=>x.id!==r.id);
  }
  endCatch() {
    if (this.mg.over) return; this.mg.over = true;
    const s = this.mg.score;
    if (s >= 10) { this.resources.blindaje -= 15; this.resources.energia -= 4; this.mgResult = `Incredible! You caught ${s} rays. The shield dropped a lot.`; }
    else if (s >= 5) { this.resources.blindaje -= 9; this.mgResult = `Nice! You caught ${s} rays. The shield dropped quite a bit.`; }
    else { this.resources.blindaje -= 4; this.trust += 2; this.mgResult = `You caught ${s} rays. It was only a small change.`; }
    this.clampResources(); this.learnings.push(this.minigames[4].nasa);
  }

  startTiming() {
    const t = setInterval(() => {
      const m = this.mg;
      if (this.phase !== 'minigame' || this.day !== 6 || m.over) { clearInterval(t); return; }
      m.pos += m.dir * m.speed;
      if (m.pos >= 100) { m.pos = 100; m.dir = -1; }
      if (m.pos <= 0) { m.pos = 0; m.dir = 1; }
    }, 16);
    this.timers.push(t);
  }
  @HostListener('window:keydown.space', ['$event'])
  onSpace(e: Event) {
    if (this.phase === 'minigame' && this.day === 6) { e.preventDefault(); (document.activeElement as HTMLElement | null)?.blur(); this.stopLine(); }
  }
  stopLine() {
    const m = this.mg; if (m.over) return;
    const hit = m.pos >= m.zone && m.pos <= m.zone + m.zw;
    m.marks.push(hit); if (hit) m.hits++;
    if (m.marks.length >= m.tries) { m.over = true; this.finishTiming(); return; }
    this.say(hit ? 'Perfect timing!' : 'Missed! Try again.', hit ? 'wow' : 'sad');
    m.zone = 8 + Math.random() * 70; m.zw = Math.max(10, m.zw - 3); m.speed += 0.5;
  }
  finishTiming() {
    const h = this.mg.hits;
    if (h === 3) { this.resources.soporte -= 15; this.resources.energia -= 4; this.mgResult = 'Three out of three! You overrode the pump and life support dropped a lot.'; }
    else if (h === 2) { this.resources.soporte -= 10; this.mgResult = 'Two hits! The pump slowed down and life support dropped.'; }
    else if (h === 1) { this.resources.soporte -= 6; this.mgResult = 'One hit. The pump stuttered a little.'; }
    else { this.resources.soporte -= 3; this.trust -= 4; this.mgResult = 'You missed every time. Barely a scratch, and the crew got suspicious.'; }
    this.clampResources(); this.learnings.push(this.minigames[6].nasa);
  }

  finishMinigame() { this.clearTimers(); this.goReport(); }
  toggleLearning(l: string) {
    if (this.selectedLearnings.includes(l)) this.selectedLearnings = this.selectedLearnings.filter(x=>x!==l);
    else if (this.selectedLearnings.length < 3) this.selectedLearnings.push(l);
  }
  submitReport() {
    const text = this.selectedLearnings.join(' | ') + (this.reportText ? (' || Note: ' + this.reportText) : '');
    this.log.push(`Day ${this.day}: ${text || 'Today we learned in the adventure.'}`);
    if (this.day >= 7) {
      this.clearTimers(); this.phase = 'ending';
      this.say(this.success ? 'WE DID IT! The ship is heading back to Earth and the gems of HAT-P-7b are safe. You are a great astronaut! 🏆' : 'The looters can still go on, but you learned so much. Try again! 🚀', this.success ? 'wow' : 'think');
    } else { this.day++; this.prepareMorning(); }
  }
  restart() { this.clearTimers(); this.phase = 'intro'; this.say('Hello again! I am Cygnus. Ready for a new mission? 💎', 'happy'); }
  barState(v: number) { return v < 25 ? 'low' : v < 50 ? 'mid' : 'hi'; }
  clearTimers() { this.timers.forEach(t => { try{clearTimeout(t);clearInterval(t);}catch{} }); this.timers = []; }
  ngOnDestroy() { this.clearTimers(); clearInterval(this.typeTimer); clearTimeout(this.deltaTimer); }
}
