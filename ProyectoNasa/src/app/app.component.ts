import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Phase = 'intro' | 'morning' | 'decision' | 'minigame' | 'report' | 'ending';
interface Resources { energia: number; soporte: number; blindaje: number; }
interface Choice { text: string; effects: Partial<Resources>; fact: string; result: string; }
interface DecisionEvent { title: string; situation: string; nasa: string; choices: Choice[]; }
interface MiniGame { id: string; title: string; intro: string; nasa: string; }

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
  mgResult: string | null = null;
  private timers: any[] = [];

  readonly daysTotal = 7;
  readonly crew = [
    { name: 'NOVA (robot amiga)', msg: '¡Hola! La nave necesita energía, aire y escudo para funcionar.' },
    { name: 'Luna (ingeniera)', msg: 'Si apagamos luces ahorramos energía, pero las plantitas crecen más lento.' },
    { name: 'Max (piloto)', msg: 'El escudo nos protege de los rayos del espacio. ¡Es muy importante!' }
  ];

  readonly decisions: Record<number, DecisionEvent[]> = {
    1: [
      { title: 'Luces del huerto espacial', situation: 'Las plantitas del huerto usan mucha electricidad por la noche. ¿Qué haces?',
        nasa: 'Dato NASA: en el espacio las plantas necesitan luz y energía para crecer y ayudar con la comida y el aire.',
        choices: [
          { text: 'Bajar las luces un poquito', effects: { energia: -8, soporte: -6 }, fact: 'Ahorras energía, pero las plantas crecen más despacio.', result: 'Las luces bajan. Hay menos energía y el huerto va más lento.' },
          { text: 'Cambiar cables para gastar más', effects: { energia: -6, blindaje: -2 }, fact: 'Mover cables puede hacer que la nave gaste sus reservas.', result: 'La nave usa energía de más sin que nadie lo note mucho.' },
          { text: 'No tocar nada', effects: { energia: +1 }, fact: 'A veces es bueno observar antes de actuar.', result: 'Todo sigue igual por ahora.' }
        ]},
      { title: 'El filtro de agua', situation: 'Encuentras el filtro que limpia el agua de la nave. ¡Es parte del sistema que da agua limpia!',
        nasa: 'Dato NASA: el sistema ECLSS ayuda a limpiar y reciclar agua y aire para los astronautas.',
        choices: [
          { text: 'Poner un filtro viejo', effects: { soporte: -10 }, fact: 'Un filtro viejo no limpia tan bien el agua y el aire.', result: 'El agua se recicla peor. El soporte vital baja.' },
          { text: 'Hacer que el arreglo tarde más', effects: { soporte: -5, energia: -2 }, fact: 'Si algo no se arregla a tiempo, la nave trabaja más.', result: 'La nave se esfuerza más y pierde un poco de recursos.' },
          { text: 'Dejarlo limpio y bien', effects: { soporte: +1 }, fact: 'Cuidar los sistemas mantiene la nave sana.', result: 'La tripulación está contenta. No hay cambios para tu plan.' }
        ]},
      { title: 'Aviso de rayos espaciales', situation: 'NOVA avisa que vienen rayos del Sol. Hay que elegir cómo usar el escudo.',
        nasa: 'Dato NASA: el clima espacial puede traer mucha radiación; el escudo ayuda a proteger a la tripulación.',
        choices: [
          { text: 'Bajar el escudo para "ahorrar"', effects: { blindaje: -12, energia: -3 }, fact: 'Sin escudo, la nave queda menos protegida de la radiación.', result: 'El escudo baja mucho. ¡La nave está más desprotegida!' },
          { text: 'Encender sistemas equivocados', effects: { blindaje: -6, energia: -6 }, fact: 'Usar la energía en el lugar incorrecto debilita la nave.', result: 'La energía y el escudo bajan un poco.' },
          { text: 'Activar el escudo correctamente', effects: { blindaje: +2 }, fact: 'Protegerse de la radiación es una buena decisión científica.', result: 'La nave queda muy protegida. Tu plan no avanza.' }
        ]}
    ],
    3: [
      { title: 'Polvo espacial travieso', situation: 'Hay polvo cerca de la nave y los sistemas trabajan extra.',
        nasa: 'Dato NASA: el polvo y el entorno espacial pueden complicar las misiones y gastar energía.',
        choices: [
          { text: 'Hacer que las máquinas se esfuercen de más', effects: { energia: -12, soporte: -3 }, fact: 'Si las máquinas trabajan demasiado, gastan mucha energía.', result: 'Las máquinas se calientan y la energía baja bastante.' },
          { text: 'Cambiar los números de temperatura', effects: { soporte: -8, energia: -3 }, fact: 'La temperatura correcta ayuda a que todo funcione bien.', result: 'El aire y la temperatura se descontrolan un poco.' },
          { text: 'Arreglar todo bien', effects: { energia: +2 }, fact: 'Cuidar la nave es lo más seguro.', result: 'La nave mejora, pero no ayudas a tu misión secreta.' }
        ]},
      { title: 'Tanques de aire', situation: 'Puedes entrar al panel donde se mezcla el aire para respirar.',
        nasa: 'Dato NASA: los astronautas necesitan oxígeno limpio; los sistemas de la nave lo preparan y cuidan.',
        choices: [
          { text: 'Mover las válvulas un poquito', effects: { soporte: -11 }, fact: 'Cambiar la mezcla de aire hace que el sistema gaste más recursos.', result: 'El sistema de aire trabaja mal y baja el soporte vital.' },
          { text: 'Cerrar una ayuda de emergencia', effects: { soporte: -7, blindaje: -3 }, fact: 'Las ayudas extra sirven para cuando algo falla.', result: 'La nave queda con menos protección.' },
          { text: 'Avisar de un problema falso', effects: { energia: -3 }, fact: 'Revisar la nave gasta tiempo y algo de energía.', result: 'Pierden energía revisando sin encontrar nada.' }
        ]},
      { title: 'Nubes brillantes de HAT-P-7b', situation: 'Partículas brillantes confunden los sensores de la nave.',
        nasa: 'Dato NASA: HAT-P-7b es un planeta lejano donde podría haber nubes con corindón, ¡el mineral de zafiros y rubíes!',
        choices: [
          { text: 'No ajustar los sensores', effects: { blindaje: -9, energia: -4 }, fact: 'Si los sensores fallan, el escudo puede reaccionar tarde.', result: 'Los sensores se confunden y el escudo baja.' },
          { text: 'Tapar un sensor por accidente', effects: { blindaje: -6, soporte: -2 }, fact: 'Sin buenos datos, es difícil proteger la nave.', result: 'La nave pierde información importante.' },
          { text: 'Limpiar y ajustar sensores', effects: { blindaje: +1 }, fact: 'Medir bien ayuda a tomar buenas decisiones.', result: 'Los sensores funcionan perfecto.' }
        ]}
    ],
    5: [
      { title: 'Cuidar las plantitas', situation: 'Las plantas ayudan a tener comida y un ambiente mejor dentro de la nave.',
        nasa: 'Dato NASA: las plantas en el espacio necesitan cuidados, luz y energía para ayudar a los astronautas.',
        choices: [
          { text: 'Darles menos nutrientes', effects: { soporte: -10 }, fact: 'Sin buenos nutrientes, las plantas no ayudan tanto.', result: 'Las plantitas se ponen débiles. El soporte vital baja.' },
          { text: 'Apagar el ventilador del huerto', effects: { soporte: -7, energia: -5 }, fact: 'El aire en movimiento ayuda a que el huerto esté sano.', result: 'El huerto empeora y la nave gasta recursos.' },
          { text: 'Cuidarlas muy bien', effects: { soporte: +2 }, fact: 'Cuidar la vida en la nave es importante.', result: 'Las plantas crecen felices.' }
        ]},
      { title: 'Tormenta espacial', situation: 'Hay mucha radiación afuera. La nave debe elegir qué proteger primero.',
        nasa: 'Dato NASA: durante tormentas espaciales, proteger a la tripulación y los sistemas es lo primero.',
        choices: [
          { text: 'Usar energía para motores y no para escudo', effects: { blindaje: -13, energia: -2 }, fact: 'Si quitas energía al escudo, la nave queda expuesta.', result: 'El escudo baja muchísimo.' },
          { text: 'Apagar sistemas de respaldo', effects: { energia: -8, blindaje: -4 }, fact: 'Los respaldos ayudan cuando algo sale mal.', result: 'La nave pierde respaldo, energía y escudo.' },
          { text: 'Proteger la nave bien', effects: { blindaje: +2 }, fact: 'Seguir las reglas de seguridad salva misiones.', result: 'La nave está segura.' }
        ]},
      { title: 'Camino de regreso', situation: 'Los saqueadores calculan cómo volver a casa con las gemas. Puedes cambiar el plan.',
        nasa: 'Dato NASA: viajar por el espacio requiere buenos cálculos para no gastar recursos de más.',
        choices: [
          { text: 'Elegir una ruta que gaste más', effects: { energia: -10, soporte: -2 }, fact: 'Una ruta más larga o mala gasta más energía.', result: 'La nave usa mucha más energía.' },
          { text: 'Subir el gasto de aire y clima', effects: { soporte: -8, energia: -3 }, fact: 'Pedir más al sistema de aire agota sus reservas.', result: 'El soporte vital y la energía bajan.' },
          { text: 'Elegir la mejor ruta', effects: { energia: +1 }, fact: 'Los buenos cálculos ahorran recursos.', result: 'La nave ahorra recursos. Eso no ayuda a tu plan.' }
        ]}
    ],
    7: [
      { title: 'La noche antes de la lluvia de gemas', situation: 'Mañana habrá lluvia de corindón brillante. ¡Es tu última oportunidad!',
        nasa: 'Dato NASA: estudiar planetas como HAT-P-7b ayuda a entender mundos muy diferentes al nuestro.',
        choices: [
          { text: 'Desordenar el enfriamiento', effects: { soporte: -12, energia: -6 }, fact: 'Mantener la temperatura correcta es parte del soporte vital.', result: 'La nave se calienta y pierde recursos.' },
          { text: 'Vaciar baterías de emergencia', effects: { energia: -14 }, fact: 'Sin baterías extra, la nave no tiene energía de reserva.', result: 'La energía cae muchísimo.' },
          { text: 'No hacer nada', effects: {}, fact: 'Esperar demasiado puede hacer que se acabe el tiempo.', result: 'La noche pasa sin cambios.' }
        ]},
      { title: 'Ajuste final del escudo', situation: 'Último momento para cambiar el escudo protector.',
        nasa: 'Dato NASA: el escudo ayuda a reducir la radiación que llega a la nave.',
        choices: [
          { text: 'Mover los paneles del escudo', effects: { blindaje: -14 }, fact: 'Si el escudo está mal puesto, protege menos.', result: 'El escudo queda muy débil.' },
          { text: 'Quitar energía al escudo', effects: { blindaje: -9, energia: -5 }, fact: 'Muchos escudos necesitan energía para funcionar bien.', result: 'Escudo y energía bajan.' },
          { text: 'Poner el escudo perfecto', effects: { blindaje: +2 }, fact: 'Un buen escudo mantiene a todos seguros.', result: 'El escudo mejora.' }
        ]},
      { title: 'Botón secreto final', situation: 'Todos duermen. Puedes hacer un último gran cambio.',
        nasa: 'Dato NASA: cuando los sistemas importantes bajan mucho, una nave no puede viajar segura.',
        choices: [
          { text: 'Bajar aire y energía', effects: { energia: -10, soporte: -10 }, fact: 'El aire y la energía trabajan juntos en la nave.', result: '¡Gran cambio! Dos recursos bajan mucho.' },
          { text: 'Bajar escudo y energía', effects: { blindaje: -10, energia: -8 }, fact: 'Sin escudo ni energía, la nave queda en problemas.', result: 'Escudo y energía bajan fuerte.' },
          { text: 'Rendirte', effects: { soporte: +2, energia: +2 }, fact: 'Si no actúas, la misión no se completa.', result: 'No hiciste cambios importantes.' }
        ]}
    ]
  };

  readonly minigames: Record<number, MiniGame> = {
    2: { id: 'memory', title: 'Cables Brillantes', intro: 'Mira la secuencia de colores y repítela tocando los botones. ¡Pon a prueba tu memoria!', nasa: 'Dato NASA: en una nave, conectar bien la energía es muy importante.' },
    4: { id: 'catch', title: 'Atrapa los Rayos', intro: 'Haz clic en los rayos espaciales antes de que desaparezcan para debilitar el escudo de los saqueadores.', nasa: 'Dato NASA: la radiación espacial es invisible, pero los científicos la detectan con instrumentos y usan escudos para protegerse.' },
    6: { id: 'maze', title: 'Misión Sigilosa', intro: 'Mueve al astronauta con las flechas hasta la computadora sin chocar con los robots guardianes.', nasa: 'Dato NASA: el ECLSS cuida el aire, el agua y la temperatura para que los astronautas vivan bien.' }
  };

  get isDecisionDay() { return [1,3,5,7].includes(this.day); }
  get isMinigameDay() { return [2,4,6].includes(this.day); }
  get currentDecisions() { return this.decisions[this.day] || []; }
  get currentDecision() { return this.currentDecisions[this.decisionIndex]; }
  get currentMinigame() { return this.minigames[this.day]; }
  get success() { return this.resources.energia < 25 && this.resources.soporte < 25 && this.resources.blindaje < 25; }

  startGame() { this.day = 1; this.resources = { energia: 82, soporte: 78, blindaje: 75 }; this.trust = 60; this.log = []; this.learnings = []; this.prepareMorning(); }

  prepareMorning() {
    const tips = [
      'NOVA: "¡Buenos días! La nave está funcionando... por ahora."',
      'NOVA: "Recuerda: necesitamos bajar Energía, Soporte y Escudo por debajo de 25%."',
      'NOVA: "HAT-P-7b tiene nubes con corindón, como zafiros y rubíes brillantes."',
      'NOVA: "¡Muy bien! Cada día aprendes algo nuevo sobre el espacio."',
      'NOVA: "El aire, el agua y la energía están conectados entre sí."',
      'NOVA: "Los rayos espaciales pueden ser peligrosos. El escudo es clave."',
      'NOVA: "¡Último día! Si no bajas los recursos a menos de 25%, no podrás detenerlos."'
    ];
    this.clearTimers();
    this.morningTip = tips[this.day - 1];
    this.phase = 'morning';
    this.decisionIndex = 0; this.choiceDone = false; this.selectedChoice = null;
    this.selectedLearnings = []; this.reportText = ''; this.mgResult = null; this.mg = {};
  }

  proceedFromMorning() { if (this.isDecisionDay) { this.phase = 'decision'; } else { this.setupMinigame(); this.phase = 'minigame'; } }

  clampResources() {
    (['energia','soporte','blindaje'] as const).forEach(k => { this.resources[k] = Math.max(0, Math.min(100, Math.round(this.resources[k]))); });
    this.trust = Math.max(0, Math.min(100, this.trust));
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
  }

  nextDecision() {
    this.decisionIndex++; this.selectedChoice = null; this.choiceDone = false;
    if (this.decisionIndex >= this.currentDecisions.length) { this.phase = 'report'; }
  }

  setupMinigame() {
    this.clearTimers(); this.mgResult = null;
    if (this.day === 2) {
      const colors = ['rojo','azul','verde','amarillo'];
      const seq = Array.from({length: 4}, () => colors[Math.floor(Math.random()*colors.length)]);
      this.mg = { colors, seq, showIndex: -1, showing: true, input: [] as string[], canPlay: false };
      this.playMemory();
    } else if (this.day === 4) {
      this.mg = { score: 0, time: 15, rays: [] as any[], over: false };
      this.startCatch();
    } else if (this.day === 6) {
      const grid = ['P...G','.#.#.','...#.','.##..','....E'];
      this.mg = { grid, rows: 5, cols: 5, player: {r:0,c:0}, goal: {r:4,c:4}, guards: [{r:0,c:4},{r:3,c:0}], moves: 0, done: false };
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
      this.mgResult = '¡Ups! Te equivocaste en la secuencia. Solo logras un pequeño cambio.';
      this.learnings.push(this.minigames[2].nasa); this.mg.canPlay = false; return;
    }
    if (this.mg.input.length === this.mg.seq.length) {
      this.resources.energia -= 15; this.resources.soporte -= 4; this.clampResources();
      this.mgResult = '¡Genial! Repetiste la secuencia perfecta y bajaste la energía de la nave.';
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
    if (s >= 10) { this.resources.blindaje -= 15; this.resources.energia -= 4; this.mgResult = `¡Increíble! Atrapaste ${s} rayos. El escudo bajó mucho.`; }
    else if (s >= 5) { this.resources.blindaje -= 9; this.mgResult = `¡Bien! Atrapaste ${s} rayos. El escudo bajó bastante.`; }
    else { this.resources.blindaje -= 4; this.trust += 2; this.mgResult = `Atrapaste ${s} rayos. Fue un cambio pequeño.`; }
    this.clampResources(); this.learnings.push(this.minigames[4].nasa);
  }

  mazeCell(r:number,c:number) {
    if (this.mg.player.r===r && this.mg.player.c===c) return 'player';
    if (this.mg.goal.r===r && this.mg.goal.c===c) return 'goal';
    if ((this.mg.guards||[]).some((g:any)=>g.r===r && g.c===c)) return 'guard';
    const ch = this.mg.grid[r][c];
    if (ch === '#') return 'wall';
    return 'floor';
  }
  move(dr:number, dc:number) {
    if (this.mg.done || this.mgResult) return;
    const nr = this.mg.player.r + dr, nc = this.mg.player.c + dc;
    if (nr<0||nc<0||nr>=5||nc>=5) return;
    if (this.mg.grid[nr][nc] === '#') return;
    this.mg.guards = this.mg.guards.map((g:any, i:number) => {
      const opts = i===0 ? [[0,4],[1,4],[0,3],[1,3]] : [[3,0],[3,1],[4,0],[2,0]];
      return opts[Math.floor(Math.random()*opts.length)] ? {r: opts[Math.floor(Math.random()*opts.length)][0], c: opts[Math.floor(Math.random()*opts.length)][1]} : g;
    });
    this.mg.player = {r:nr,c:nc}; this.mg.moves++;
    if (this.mg.guards.some((g:any)=>g.r===nr && g.c===nc)) {
      this.resources.soporte -= 5; this.trust -= 6; this.clampResources();
      this.mg.done = true; this.mgResult = '¡Un robot guardián te vio! Escapas, pero el cambio es pequeño.';
      this.learnings.push(this.minigames[6].nasa); return;
    }
    if (nr===this.mg.goal.r && nc===this.mg.goal.c) {
      this.resources.soporte -= 15; this.resources.energia -= 4; this.clampResources();
      this.mg.done = true; this.mgResult = '¡Llegaste a la sala del ECLSS en secreto! El soporte vital bajó mucho.';
      this.learnings.push(this.minigames[6].nasa);
    }
  }

  finishMinigame() { this.clearTimers(); this.phase = 'report'; }
  toggleLearning(l: string) {
    if (this.selectedLearnings.includes(l)) this.selectedLearnings = this.selectedLearnings.filter(x=>x!==l);
    else if (this.selectedLearnings.length < 3) this.selectedLearnings.push(l);
  }
  submitReport() {
    const text = this.selectedLearnings.join(' | ') + (this.reportText ? (' || Nota: '+this.reportText) : '');
    this.log.push(`Día ${this.day}: ${text || 'Hoy aprendimos en la aventura.'}`);
    if (this.day >= 7) { this.clearTimers(); this.phase = 'ending'; }
    else { this.day++; this.prepareMorning(); }
  }
  restart() { this.clearTimers(); this.phase = 'intro'; }
  barColor(v: number) { return v < 25 ? 'var(--bad)' : v < 50 ? 'var(--warn)' : 'var(--ok)'; }
  clearTimers() { this.timers.forEach(t => { try{clearTimeout(t);clearInterval(t);}catch{} }); this.timers = []; }
  ngOnDestroy() { this.clearTimers(); }
}
