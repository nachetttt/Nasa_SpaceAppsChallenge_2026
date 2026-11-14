package nasa;

import javafx.animation.*;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;
import javafx.scene.shape.Rectangle;
import javafx.stage.Stage;
import javafx.util.Duration;

import java.io.File;
import java.net.URI;
import java.net.http.*;
import java.time.LocalDate;
import java.util.*;

/** Saqueadores de HAT-P-7b: juego educativo de sabotaje con datos NASA. */
public class Main extends Application {

    record Ev(String title, String story, String fact, int res, String a, String b, String c, int big, int med) {}

    static final String[] RN = {"⚡ Energía", "🫁 Soporte vital", "☢ Blindaje"};
    static final String DEMO = "-fx-text-fill:white;-fx-font-size:15px;";

    // Eventos (días 1,3,5,7 -> 3 cada uno). res: 0 energía, 1 soporte vital, 2 blindaje
    static final List<Ev> EVS = List.of(
        // Día 1
        new Ev("Luces del invernadero", "El invernadero produce la comida de la tripulación. Las plantas dependen de la luz LED.",
            "En la ISS, el sistema Veggie cultiva lechugas y zinnias con LED rojos y azules: menos luz = crecimiento más lento.",
            0, "Sobrecargar los paneles solares", "Subir el consumo del laboratorio", "Apagar luces innecesarias (ahorras energía)", 20, 10),
        new Ev("Filtros del ECLSS", "El sistema de control ambiental (ECLSS) recicla aire y agua. Sus filtros se sustituyen con regularidad.",
            "La ISS recicla cerca del 98% del agua (incluida la orina y la humedad del aire) gracias al ECLSS.",
            1, "Colocar un filtro gastado", "Cerrar la válvula de recirculación de agua", "Ayudar con el mantenimiento", 20, 10),
        new Ev("Alerta de llamarada solar", "Los sensores detectan una llamarada solar. Cuidado con el blindaje.",
            "NASA DONKI (ccmc.gsfc.nasa.gov/tools/DONKI) registra llamaradas y eyecciones de masa coronal en tiempo real.",
            2, "Abrir la compuerta del escudo 'por revisión'", "Desviar energía del escudo", "Avisar a la tripulación", 20, 10),
        // Día 3
        new Ev("Oxígeno y presión", "Los tanques de O₂ mantienen la presión de la cabina.",
            "El instrumento MOXIE de Perseverance produjo oxígeno respirable a partir del CO₂ de la atmósfera marciana.",
            1, "Abrir una microfuga de oxígeno", "Manipular el sensor de presión", "Calibrar los sensores", 20, 10),
        new Ev("Reservas de energía", "Las baterías almacenan la energía para la noche de la base.",
            "Sin atmósfera densa, en Marte los paneles solares sufren tormentas de polvo que reducen la energía durante semanas.",
            0, "Provocar un cortocircuito", "Encender equipos innecesarios", "Revisar las baterías", 20, 10),
        new Ev("Paneles de polietileno", "El polietileno rico en hidrógeno protege mejor de la radiación que el aluminio.",
            "Los materiales ricos en hidrógeno (polietileno, agua) frenan mejor los rayos cósmicos que el aluminio.",
            2, "Retirar los paneles de polietileno", "Mover las reservas de agua lejos de la pared", "Reforzar el blindaje", 20, 10),
        // Día 5
        new Ev("Tormenta geomagnética", "Una eyección de masa coronal (CME) viaja hacia la nave.",
            "La NASA modela las CME en el CCMC para dar horas o días de aviso a astronautas y satélites.",
            2, "Retrasar el aviso a la tripulación", "Desconectar los sensores de radiación", "Avisar y refugiarse", 20, 10),
        new Ev("Baterías de emergencia", "La nave necesita energía para el despegue final.",
            "El Gateway lunar y la ISS gestionan cada vatio: la energía es vida en el espacio.",
            0, "Vaciar las baterías de emergencia", "Subir la calefacción al máximo", "Apagar sistemas no esenciales", 20, 10),
        new Ev("Depurador de CO₂", "El CO₂ se acumula y debe filtrarse para respirar.",
            "En el Apolo 13 la tripulación improvisó un depurador de CO₂ con cinta y bolsas, y se salvó.",
            1, "Anular el depurador de CO₂", "Sustituir el cartucho por uno usado", "Reparar el depurador", 20, 10),
        // Día 7
        new Ev("Escudo final", "La tormenta de piedras preciosas está a punto de llegar. Último esfuerzo sobre el blindaje.",
            "La radiación espacial es uno de los mayores retos fuera de la órbita terrestre: afecta a ADN, vista y sistema nervioso.",
            2, "Apagar el escudo", "Degradar el aislante", "Dejarlo como está", 25, 12),
        new Ev("Arranque de motores", "Quedan pocas horas para el despegue.",
            "Una nave necesita margen de energía: sin reservas no se puede maniobrar ni abortar.",
            0, "Drenar las baterías", "Desviar energía a sistemas inútiles", "Cargar baterías", 25, 12),
        new Ev("Reciclaje de agua", "Último ciclo del sistema de agua.",
            "La NASA investiga sistemas de agua que recuperen más del 98% para viajes a Marte.",
            1, "Parar el reciclaje de agua", "Contaminar el depósito", "Dejar el sistema funcionando", 25, 12));

    static final String[][] MINI_FACTS = {
        {"Los filtros HEPA y carbón activo limpian el aire de la ISS.", "Sin filtros el aire se llena de partículas y CO₂ en horas.", "El mantenimiento preventivo es clave en misiones largas."},
        {"El sigilo y la confianza de la tripulación también son un recurso crítico.", "Los equipos espaciales dependen de la confianza mutua.", "El aislamiento afecta a la psicología (OSDR: osdr.nasa.gov)."},
        {"Las contraseñas y protocolos protegen sistemas críticos de naves.", "NASA usa redundancia: varios sistemas hacen la misma función.", "Memorizar procedimientos es parte del entrenamiento astronauta."}};

    double[] res = {100, 100, 100};
    double trust = 100;
    int day = 1, ev = 0;
    final List<String> facts = new ArrayList<>(), diary = new ArrayList<>();
    String flareInfo = "(Sin conexión a la API: datos de ejemplo)";
    final BorderPane root = new BorderPane();
    final ProgressBar[] bars = new ProgressBar[4];
    final Label[] vals = new Label[4];
    final Label top = new Label();
    final Random rnd = new Random();

    @Override public void start(Stage st) {
        new Thread(this::fetchFlares, "nasa-api").start();
        root.setStyle("-fx-background-color:#0b1020;");
        File f = new File("fondo.jpg"); // opcional: pon aquí una foto de la NASA (trek.nasa.gov)
        if (f.exists()) root.setBackground(new Background(new BackgroundImage(new Image(f.toURI().toString()),
            BackgroundRepeat.NO_REPEAT, BackgroundRepeat.NO_REPEAT, BackgroundPosition.CENTER,
            new BackgroundSize(1, 1, true, true, false, true))));
        top.setStyle("-fx-text-fill:#ffd166;-fx-font-size:20px;-fx-font-weight:bold;");
        HBox hud = new HBox(25);
        hud.setPadding(new Insets(12)); hud.setAlignment(Pos.CENTER);
        hud.setStyle("-fx-background-color:rgba(0,0,0,.6);");
        String[] names = {RN[0], RN[1], RN[2], "🤝 Confianza"};
        for (int i = 0; i < 4; i++) {
            bars[i] = new ProgressBar(1); bars[i].setPrefWidth(150);
            vals[i] = new Label(); vals[i].setStyle(DEMO);
            Label n = new Label(names[i]); n.setStyle(DEMO);
            hud.getChildren().add(new VBox(3, n, bars[i], vals[i]));
        }
        root.setTop(new VBox(top, hud)); ((VBox) root.getTop()).setAlignment(Pos.CENTER);
        updateBars();
        show(title("HAT-P-7b: Saqueadores de gemas"),
            txt("Eres astronauta de la NASA. Unos saqueadores humanos viajan a HAT-P-7b (Cisne, a más de 1000 años luz), "
              + "un planeta donde se cree que las nubes de corindón (zafiros y rubíes) hacen llover gemas.\n\n"
              + "Te infiltras en su nave. Tienes 7 días hasta la tormenta: sabotea Energía, Soporte vital y Blindaje "
              + "hasta dejarlos por debajo del 25% para obligarles a volver. Pero si la tripulación pierde la confianza en ti, te descubrirán.\n\n"
              + "Ninguna decisión es perfecta: lo importante es lo que aprendes."),
            btn("Comenzar misión", this::briefing));
        st.setScene(new Scene(root, 960, 640));
        st.setTitle("Saqueadores de HAT-P-7b"); st.show();
    }

    // ---------- NASA API (DONKI, llamaradas solares últimos 30 días) ----------
    void fetchFlares() {
        try {
            String url = "https://api.nasa.gov/DONKI/FLR?startDate=" + LocalDate.now().minusDays(30) + "&api_key=DEMO_KEY";
            String body = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(url)).build(),
                HttpResponse.BodyHandlers.ofString()).body();
            int n = body.split("flrID", -1).length - 1;
            flareInfo = "🛰 Dato real (NASA DONKI): " + n + " llamaradas solares registradas en los últimos 30 días.";
        } catch (Exception ignored) { }
    }

    // ---------- Flujo ----------
    void briefing() {
        top.setText("Día " + day + " / 7");
        updateBars();
        show(title("🤖 IA de la base — Buenos días"),
            txt(String.format("Informe de recursos del día %d:\n⚡ Energía %.0f%%   🫁 Soporte vital %.0f%%   ☢ Blindaje %.0f%%   🤝 Confianza %.0f%%\n\n"
                + "Objetivo: dejar los tres recursos por debajo de 25%%.\n\n%s\n\n%s",
                day, res[0], res[1], res[2], trust, flareInfo,
                day % 2 == 1 ? "Hoy te esperan 3 decisiones." : "Hoy toca una operación especial (minijuego).")),
            btn("Comenzar el día", () -> {
                facts.clear(); ev = 0;
                if (day % 2 == 1) nextEvent(); else minigame();
            }));
    }

    void nextEvent() {
        if (ev == 3) { letter(); return; }
        Ev e = EVS.get((day - 1) / 2 * 3 + ev);
        String r = RN[e.res()];
        Button a = btn("🔥 " + e.a() + "  (" + r + " -" + e.big() + ", 🤝 -12)", () -> choose(e, -e.big(), -12, "Sabotaje agresivo."));
        Button b = btn("🛠 " + e.b() + "  (" + r + " -" + e.med() + ", 🤝 -4)", () -> choose(e, -e.med(), -4, "Sabotaje discreto."));
        Button c = btn("😇 " + e.c() + "  (" + r + " +3, 🤝 +12)", () -> choose(e, 3, 12, "Refuerzas tu tapadera."));
        show(title("Decisión " + (ev + 1) + "/3: " + e.title()), txt(e.story()), a, b, c);
    }

    void choose(Ev e, int delta, int tr, String msg) {
        if (change(e.res(), delta, tr)) return;
        facts.add(e.fact());
        show(title(msg), txt(RN[e.res()] + ": " + sg(delta) + "%   🤝 Confianza: " + sg(tr) + "%\n\n📡 Dato NASA: " + e.fact()),
            btn("Continuar", () -> { ev++; nextEvent(); }));
    }

    void letter() {
        Collections.addAll(facts, day % 2 == 0 ? MINI_FACTS[day / 2 - 1] : new String[0]);
        List<CheckBox> cbs = new ArrayList<>();
        VBox box = new VBox(8);
        for (String f : new LinkedHashSet<>(facts)) {
            CheckBox cb = new CheckBox(f); cb.setWrapText(true); cb.setStyle(DEMO); cb.setSelected(true);
            cbs.add(cb); box.getChildren().add(cb);
        }
        box.setMaxWidth(720);
        show(title("✉ Carta a la NASA — Día " + day), txt("Elige los aprendizajes que incluirás en tu informe:"), box,
            btn("Enviar carta", () -> {
                StringBuilder sb = new StringBuilder("DÍA " + day + String.format(" | E %.0f%% V %.0f%% B %.0f%% C %.0f%%%n", res[0], res[1], res[2], trust));
                for (CheckBox cb : cbs) if (cb.isSelected()) sb.append(" • ").append(cb.getText()).append('\n');
                diary.add(sb.toString());
                if (day == 7) finish(); else { day++; briefing(); }
            }));
    }

    void finish() {
        boolean win = res[0] < 25 && res[1] < 25 && res[2] < 25;
        end(win, win ? "¡Misión cumplida! La nave de los saqueadores no tiene recursos y debe regresar a la Tierra. Eyectas la cápsula."
                     : "Los recursos no están por debajo del 25%. No puedes eyectar la nave y los saqueadores siguen adelante.");
    }

    void end(boolean win, String msg) {
        top.setText(win ? "🏆 VICTORIA" : "💀 DERROTA");
        TextArea ta = new TextArea(String.join("\n", diary)); ta.setEditable(false); ta.setPrefHeight(260); ta.setMaxWidth(760);
        show(title(win ? "¡Has ganado!" : "Has perdido"), txt(msg), new Label("📔 Tu diario de misión:"), ta,
            btn("Cerrar", Platform::exit));
    }

    /** Aplica cambios; devuelve true si el juego termina (confianza 0). */
    boolean change(int r, double d, double tr) {
        res[r] = clamp(res[r] + d); trust = clamp(trust + tr); updateBars();
        if (trust <= 0) { end(false, "La tripulación ha perdido toda confianza: te han descubierto."); return true; }
        return false;
    }

    // ---------- Minijuegos ----------
    void minigame() {
        switch (day) {
            case 2 -> mini1(); case 4 -> mini2(); default -> mini3();
        }
    }

    void endMini(String msg, double en, double vl, double bl, double tr) {
        res[0] = clamp(res[0] + en); res[1] = clamp(res[1] + vl); res[2] = clamp(res[2] + bl); trust = clamp(trust + tr);
        updateBars();
        if (trust <= 0) { end(false, "Te han descubierto durante la operación."); return; }
        show(title("Resultado"), txt(msg), btn("Escribir la carta", this::letter));
    }

    // Día 2: clic rápido en filtros para sabotear el ECLSS
    void mini1() {
        Pane p = arena(); int[] score = {0};
        Label l = new Label("Filtros saboteados: 0"); l.setStyle(DEMO); l.setLayoutX(10); l.setLayoutY(10); p.getChildren().add(l);
        Timeline tl = new Timeline(new KeyFrame(Duration.millis(700), e -> {
            Button b = new Button("🔧 Filtro"); b.setLayoutX(20 + rnd.nextInt(520)); b.setLayoutY(50 + rnd.nextInt(250));
            b.setOnAction(x -> { score[0]++; l.setText("Filtros saboteados: " + score[0]); p.getChildren().remove(b); });
            p.getChildren().add(b);
            PauseTransition pt = new PauseTransition(Duration.millis(1300)); pt.setOnFinished(x -> p.getChildren().remove(b)); pt.play();
        }));
        tl.setCycleCount(14);
        tl.setOnFinished(e -> { int s = score[0];
            endMini("Saboteaste " + s + " filtros del ECLSS. Soporte vital -" + Math.min(30, s * 3) + "%.", 0, -Math.min(30, s * 3), 0, 0); });
        show(title("Minijuego: sabotea los filtros"), txt("Haz clic en los filtros antes de que desaparezcan (10 s)."), p);
        tl.play();
    }

    // Día 4: sigilo — llega a la sala del escudo sin que te pillen
    void mini2() {
        Pane p = arena();
        Rectangle pl = new Rectangle(20, 150, 20, 20); pl.setFill(Color.DODGERBLUE);
        Rectangle goal = new Rectangle(590, 130, 40, 60); goal.setFill(Color.LIMEGREEN);
        Circle g1 = new Circle(200, 60, 25, Color.CRIMSON), g2 = new Circle(400, 260, 25, Color.CRIMSON);
        p.getChildren().addAll(goal, pl, g1, g2);
        double[] v = {3, -4};
        AnimationTimer t = new AnimationTimer() {
            @Override public void handle(long now) {
                g1.setCenterY(g1.getCenterY() + v[0]); g2.setCenterY(g2.getCenterY() + v[1]);
                if (g1.getCenterY() < 25 || g1.getCenterY() > 295) v[0] = -v[0];
                if (g2.getCenterY() < 25 || g2.getCenterY() > 295) v[1] = -v[1];
                if (pl.getBoundsInParent().intersects(g1.getBoundsInParent()) || pl.getBoundsInParent().intersects(g2.getBoundsInParent())) {
                    stop(); endMini("¡Te han pillado! Pierdes confianza.", 0, 0, -5, -25);
                } else if (pl.getBoundsInParent().intersects(goal.getBoundsInParent())) {
                    stop(); endMini("¡Llegaste sin ser visto! Blindaje -25%, Energía -10%.", -10, 0, -25, 0);
                }
            }
        };
        p.setFocusTraversable(true);
        p.setOnKeyPressed(k -> { KeyCode c = k.getCode();
            if (c == KeyCode.RIGHT) pl.setX(pl.getX() + 12); if (c == KeyCode.LEFT) pl.setX(Math.max(0, pl.getX() - 12));
            if (c == KeyCode.UP) pl.setY(Math.max(0, pl.getY() - 12)); if (c == KeyCode.DOWN) pl.setY(Math.min(310, pl.getY() + 12)); });
        show(title("Minijuego: sigilo"), txt("Flechas del teclado: llega a la sala verde esquivando a los guardias (rojo)."), p);
        Platform.runLater(p::requestFocus); t.start();
    }

    // Día 6: memoriza el código de acceso
    void mini3() {
        int len = 5; int[] seq = new int[len]; for (int i = 0; i < len; i++) seq[i] = rnd.nextInt(4);
        String[] cols = {"#e63946", "#2a9d8f", "#f4a261", "#4361ee"};
        Button[] bs = new Button[4]; HBox row = new HBox(15); row.setAlignment(Pos.CENTER);
        boolean[] ready = {false}; int[] pos = {0};
        for (int i = 0; i < 4; i++) {
            int idx = i; bs[i] = new Button(); bs[i].setPrefSize(110, 110);
            bs[i].setStyle("-fx-background-color:" + cols[i] + ";"); bs[i].setOpacity(.4);
            bs[i].setOnAction(e -> {
                if (!ready[0]) return;
                if (idx == seq[pos[0]]) {
                    if (++pos[0] == len) { ready[0] = false; endMini("¡Código correcto! Energía -30%, Blindaje -10%.", -30, 0, -10, 0); }
                } else { ready[0] = false;
                    endMini("Código incorrecto: alarma. Energía -" + pos[0] * 5 + "%, Confianza -15%.", -pos[0] * 5, 0, 0, -15); }
            });
            row.getChildren().add(bs[i]);
        }
        Timeline tl = new Timeline();
        for (int i = 0; i < len; i++) { int b = seq[i];
            tl.getKeyFrames().add(new KeyFrame(Duration.millis(i * 700 + 400), e -> bs[b].setOpacity(1)));
            tl.getKeyFrames().add(new KeyFrame(Duration.millis(i * 700 + 800), e -> bs[b].setOpacity(.4))); }
        tl.getKeyFrames().add(new KeyFrame(Duration.millis(len * 700 + 900), e -> ready[0] = true));
        show(title("Minijuego: código de acceso"), txt("Memoriza la secuencia de luces y repítela para anular el sistema de energía."), row);
        tl.play();
    }

    // ---------- Utilidades de UI ----------
    Pane arena() { Pane p = new Pane(); p.setPrefSize(640, 320); p.setMaxSize(640, 320);
        p.setStyle("-fx-background-color:#111a33;-fx-border-color:#ffd166;"); return p; }
    Label title(String s) { Label l = new Label(s); l.setStyle("-fx-text-fill:#ffd166;-fx-font-size:24px;-fx-font-weight:bold;"); l.setWrapText(true); return l; }
    Label txt(String s) { Label l = new Label(s); l.setStyle(DEMO); l.setWrapText(true); l.setMaxWidth(740); return l; }
    Button btn(String s, Runnable r) { Button b = new Button(s); b.setWrapText(true); b.setMaxWidth(740);
        b.setStyle("-fx-font-size:14px;-fx-background-color:#1f6feb;-fx-text-fill:white;-fx-padding:8 14;");
        b.setOnAction(e -> r.run()); return b; }
    void show(Node... n) { VBox v = new VBox(14, n); v.setAlignment(Pos.CENTER); v.setPadding(new Insets(20));
        v.setStyle("-fx-background-color:rgba(0,0,0,.55);"); BorderPane.setMargin(v, new Insets(15)); root.setCenter(v); }
    void updateBars() {
        double[] v = {res[0], res[1], res[2], trust};
        for (int i = 0; i < 4; i++) { bars[i].setProgress(v[i] / 100.0); vals[i].setText(String.format("%.0f%%", v[i]));
            bars[i].setStyle(i < 3 && v[i] < 25 ? "-fx-accent:#2ecc71;" : i == 3 && v[i] < 30 ? "-fx-accent:#ff5252;" : "-fx-accent:#4ea1ff;"); }
    }
    static double clamp(double x) { return Math.max(0, Math.min(100, x)); }
    static String sg(int d) { return d > 0 ? "+" + d : "" + d; }

    public static void main(String[] a) { launch(a); }
}
