const regimes = ["Conservative", "Mediterranean", "Post-Socialist", "Social Democratic"];

const regimeMeta = {
  "Conservative": {
    color: "#1F3552",
    countries: "Austria, Belgium, Germany, France, Luxembourg, Netherlands, Ireland",
    evolutionFile: "data/interactive/phase3/fig_p3_evolution_conservative.json",
    evolutionComment:
      "This is the sharpest generational split in the whole regime picture. In Conservative Europe, young men stay planted on the traditional side of the cultural axis while young women pull clearly toward postmaterialist values \u2014 so the female line bends down while the male line barely moves.",
    groupedComment:
      "Looking only at Gen Z, the Conservative gap is wide enough to be read at a glance, but it is not the widest bar in the figure. The point is the combination: a solid gap today plus the largest generational divergence out of the four regimes.",
    gapComment:
      "The absolute Gen Z gap in Conservative Europe is sizeable even before bringing generations into the picture: young women and young men are already living in two different parts of the cultural space.",
    gdcComment:
      "The GDC peaks here. The transition from Millennials to Gen Z is not only big, it is strongly gendered: women and men move in opposite directions rather than together."
  },
  "Mediterranean": {
    color: "#E67E22",
    countries: "Cyprus, Spain, Greece, Italy, Malta, Portugal",
    evolutionFile: "data/interactive/phase3/fig_p3_evolution_mediterranean.json",
    evolutionComment:
      "Mediterranean Europe also splits its young generation by gender, but more quietly. The female and male trajectories move apart from Millennials onward without the dramatic hinge you see in the Conservative cluster.",
    groupedComment:
      "Gen Z still splits into two clearly different bars, yet the Mediterranean cluster is not defined by unusually high traditionalism. The story here is the persistence of the gap in a setting people often describe through delayed adulthood and family-based welfare.",
    gapComment:
      "The absolute Gen Z gap is comparable to the other clusters: young women and young men are landing in meaningfully different positions, even if the level of traditionalism is not extreme.",
    gdcComment:
      "The GDC here is moderate: there is divergence in how women and men shift from Millennials to Gen Z, but it is less sharp than in Conservative or Post-Socialist Europe."
  },
  "Post-Socialist": {
    color: "#8B2D56",
    countries: "Bulgaria, Croatia, Czechia, Estonia, Hungary, Lithuania, Latvia, Poland, Romania, Slovakia, Slovenia",
    evolutionFile: "data/interactive/phase3/fig_p3_evolution_post_socialist.json",
    evolutionComment:
      "Post-Socialist Europe is the most traditional cluster overall. Both young women and young men score high on the cultural axis, and young men reach the highest male mean in the whole comparison \u2014 the gender split happens on top of an already conservative baseline.",
    groupedComment:
      "The Gen Z bars here are the tallest among the four regimes for men, and the split between women and men is clearly visible. This combination \u2014 traditional baseline plus gender gap \u2014 is what makes Post-Socialist Europe central to the thesis argument.",
    gapComment:
      "The absolute gap is not the largest bar in the figure, but it layers on top of the most traditional positioning of the whole regime comparison. That is what matters analytically.",
    gdcComment:
      "The GDC is also very high here: the move from Millennials to Gen Z is strongly gendered rather than a uniform conservative drift shared by both sexes."
  },
  "Social Democratic": {
    color: "#D62828",
    countries: "Denmark, Finland, Sweden",
    evolutionFile: "data/interactive/phase3/fig_p3_evolution_social_democratic.json",
    evolutionComment:
      "The Nordic cluster still shows a visible gender split among Gen Z, but the female and male trajectories stay closer together across generations than in the Conservative and Post-Socialist cases.",
    groupedComment:
      "Even in the regime with the smallest generational divergence, Gen Z women and men do not fully converge: their bars are close, but they are not on top of each other.",
    gapComment:
      "The level gap remains meaningful here too. The lowest GDC in the comparison should not be read as the absence of polarization, only as a less explosive generational change.",
    gdcComment:
      "This is the smallest GDC in the four regimes: the split exists, but it grows less explosively from Millennials to Gen Z than elsewhere in Europe."
  }
};

const state = {
  selectedRegime: "Conservative",
  aggMeans: [],
  genzMeans: [],
  genzGap: [],
  gdc: [],
  gdcCounts: []
};

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      const raw = cells[index];
      const numeric = Number(raw);
      row[header] = raw !== "" && !Number.isNaN(numeric) ? numeric : raw;
    });
    return row;
  });
}

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function formatSigned(value) {
  const fixed = formatNumber(value, 2);
  return value > 0 ? `+${fixed}` : fixed;
}

function formatCi(low, high) {
  return `${formatNumber(low)}, ${formatNumber(high)}`;
}

function getRegimeTotals(regime) {
  return state.aggMeans
    .filter((row) => row.welfare_regime === regime)
    .reduce((sum, row) => sum + row.n, 0);
}

function getGenzMean(regime, gender) {
  return state.genzMeans.find(
    (row) => row.welfare_regime === regime && row.gender === gender
  );
}

function buildButtons() {
  document.querySelectorAll("[data-regime-controls]").forEach((wrap) => {
    wrap.innerHTML = regimes
      .map((regime) => {
        const active = state.selectedRegime === regime ? " active" : "";
        return `<button class="regime-button${active}" type="button" data-regime="${regime}">${regime}</button>`;
      })
      .join("");
  });

  document.querySelectorAll("[data-regime]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRegime = button.dataset.regime;
      render();
    });
  });
}

function updateSummaryCards() {
  const regime = state.selectedRegime;
  const meta = regimeMeta[regime];
  const female = getGenzMean(regime, "Female");
  const male = getGenzMean(regime, "Male");
  const gap = state.genzGap.find((row) => row.welfare_regime === regime);
  const gdc = state.gdc.find((row) => row.welfare_regime === regime);
  const sample = state.gdcCounts
    .filter((row) => row.welfare_regime === regime)
    .reduce((sum, row) => sum + row.n, 0);

  document.querySelectorAll("[data-selected-regime]").forEach((node) => {
    node.textContent = regime;
    node.style.color = meta.color;
  });

  const evolutionContainer = document.getElementById("evolution-chart");
  if (evolutionContainer && evolutionContainer.dataset.src !== meta.evolutionFile) {
    if (window.InteractiveCharts && typeof window.InteractiveCharts.remount === "function") {
      window.InteractiveCharts.remount(evolutionContainer, meta.evolutionFile);
    } else {
      evolutionContainer.dataset.src = meta.evolutionFile;
    }
  }
  const evolutionTarget = evolutionContainer && evolutionContainer.querySelector(".plot-target");
  if (evolutionTarget) {
    evolutionTarget.setAttribute(
      "aria-label",
      `Interactive evolution of the GAL-TAN mean by generation and gender, ${regime} regime`
    );
  }
  document.getElementById("evolution-comment").innerHTML = meta.evolutionComment;
  document.getElementById("grouped-comment").innerHTML = meta.groupedComment;
  document.getElementById("gap-comment").innerHTML = meta.gapComment;
  document.getElementById("gdc-comment").innerHTML = meta.gdcComment;
  document.getElementById("country-list").textContent = meta.countries;

  document.getElementById("regime-total-sample").textContent =
    getRegimeTotals(regime).toLocaleString("en-US");
  document.getElementById("genz-panel-sample").textContent =
    sample.toLocaleString("en-US");
  document.getElementById("female-mean").textContent = formatNumber(female.mean);
  document.getElementById("male-mean").textContent = formatNumber(male.mean);
  document.getElementById("female-ci").textContent = formatCi(female.ci_low, female.ci_high);
  document.getElementById("male-ci").textContent = formatCi(male.ci_low, male.ci_high);
  document.getElementById("gap-value").textContent = formatNumber(gap.abs_gap, 3);
  document.getElementById("gdc-value").textContent = formatNumber(gdc.GDC, 1);
  document.getElementById("delta-f").textContent = formatSigned(gdc.delta_f);
  document.getElementById("delta-m").textContent = formatSigned(gdc.delta_m);

  const gapRank =
    state.genzGap
      .slice()
      .sort((a, b) => b.abs_gap - a.abs_gap)
      .findIndex((row) => row.welfare_regime === regime) + 1;
  const gdcRank =
    state.gdc
      .slice()
      .sort((a, b) => b.GDC - a.GDC)
      .findIndex((row) => row.welfare_regime === regime) + 1;

  document.getElementById("gap-rank").textContent = `${gapRank} of 4`;
  document.getElementById("gdc-rank").textContent = `${gdcRank} of 4`;
}

function render() {
  buildButtons();
  updateSummaryCards();
  if (window.applyGenzLanguage) {
    window.applyGenzLanguage(localStorage.getItem("sgc-genz-language") || "it", { silent: true });
  }
}

Promise.all([
  fetch("data/agg_means_galtan_by_regime_generation_gender.csv").then((response) => response.text()),
  fetch("data/genz_means_galtan_by_regime_gender.csv").then((response) => response.text()),
  fetch("data/genz_abs_gap_galtan_by_regime.csv").then((response) => response.text()),
  fetch("data/gdc_index_by_regime_millennials_to_genz.csv").then((response) => response.text()),
  fetch("data/gdc_cell_counts_millennials_genz_by_regime.csv").then((response) => response.text())
])
  .then(([aggMeans, genzMeans, genzGap, gdc, gdcCounts]) => {
    state.aggMeans = parseCsv(aggMeans);
    state.genzMeans = parseCsv(genzMeans);
    state.genzGap = parseCsv(genzGap);
    state.gdc = parseCsv(gdc);
    state.gdcCounts = parseCsv(gdcCounts);
    render();
  })
  .catch((error) => {
    console.error(error);
    document.getElementById("data-status").textContent =
      "The interactive regime cards could not load from the local CSV files.";
  });

const GENZ_TRANSLATIONS = [
  ["Primary", "Navigazione principale"],
  ["Left & right", "Sinistra e destra"],
  ["Values", "Valori"],
  ["Women's rights", "Diritti delle donne"],
  ["Four Europes", "Quattro Europe"],
  ["What explains it", "Cosa lo spiega"],
  ["References", "Riferimenti"],
  ["Full thesis PDF", "Tesi completa PDF"],
  ["GitHub repository", "Repository GitHub"],
  ["Public research companion", "Companion pubblico di ricerca"],
  ["How gendered political polarization looks inside Europe’s Gen Z", "Come appare la polarizzazione politica di genere nella Gen Z europea"],
  ["A public, English-language companion to my master’s thesis on the new cultural divide between young women and young men across the EU27.", "Una versione pubblica della mia tesi magistrale sulla nuova frattura culturale tra giovani donne e giovani uomini nei 27 paesi UE."],
  ["Every chart below is an interactive version of a thesis figure: hover to read exact values and 95% confidence intervals, click a legend entry to hide a series, or use the mode bar to zoom and download a PNG.", "Ogni grafico qui sotto è una versione interattiva di una figura della tesi: passa il mouse per leggere valori esatti e intervalli di confidenza al 95%, clicca una voce della legenda per nascondere una serie oppure usa la barra del grafico per zoomare e scaricare un PNG."],
  ["Start with the key finding", "Parti dal risultato chiave"],
  ["Read the full thesis", "Leggi la tesi completa"],
  ["Open GitHub repo", "Apri repo GitHub"],
  ["The main claim", "La tesi principale"],
  ["The strongest gendered political divergence inside Gen Z is not captured best by a broad left–right label, but by a cultural axis centered on postmaterialist versus traditional values.", "La divergenza politica di genere più forte nella Gen Z non si coglie al meglio con la semplice etichetta sinistra-destra, ma con un asse culturale centrato su valori postmaterialisti contro valori tradizionali."],
  ["The gap is not only about whether young women and young men end up in different ideological places. It is also about whether their generational trajectories move apart, and where in Europe that separation becomes most visible.", "Il divario non riguarda solo il fatto che giovani donne e giovani uomini finiscano in posizioni ideologiche diverse. Riguarda anche se le loro traiettorie generazionali si separano, e dove in Europa questa separazione diventa più visibile."],
  ["The gap is not only about whether young women and young men end up in different ideological places. It is also about whether their generational trajectories move", "Il divario non riguarda solo il fatto che giovani donne e giovani uomini finiscano in posizioni ideologiche diverse. Riguarda anche se le loro traiettorie generazionali si"],
  ["apart", "separano"],
  [", and where in Europe that separation becomes most visible.", ", e dove in Europa questa separazione diventa più visibile."],
  ["Where young Europeans stand on left and right", "Dove si collocano i giovani europei tra sinistra e destra"],
  ["The classic political axis. For each generation, the average party position of respondents (female vs male) on the CHES left–right scale, where higher values mean placement toward the right. This is the dimension most often discussed when people talk about “young men turning conservative”.", "L'asse politico classico. Per ogni generazione, la posizione media del partito scelto dagli intervistati (donne vs uomini) sulla scala sinistra-destra CHES, dove valori più alti indicano una collocazione più a destra. È la dimensione più citata quando si parla di giovani uomini che diventano conservatori."],
  ["Left–Right ideology by generation and gender", "Ideologia sinistra-destra per generazione e genere"],
  ["The left–right gender gap, generation by generation", "Il divario di genere sinistra-destra, generazione per generazione"],
  ["Left–right ideology by year of birth", "Ideologia sinistra-destra per anno di nascita"],
  ["The left–right gender gap by year of birth", "Il divario di genere sinistra-destra per anno di nascita"],
  ["The real fault line: postmaterialist vs traditional values", "La vera linea di frattura: valori postmaterialisti vs tradizionali"],
  ["The thesis argues that the sharpest gendered divide inside Gen Z is not on left–right, but on the cultural axis that runs from postmaterialist values (environment, minority rights, civil liberties) to traditional values (order, authority, traditional morality). Here higher values mean more traditional, lower values more postmaterialist.", "La tesi sostiene che la frattura di genere più netta nella Gen Z non sia sull'asse sinistra-destra, ma sull'asse culturale che va dai valori postmaterialisti (ambiente, diritti delle minoranze, libertà civili) ai valori tradizionali (ordine, autorità, moralità tradizionale). Qui valori più alti indicano posizioni più tradizionali, valori più bassi più postmaterialiste."],
  ["The thesis argues that the sharpest gendered divide inside Gen Z is", "La tesi sostiene che la frattura di genere più netta nella Gen Z"],
  ["on left–right, but on the cultural axis that runs from postmaterialist values (environment, minority rights, civil liberties) to traditional values (order, authority, traditional morality). Here higher values mean more traditional, lower values more postmaterialist.", "sia sull'asse sinistra-destra, ma sull'asse culturale che va dai valori postmaterialisti (ambiente, diritti delle minoranze, libertà civili) ai valori tradizionali (ordine, autorità, moralità tradizionale). Qui valori più alti indicano posizioni più tradizionali, valori più bassi più postmaterialiste."],
  ["Postmaterialist–Traditional values by generation and gender", "Valori postmaterialisti-tradizionali per generazione e genere"],
  ["The cultural-values gender gap, generation by generation", "Il divario di genere sui valori culturali, generazione per generazione"],
  ["Cultural values by year of birth", "Valori culturali per anno di nascita"],
  ["The cultural-values gender gap by year of birth", "Il divario di genere sui valori culturali per anno di nascita"],
  ["Women’s rights: a generational flip", "Diritti delle donne: un rovesciamento generazionale"],
  ["The CHES women’s-rights item measures how supportive a party is of expanding women’s rights. Lower values mean more supportive, higher values less supportive.", "L'item CHES sui diritti delle donne misura quanto un partito sostiene l'espansione dei diritti delle donne. Valori più bassi indicano maggiore sostegno, valori più alti minore sostegno."],
  ["Support for women’s rights by generation and gender", "Sostegno ai diritti delle donne per generazione e genere"],
  ["The women’s-rights gender gap, generation by generation", "Il divario di genere sui diritti delle donne, generazione per generazione"],
  ["Support for women’s rights by year of birth", "Sostegno ai diritti delle donne per anno di nascita"],
  ["The women’s-rights gender gap by year of birth", "Il divario di genere sui diritti delle donne per anno di nascita"],
  ["Who ends up at the political extremes", "Chi finisce agli estremi politici"],
  ["Averages can hide polarization: a generation can have a centrist mean while being internally split between two poles. Here respondents are re-classified as strongly progressive (CHES ≤ 2.5) or strongly traditional (CHES ≥ 7.5) on the postmaterialist–traditional axis. We first look at how many people sit at either pole in each generation, then split the picture by gender, and finally track how the balance moves across generational transitions.", "Le medie possono nascondere la polarizzazione: una generazione può avere una media centrista ma essere internamente divisa tra due poli. Qui gli intervistati sono riclassificati come fortemente progressisti (CHES ≤ 2,5) o fortemente tradizionali (CHES ≥ 7,5) sull'asse postmaterialista-tradizionale. Prima osserviamo quante persone si collocano ai poli in ogni generazione, poi separiamo per genere e infine seguiamo come cambia l'equilibrio tra transizioni generazionali."],
  ["Averages can hide polarization: a generation can have a centrist mean while being internally split between two poles. Here respondents are re-classified as", "Le medie possono nascondere la polarizzazione: una generazione può avere una media centrista ma essere internamente divisa tra due poli. Qui gli intervistati sono riclassificati come"],
  ["How many young Europeans actually sit at the poles", "Quanti giovani europei si collocano davvero ai poli"],
  ["Strongly progressive vs strongly traditional, by gender", "Fortemente progressisti vs fortemente tradizionali, per genere"],
  ["Gender Divergence in Change (GDC) index", "Indice Gender Divergence in Change (GDC)"],
  ["The gap is not equally wide everywhere. Four welfare–regime families — Social Democratic, Conservative, Mediterranean and Post-Socialist — tell four different stories about where young women and young men are actually landing. Pick a regime to see its own generational trajectory, then compare across regimes in the charts below.", "Il divario non è ugualmente ampio ovunque. Quattro famiglie di regime di welfare — Social Democratic, Conservative, Mediterranean e Post-Socialist — raccontano quattro storie diverse su dove si collocano giovani donne e giovani uomini. Scegli un regime per vedere la sua traiettoria generazionale, poi confronta i regimi nei grafici sotto."],
  ["The gap is not equally wide everywhere. Four welfare–regime families —", "Il divario non è ugualmente ampio ovunque. Quattro famiglie di regime di welfare -"],
  ["and", "e"],
  ["— tell four different stories about where young women and young men are actually landing. Pick a regime to see its own generational trajectory, then compare across regimes in the charts below.", "- raccontano quattro storie diverse su dove si collocano davvero giovani donne e giovani uomini. Scegli un regime per vedere la sua traiettoria generazionale, poi confronta i regimi nei grafici sotto."],
  ["Selected regime:", "Regime selezionato:"],
  ["Values are read live from the harmonized EES, ESS and CHES exports used in the dissertation.", "I valori sono letti in tempo reale dagli export armonizzati EES, ESS e CHES usati nella tesi."],
  ["Welfare regimes as analytical contexts", "I regimi di welfare come contesti analitici"],
  ["Selected regime at a glance", "Regime selezionato in sintesi"],
  ["Countries", "Paesi"],
  ["Total regime sample", "Campione totale del regime"],
  ["Gen Z female mean", "Media donne Gen Z"],
  ["Gen Z male mean", "Media uomini Gen Z"],
  ["Female 95% CI", "IC 95% donne"],
  ["Male 95% CI", "IC 95% uomini"],
  ["Absolute gap", "Divario assoluto"],
  ["Regime sample", "Campione del regime"],
  ["GDC index", "Indice GDC"],
  ["Gap rank / GDC rank", "Rank gap / rank GDC"],
  ["Cultural values by generation and gender —", "Valori culturali per generazione e genere —"],
  ["Gen Z means by welfare regime", "Medie Gen Z per regime di welfare"],
  ["Absolute Gen Z gender gap by regime", "Divario di genere Gen Z assoluto per regime"],
  ["Gender Divergence in Change (GDC) index by regime", "Indice Gender Divergence in Change (GDC) per regime"],
  ["What explains the divide", "Cosa spiega la frattura"],
  ["Gen Z gender gap — standardized interaction effects", "Divario di genere Gen Z — effetti di interazione standardizzati"],
  ["Predictor", "Predittore"],
  ["Coeff", "Coeff."],
  ["Std. Err.", "Errore std."],
  ["p-value", "p-value"],
  ["Female (baseline gap)", "Donna (divario baseline)"],
  ["Economic difficulty", "Difficoltà economica"],
  ["Education", "Istruzione"],
  ["Place of residence", "Luogo di residenza"],
  ["Religious attendance", "Frequenza religiosa"],
  ["Parental origin", "Origine dei genitori"],
  ["Highlighted rows are statistically significant (p < 0.05).", "Le righe evidenziate sono statisticamente significative (p < 0,05)."],
  ["Method in brief", "Metodo in breve"],
  ["APA references", "Riferimenti APA"],
  ["Policy relevance", "Rilevanza per le politiche pubbliche"],
  ["What it means", "Cosa significa"],
  ["How to read it", "Come leggerlo"],
  ["For the Silent Generation and Baby Boomers the two gender lines are almost on top of each other. Starting with Gen X and even more with Millennials they begin to separate, and with Gen Z the gap widens sharply: young women drift to the left while young men remain noticeably to the right.", "Per Silent Generation e Baby Boomers le due linee di genere sono quasi sovrapposte. Da Gen X, e ancora di più dai Millennials, iniziano a separarsi; con la Gen Z il divario si allarga nettamente: le giovani donne si spostano a sinistra mentre i giovani uomini restano sensibilmente più a destra."],
  ["Mean CHES left–right position, Female (red) vs Male (blue), by generation, with 95% CI ribbons. Pooled EU27, n = 36,082. Higher y = right, lower y = left.", "Posizione media CHES sinistra-destra, donne (rosso) vs uomini (blu), per generazione, con bande di IC al 95%. UE27 aggregata, n = 36.082. Y più alto = destra, y più basso = sinistra."],
  ["The Gen Z bar is about", "La barra della Gen Z è circa"],
  ["1.8× the Millennial one", "1,8 volte quella dei Millennials"],
  [". A left–right gap has always existed, but it has become clearly larger with the youngest cohort rather than stabilising.", ". Un divario sinistra-destra è sempre esistito, ma con la coorte più giovane diventa chiaramente più ampio invece di stabilizzarsi."],
  ["Bar height = absolute gap |Female − Male| in mean left–right position, per generation. The dashed line is an anchored exponential fit, for visual guidance only.", "Altezza della barra = divario assoluto |donne − uomini| nella posizione media sinistra-destra, per generazione. La linea tratteggiata è un adattamento esponenziale ancorato, solo come guida visiva."],
  ["The same picture at higher resolution: the two lines move together for respondents born before the late 1980s, then split after about 1990. That is the point the thesis identifies as the emergence of a", "La stessa immagine a risoluzione più alta: le due linee si muovono insieme per gli intervistati nati prima della fine degli anni Ottanta, poi si separano dopo circa il 1990. È il punto che la tesi identifica come l'emergere di un divario di genere"],
  ["modern", "moderno"],
  ["gender gap, following Inglehart & Norris (2000) and Giger (2009).", ", seguendo Inglehart & Norris (2000) e Giger (2009)."],
  ["Smoothed mean left–right position by year of birth, female vs male, with centered five-year rolling windows and 95% CI ribbons. Higher y = right.", "Posizione media sinistra-destra smussata per anno di nascita, donne vs uomini, con finestre mobili centrate di cinque anni e IC al 95%. Y più alto = destra."],
  ["From the 1950s cohorts to the late 1980s the gap stays under about 0.3 points — a period Giger calls “gender dealignment”. From roughly 1990 onwards the curve bends upward: this is the signature of the modern gender gap.", "Dalle coorti degli anni Cinquanta alla fine degli anni Ottanta il divario resta sotto circa 0,3 punti, una fase che Giger chiama “gender dealignment”. Da circa il 1990 in poi la curva piega verso l'alto: è la firma del divario di genere moderno."],
  ["Absolute gap |Female − Male| in mean left–right position by year of birth, with loess-smoothed trend. Larger y = wider gap.", "Divario assoluto |donne − uomini| nella posizione media sinistra-destra per anno di nascita, con trend smussato loess. Y più alto = divario più ampio."],
  ["Two trajectories moving in opposite directions. Women become progressively more postmaterialist as we move from older to younger generations: Gen Z women are more progressive than Millennial women, who are in turn more progressive than Gen X women. Men do not follow the same path: Gen Z men reverse the previous male trend and swing back toward the traditional pole. This is what the thesis calls the “flip” that produces a cultural divide rather than a simple generational shift.", "Due traiettorie che si muovono in direzioni opposte. Le donne diventano progressivamente più postmaterialiste passando dalle generazioni più anziane a quelle più giovani: le donne Gen Z sono più progressiste delle donne Millennial, che a loro volta sono più progressiste delle donne Gen X. Gli uomini non seguono lo stesso percorso: gli uomini Gen Z invertono la tendenza maschile precedente e tornano verso il polo tradizionale. È il “flip” che, nella tesi, produce una frattura culturale più che un semplice spostamento generazionale."],
  ["Mean CHES GAL–TAN position, Female (red) vs Male (blue), by generation, with 95% CI ribbons. Higher y = more traditional; lower y = more postmaterialist.", "Posizione media CHES GAL-TAN, donne (rosso) vs uomini (blu), per generazione, con bande di IC al 95%. Y più alto = più tradizionale; y più basso = più postmaterialista."],
  ["This is where the divide is largest. The Gen Z bar is about", "Qui la frattura è più ampia. La barra della Gen Z è circa"],
  ["2.1× the Millennial one", "2,1 volte quella dei Millennials"],
  [", roughly three times the Gen X gap, and more than five times the Baby Boomer gap. Across the three dimensions examined in the thesis, the cultural axis is where the generational growth of the gender gap is most striking.", ", circa tre volte il divario della Gen X e più di cinque volte quello dei Baby Boomers. Tra le tre dimensioni esaminate nella tesi, l'asse culturale è quello in cui la crescita generazionale del divario di genere è più evidente."],
  ["Bar height = absolute gap |Female − Male| in GAL–TAN means, per generation.", "Altezza della barra = divario assoluto |donne − uomini| nelle medie GAL-TAN, per generazione."],
  ["For cohorts born up to the late 1980s the two lines essentially overlap. From 1990 onwards the female line bends downward (more postmaterialist) while the male line bends upward (more traditional): the two trajectories diverge like a pair of scissors opening.", "Per le coorti nate fino alla fine degli anni Ottanta le due linee sostanzialmente si sovrappongono. Dal 1990 in poi la linea femminile piega verso il basso (più postmaterialista) mentre quella maschile piega verso l'alto (più tradizionale): le due traiettorie divergono come forbici che si aprono."],
  ["Smoothed GAL–TAN means by year of birth, female vs male, centered five-year rolling windows with 95% CI ribbons. Higher y = more traditional.", "Medie GAL-TAN smussate per anno di nascita, donne vs uomini, con finestre mobili centrate di cinque anni e IC al 95%. Y più alto = più tradizionale."],
  ["The smoothed curve stays close to zero through most of the 20th century and lifts off only for cohorts born in the 1990s and 2000s. The thesis takeaway: if you want to see where a new cultural divide is forming, look here first.", "La curva smussata resta vicina allo zero per gran parte del Novecento e decolla solo per le coorti nate negli anni Novanta e Duemila. Lettura della tesi: se vuoi vedere dove si sta formando una nuova frattura culturale, guarda prima qui."],
  ["Absolute gap |Female − Male| in GAL–TAN means by year of birth, with loess-smoothed trend. Larger y = wider cultural-values gap.", "Divario assoluto |donne − uomini| nelle medie GAL-TAN per anno di nascita, con trend smussato loess. Y più alto = divario sui valori culturali più ampio."],
  ["Across older generations the male and female lines move almost in parallel. With Gen Z the balance is broken: young men drop in support for women’s rights while young women pull in the opposite direction.", "Nelle generazioni più anziane le linee maschile e femminile si muovono quasi in parallelo. Con la Gen Z l'equilibrio si rompe: i giovani uomini calano nel sostegno ai diritti delle donne mentre le giovani donne si muovono nella direzione opposta."],
  ["Mean party position on the CHES women’s-rights item, female vs male, by generation, with 95% CI ribbons. Lower y = more supportive of women’s rights; higher y = less supportive.", "Posizione media del partito sull'item CHES sui diritti delle donne, donne vs uomini, per generazione, con bande di IC al 95%. Y più basso = più sostegno ai diritti delle donne; y più alto = meno sostegno."],
  ["The gap between young women and young men on women’s rights is about", "Il divario tra giovani donne e giovani uomini sui diritti delle donne è circa"],
  ["2.5×", "2,5 volte"],
  ["larger for Gen Z than for Millennials. Together with the cultural-values panel above, this is what makes the Gen Z divide qualitatively different, not just “more of the same”.", "più grande nella Gen Z che tra i Millennials. Insieme al pannello sui valori culturali, è questo che rende la frattura Gen Z qualitativamente diversa, non solo “più della stessa cosa”."],
  ["Bar height = absolute gap |Female − Male| in women’s-rights means, per generation.", "Altezza della barra = divario assoluto |donne − uomini| nelle medie sui diritti delle donne, per generazione."],
  ["The smoothed curves are remarkably flat until about birth year 1990. Then the male line begins to climb (less supportive) while the female line bends down (more supportive). The break is visible to the naked eye.", "Le curve smussate sono notevolmente piatte fino a circa l'anno di nascita 1990. Poi la linea maschile inizia a salire (meno sostegno) mentre quella femminile scende (più sostegno). La rottura è visibile a occhio nudo."],
  ["Smoothed women’s-rights means by year of birth, female vs male, centered five-year rolling windows with 95% CI ribbons. Lower y = more supportive of women’s rights.", "Medie sui diritti delle donne smussate per anno di nascita, donne vs uomini, con finestre mobili centrate di cinque anni e IC al 95%. Y più basso = più sostegno ai diritti delle donne."],
  ["Left–right, cultural values, and women’s rights all tell the same story: a stable low gap for cohorts born before 1990, then a rapid opening. It is the convergence of evidence across dimensions that makes the thesis treat this as a real cleavage rather than a statistical artefact.", "Sinistra-destra, valori culturali e diritti delle donne raccontano la stessa storia: un divario basso e stabile per le coorti nate prima del 1990, poi un'apertura rapida. È la convergenza delle evidenze tra dimensioni che porta la tesi a trattarla come una frattura reale, non come un artefatto statistico."],
  ["Absolute gap |Female − Male| in women’s-rights means by year of birth, with loess-smoothed trend. Larger y = wider gap.", "Divario assoluto |donne − uomini| nelle medie sui diritti delle donne per anno di nascita, con trend smussato loess. Y più alto = divario più ampio."],
  ["strongly progressive", "fortemente progressisti"],
  ["strongly traditional", "fortemente tradizionali"],
  ["(CHES ≤ 2.5) or", "(CHES ≤ 2,5) oppure"],
  ["(CHES ≥ 7.5) on the postmaterialist–traditional axis. We first look at how many people sit at either pole in each generation, then split the picture by gender, and finally track how the balance moves across generational transitions.", "(CHES ≥ 7,5) sull'asse postmaterialista-tradizionale. Prima osserviamo quante persone si collocano ai due poli in ogni generazione, poi separiamo il quadro per genere e infine seguiamo come cambia l'equilibrio nelle transizioni generazionali."],
  ["The share of respondents whose preferred party sits at one of the two cultural extremes climbs almost linearly with each new generation: from about 31% among the Silent Generation to roughly 50% in Gen Z. Half of Gen Z is choosing parties that experts code as either strongly progressive or strongly traditional — the centre is no longer where most young Europeans land.", "La quota di intervistati il cui partito preferito si colloca in uno dei due estremi culturali cresce quasi linearmente con ogni nuova generazione: da circa il 31% nella Silent Generation a circa il 50% nella Gen Z. Metà della Gen Z sceglie partiti che gli esperti codificano come fortemente progressisti o fortemente tradizionali: il centro non è più il luogo in cui si colloca la maggior parte dei giovani europei."],
  ["One dot per generation. The y-value is the combined share of respondents whose linked party scores ≤ 2.5 (strongly progressive) or ≥ 7.5 (strongly traditional) on the CHES postmaterialist–traditional scale. Pooled EU27, n ≈ 36,300. Genders are aggregated here.", "Un punto per generazione. Il valore y è la quota combinata di intervistati il cui partito collegato ottiene ≤ 2,5 (fortemente progressista) oppure ≥ 7,5 (fortemente tradizionale) sulla scala CHES postmaterialista-tradizionale. UE27 aggregata, n ≈ 36.300. Qui i generi sono aggregati."],
  ["Splitting the same data by gender shows where the symmetry breaks. Up to the Millennials, women and men move in lockstep on both poles. In Gen Z the lines cross: the share of women on the strongly progressive pole jumps to about 25% while their traditional share stays flat; men do the opposite — their progressive share stalls at 22% and their traditional share rises to 28%. That asymmetry is what the rest of the section unpacks.", "Separare gli stessi dati per genere mostra dove si rompe la simmetria. Fino ai Millennials, donne e uomini si muovono insieme su entrambi i poli. Nella Gen Z le linee si incrociano: la quota di donne nel polo fortemente progressista sale a circa il 25% mentre la quota tradizionale resta piatta; gli uomini fanno l'opposto, con la quota progressista ferma al 22% e quella tradizionale che sale al 28%. È questa asimmetria che il resto della sezione analizza."],
  ["Four lines per generation. Light purple = strongly progressive (CHES ≤ 2.5), dark purple = strongly traditional (CHES ≥ 7.5). Solid = women, dashed = men. Each y-value is the share within that generation × gender cell. Pooled EU27.", "Quattro linee per generazione. Viola chiaro = fortemente progressisti (CHES ≤ 2,5), viola scuro = fortemente tradizionali (CHES ≥ 7,5). Linea continua = donne, tratteggiata = uomini. Ogni valore y è la quota nella cella generazione × genere. UE27 aggregata."],
  ["Each dot is one generational transition: how much a new generation shifts the balance between progressive and traditional extremes, in percentage points. Women (red) and men (blue) broadly moved in the same direction until Gen X, both becoming much more progressive in the Gen X → Millennials step. In the Millennials → Gen Z step the two lines diverge sharply: women stay in progressive territory, men swing back toward the traditional pole. The green vertical segments show the size of that gap at each transition.", "Ogni punto è una transizione generazionale: quanto una nuova generazione sposta l'equilibrio tra estremi progressisti e tradizionali, in punti percentuali. Donne (rosso) e uomini (blu) si sono mossi in generale nella stessa direzione fino alla Gen X, diventando entrambi molto più progressisti nel passaggio Gen X → Millennials. Nel passaggio Millennials → Gen Z le due linee divergono nettamente: le donne restano in territorio progressista, gli uomini tornano verso il polo tradizionale. I segmenti verticali verdi mostrano l'ampiezza del divario a ogni transizione."],
  ["Each dot = change in the progressive−traditional balance (% strongly progressive − % strongly traditional) across one generational transition, in percentage points. Red = female shift, blue = male shift, green segment = |female shift − male shift|. Pooled EU27.", "Ogni punto = variazione dell'equilibrio progressisti−tradizionali (% fortemente progressisti − % fortemente tradizionali) lungo una transizione generazionale, in punti percentuali. Rosso = spostamento femminile, blu = spostamento maschile, segmento verde = |spostamento femminile − spostamento maschile|. UE27 aggregata."],
  ["The GDC index condenses the previous chart into a single number per transition: the absolute distance between the female and male generational shifts. The Millennials → Gen Z bar stands out:", "L'indice GDC condensa il grafico precedente in un solo numero per transizione: la distanza assoluta tra gli spostamenti generazionali femminili e maschili. La barra Millennials → Gen Z spicca:"],
  ["9.2 percentage points", "9,2 punti percentuali"],
  [", against 0.6 for the immediately preceding Gen X → Millennials transition. That is an order of magnitude larger than any other generational step measured here.", ", contro 0,6 nella transizione immediatamente precedente Gen X → Millennials. È un ordine di grandezza superiore a qualunque altro passaggio generazionale misurato qui."],
  ["Each bar = GDC index for one generational transition, where GDC = |female change − male change| in percentage points. Taller bar = more divergent female vs male generational movement. Pooled EU27.", "Ogni barra = indice GDC per una transizione generazionale, dove GDC = |variazione femminile − variazione maschile| in punti percentuali. Una barra più alta indica un movimento generazionale più divergente tra donne e uomini. UE27 aggregata."],
  ["Europe is not a single case. Each of the four regime families has its own distinctive mix of gender norms, labour-market structures, family policies and party systems, so it is plausible that a gendered Gen Z divide shows up differently in each. That is exactly what the charts below reveal — same generation, four different gender stories.", "L'Europa non è un caso unico. Ognuna delle quattro famiglie di regime ha un proprio mix di norme di genere, strutture del mercato del lavoro, politiche familiari e sistemi di partito; è quindi plausibile che una frattura di genere nella Gen Z emerga in modo diverso in ciascuna. È proprio quello che mostrano i grafici sotto: stessa generazione, quattro storie di genere diverse."],
  ["EU27 member states coloured by welfare-regime family:", "Stati membri UE27 colorati per famiglia di regime di welfare:"],
  ["(Nordic),", "(Nordici),"],
  ["(continental Western Europe),", "(Europa occidentale continentale),"],
  ["(southern Europe),", "(Europa meridionale),"],
  ["(Central and Eastern Europe). The grouping follows the standard welfare-state typology used in comparative research and does", "(Europa centrale e orientale). Il raggruppamento segue la tipologia standard di welfare state usata nella ricerca comparata e"],
  ["not", "non"],
  ["imply that countries inside a group are identical.", "implica che i paesi dentro un gruppo siano identici."],
  ["Mean GAL–TAN position for each generation in the selected regime, female (red) vs male (blue), with 95% CI ribbons. Higher y = more traditional; lower y = more postmaterialist. Click one of the regime buttons above to swap the chart. Sources: EES 2024, ESS 2023–2024, CHES 2024.", "Posizione media GAL-TAN per ogni generazione nel regime selezionato, donne (rosso) vs uomini (blu), con bande di IC al 95%. Y più alto = più tradizionale; y più basso = più postmaterialista. Clicca uno dei pulsanti di regime sopra per cambiare grafico. Fonti: EES 2024, ESS 2023-2024, CHES 2024."],
  ["Grouped bars: each regime has a red bar (Gen Z female mean) and a navy bar (Gen Z male mean) on the GAL–TAN scale. Hover a bar for the exact value. Higher bar = that group is more traditional on average.", "Barre raggruppate: ogni regime ha una barra rossa (media donne Gen Z) e una blu scuro (media uomini Gen Z) sulla scala GAL-TAN. Passa sulla barra per leggere il valore esatto. Barra più alta = gruppo mediamente più tradizionale."],
  ["Bar height = |Female mean − Male mean| among Gen Z in that regime. Larger bar = wider gender split", "Altezza della barra = |media donne − media uomini| nella Gen Z di quel regime. Barra più alta = frattura di genere più ampia"],
  ["today", "oggi"],
  [", regardless of how the regime got there.", ", indipendentemente da come il regime ci sia arrivato."],
  ["Bar height = GDC index for the Millennials → Gen Z transition in that regime, in percentage points. GDC shifts attention from level differences to generational", "Altezza della barra = indice GDC per la transizione Millennials → Gen Z in quel regime, in punti percentuali. Il GDC sposta l'attenzione dalle differenze di livello al"],
  ["movement", "movimento"],
  [":", ":"],
  ["how differently", "quanto diversamente"],
  ["women and men change in the balance between progressive and traditional extremes. Taller bar = more divergent female vs male trajectory.", "cambiano donne e uomini nell'equilibrio tra estremi progressisti e tradizionali. Barra più alta = traiettoria femminile e maschile più divergente."],
  ["Once the gap is mapped, the thesis asks", "Una volta mappato il divario, la tesi chiede"],
  ["who", "chi"],
  ["inside Gen Z drives it. A standardized regression isolates how five individual-level factors — economic difficulty, education, place of residence, parental origin and religious attendance — reshape the gender gap on the cultural axis. The model is", "dentro la Gen Z lo produce. Una regressione standardizzata isola come cinque fattori individuali - difficoltà economica, istruzione, luogo di residenza, origine dei genitori e frequenza religiosa - rimodellano il divario di genere sull'asse culturale. Il modello è"],
  ["GAL–TAN ~ female + predictors(z) + female × predictors(z)", "GAL-TAN ~ donna + predittori(z) + donna × predittori(z)"],
  [": each interaction tells you how much one extra standard deviation of a predictor moves women relative to men.", ": ogni interazione indica quanto una deviazione standard in più di un predittore sposta le donne rispetto agli uomini."],
  ["Coefficients from y = CHES ~ female + predictors(z) + female × predictors(z).", "Coefficienti da y = CHES ~ donna + predittori(z) + donna × predittori(z)."],
  ["CI 2.5%", "IC 2,5%"],
  ["CI 97.5%", "IC 97,5%"],
  ["The first row sets the scene: holding everything else constant, young women in Gen Z sit", "La prima riga imposta il quadro: tenendo costante tutto il resto, le giovani donne Gen Z si collocano"],
  ["0.53 GAL–TAN points", "0,53 punti GAL-TAN"],
  ["to the postmaterialist side of young men (p < 0.001). The other rows tell you how that baseline gap", "più verso il lato postmaterialista rispetto ai giovani uomini (p < 0,001). Le altre righe mostrano come quel divario di base"],
  ["moves", "si muove"],
  ["when one specific predictor goes up by one standard deviation.", "quando uno specifico predittore aumenta di una deviazione standard."],
  ["Three factors move it in a statistically significant way.", "Tre fattori lo spostano in modo statisticamente significativo."],
  ["Economic difficulty widens the gap", "La difficoltà economica allarga il divario"],
  ["(−0.22, p = 0.019): when material hardship is higher, women drift further from men.", "(−0,22, p = 0,019): quando la difficoltà materiale è più alta, le donne si allontanano di più dagli uomini."],
  ["Religious attendance narrows it", "La frequenza religiosa lo restringe"],
  ["(+0.24, p = 0.011) and", "(+0,24, p = 0,011) e"],
  ["parental origin narrows it the most", "l'origine dei genitori lo restringe di più"],
  ["(+0.26, p = 0.005): more religiosity or a foreign-born parent pulls young women back closer to young men on the cultural axis.", "(+0,26, p = 0,005): più religiosità o un genitore nato all'estero riportano le giovani donne più vicine ai giovani uomini sull'asse culturale."],
  ["Education and place of residence are not significant", "Istruzione e luogo di residenza non sono significativi"],
  ["(p = 0.274 and p = 0.436). The takeaway matches the thesis: the modern divide is driven less by where people live or how long they studied, and more by the cultural and economic worlds Gen Z women and men actually inhabit.", "(p = 0,274 e p = 0,436). La lettura coincide con la tesi: la frattura moderna dipende meno da dove le persone vivono o da quanto hanno studiato, e più dai mondi culturali ed economici in cui donne e uomini Gen Z vivono concretamente."],
  ["Each row is one term in the regression.", "Ogni riga è un termine della regressione."],
  ["Coeff", "Coeff."],
  ["is the standardized estimate (in GAL–TAN units per one standard deviation of the predictor).", "è la stima standardizzata (in unità GAL-TAN per una deviazione standard del predittore)."],
  ["are the lower and upper bounds of the 95% confidence interval.", "sono il limite inferiore e superiore dell'intervallo di confidenza al 95%."],
  ["is the standard error of the coefficient.", "è l'errore standard del coefficiente."],
  ["reports the probability of seeing a coefficient that large under the null. A confidence interval that does not cross zero is statistically significant. Negative coefficients", "riporta la probabilità di osservare un coefficiente così grande sotto l'ipotesi nulla. Un intervallo di confidenza che non attraversa lo zero è statisticamente significativo. Coefficienti negativi"],
  ["widen", "allargano"],
  ["the female–male gap; positive coefficients", "il divario donne-uomini; coefficienti positivi"],
  ["narrow", "restringono"],
  ["it. Sources: EES 2024 + ESS 2023–2024 + CHES 2024, standardized regression on Gen Z respondents.", "il divario. Fonti: EES 2024 + ESS 2023-2024 + CHES 2024, regressione standardizzata sugli intervistati Gen Z."],
  ["The thesis harmonizes respondents from the European Social Survey (ESS, fieldwork 2023–2024) and the European Election Study (EES, fieldwork 2024) and links each respondent to the position of their supported party in the Chapel Hill Expert Survey (CHES, 2024). This produces consistent scores on three dimensions — left–right, postmaterialist–traditional, and support for women’s rights.", "La tesi armonizza gli intervistati della European Social Survey (ESS, fieldwork 2023-2024) e della European Election Study (EES, fieldwork 2024) e collega ogni intervistato alla posizione del partito sostenuto nella Chapel Hill Expert Survey (CHES, 2024). Questo produce punteggi coerenti su tre dimensioni: sinistra-destra, postmaterialista-tradizionale e sostegno ai diritti delle donne."],
  ["Year-of-birth trends are smoothed with centered five-year rolling windows to stabilise estimates. Generational categories run from the Silent Generation through Gen Z. Extreme party positions are trimmed to reduce outlier influence, and sensitivity checks confirm that substantive conclusions remain robust. Pooled EU27 sample, n ≈ 36,000 depending on the dimension.", "I trend per anno di nascita sono smussati con finestre mobili centrate di cinque anni per stabilizzare le stime. Le categorie generazionali vanno dalla Silent Generation alla Gen Z. Le posizioni di partito estreme sono tagliate per ridurre l'influenza degli outlier e i controlli di sensibilità confermano che le conclusioni sostanziali restano robuste. Campione UE27 aggregato, n ≈ 36.000 a seconda della dimensione."],
  ["The gender divide among young Europeans should not be read as young men and young women forming homogeneous political blocs. Rather, it points to different social, economic and cultural worlds in which political attitudes are formed.", "Il divario di genere tra giovani europei non va letto come se giovani uomini e giovani donne fossero blocchi politici omogenei. Indica piuttosto mondi sociali, economici e culturali diversi in cui si formano gli atteggiamenti politici."],
  ["This matters for civic education, youth policy, gender equality initiatives, third places, digital platforms and welfare policies addressing material insecurity.", "Questo è rilevante per educazione civica, politiche giovanili, parità di genere, spazi sociali, piattaforme digitali e politiche di welfare legate all'insicurezza materiale."],
  ["The figures and commentary on this page are based on the thesis itself, on the final analysis outputs, and on the data sources cited in the dissertation.", "I grafici e i commenti di questa pagina si basano sulla tesi, sugli output finali dell'analisi e sulle fonti dati citate nella dissertation."],
  ["This is the sharpest generational split in the whole regime picture. In Conservative Europe, young men stay planted on the traditional side of the cultural axis while young women pull clearly toward postmaterialist values — so the female line bends down while the male line barely moves.", "È la frattura generazionale più netta nell'intero quadro dei regimi. Nell'Europa conservatrice, i giovani uomini restano sul lato tradizionale dell'asse culturale mentre le giovani donne si spostano chiaramente verso valori postmaterialisti: la linea femminile scende mentre quella maschile si muove appena."],
  ["Looking only at Gen Z, the Conservative gap is wide enough to be read at a glance, but it is not the widest bar in the figure. The point is the combination: a solid gap today plus the largest generational divergence out of the four regimes.", "Guardando solo alla Gen Z, il divario conservatore è abbastanza ampio da essere letto a colpo d'occhio, ma non è la barra più alta della figura. Il punto è la combinazione: un divario solido oggi più la maggiore divergenza generazionale tra i quattro regimi."],
  ["The absolute Gen Z gap in Conservative Europe is sizeable even before bringing generations into the picture: young women and young men are already living in two different parts of the cultural space.", "Il divario assoluto Gen Z nell'Europa conservatrice è consistente anche prima di introdurre la dimensione generazionale: giovani donne e giovani uomini abitano già due parti diverse dello spazio culturale."],
  ["The GDC peaks here. The transition from Millennials to Gen Z is not only big, it is strongly gendered: women and men move in opposite directions rather than together.", "Qui il GDC raggiunge il massimo. La transizione dai Millennials alla Gen Z non è solo ampia, è fortemente di genere: donne e uomini si muovono in direzioni opposte invece che insieme."],
  ["Mediterranean Europe also splits its young generation by gender, but more quietly. The female and male trajectories move apart from Millennials onward without the dramatic hinge you see in the Conservative cluster.", "Anche l'Europa mediterranea divide la sua generazione giovane per genere, ma in modo più contenuto. Le traiettorie femminili e maschili si separano dai Millennials in avanti senza la cerniera drammatica osservata nel cluster conservatore."],
  ["Gen Z still splits into two clearly different bars, yet the Mediterranean cluster is not defined by unusually high traditionalism. The story here is the persistence of the gap in a setting people often describe through delayed adulthood and family-based welfare.", "La Gen Z si divide comunque in due barre chiaramente diverse, ma il cluster mediterraneo non è definito da un tradizionalismo eccezionalmente alto. Qui la storia è la persistenza del divario in un contesto spesso descritto attraverso transizione ritardata all'età adulta e welfare familiare."],
  ["The absolute Gen Z gap is comparable to the other clusters: young women and young men are landing in meaningfully different positions, even if the level of traditionalism is not extreme.", "Il divario assoluto Gen Z è comparabile agli altri cluster: giovani donne e giovani uomini arrivano a posizioni significativamente diverse, anche se il livello di tradizionalismo non è estremo."],
  ["The GDC here is moderate: there is divergence in how women and men shift from Millennials to Gen Z, but it is less sharp than in Conservative or Post-Socialist Europe.", "Qui il GDC è moderato: esiste divergenza nel modo in cui donne e uomini si spostano dai Millennials alla Gen Z, ma è meno netta che nell'Europa conservatrice o post-socialista."],
  ["Post-Socialist Europe is the most traditional cluster overall. Both young women and young men score high on the cultural axis, and young men reach the highest male mean in the whole comparison — the gender split happens on top of an already conservative baseline.", "L'Europa post-socialista è il cluster complessivamente più tradizionale. Giovani donne e giovani uomini hanno entrambi punteggi alti sull'asse culturale, e i giovani uomini raggiungono la media maschile più alta dell'intero confronto: la frattura di genere si aggiunge a una baseline già conservatrice."],
  ["The Gen Z bars here are the tallest among the four regimes for men, and the split between women and men is clearly visible. This combination — traditional baseline plus gender gap — is what makes Post-Socialist Europe central to the thesis argument.", "Le barre Gen Z qui sono le più alte tra i quattro regimi per gli uomini, e la frattura tra donne e uomini è chiaramente visibile. Questa combinazione - baseline tradizionale più divario di genere - rende l'Europa post-socialista centrale nell'argomento della tesi."],
  ["The absolute gap is not the largest bar in the figure, but it layers on top of the most traditional positioning of the whole regime comparison. That is what matters analytically.", "Il divario assoluto non è la barra più alta della figura, ma si sovrappone alla collocazione più tradizionale di tutto il confronto tra regimi. È questo che conta analiticamente."],
  ["The GDC is also very high here: the move from Millennials to Gen Z is strongly gendered rather than a uniform conservative drift shared by both sexes.", "Anche qui il GDC è molto alto: il passaggio dai Millennials alla Gen Z è fortemente di genere, non una deriva conservatrice uniforme condivisa da entrambi i sessi."],
  ["The Nordic cluster still shows a visible gender split among Gen Z, but the female and male trajectories stay closer together across generations than in the Conservative and Post-Socialist cases.", "Il cluster nordico mostra ancora una frattura di genere visibile nella Gen Z, ma le traiettorie femminili e maschili restano più vicine tra le generazioni rispetto ai casi conservatore e post-socialista."],
  ["Even in the regime with the smallest generational divergence, Gen Z women and men do not fully converge: their bars are close, but they are not on top of each other.", "Anche nel regime con la minore divergenza generazionale, donne e uomini Gen Z non convergono del tutto: le barre sono vicine, ma non sovrapposte."],
  ["The level gap remains meaningful here too. The lowest GDC in the comparison should not be read as the absence of polarization, only as a less explosive generational change.", "Anche qui il divario di livello resta significativo. Il GDC più basso del confronto non va letto come assenza di polarizzazione, ma come cambiamento generazionale meno esplosivo."],
  ["This is the smallest GDC in the four regimes: the split exists, but it grows less explosively from Millennials to Gen Z than elsewhere in Europe.", "È il GDC più basso tra i quattro regimi: la frattura esiste, ma cresce in modo meno esplosivo dai Millennials alla Gen Z rispetto ad altre aree d'Europa."],
  ["Preparing interactive chart…", "Preparazione grafico interattivo…"],
  ["Companion site for Masculinities, Feminist Mobilization and the New Cultural Divide (Ghezzi Colombo, 2025).", "Sito companion per Masculinities, Feminist Mobilization and the New Cultural Divide (Ghezzi Colombo, 2025)."],
  ["All rights reserved.", "Tutti i diritti riservati."],
  ["A public, English-language companion to Simone Ghezzi Colombo's thesis on the new cultural divide between young women and young men in Europe, with interactive figures.", "Companion pubblico della tesi di Simone Ghezzi Colombo sulla nuova frattura culturale tra giovani donne e giovani uomini in Europa, con figure interattive."]
];

function initLanguageToggle() {
  const toIt = new Map(GENZ_TRANSLATIONS.map(([en, it]) => [en, it]));
  const toEn = new Map(GENZ_TRANSLATIONS.map(([en, it]) => [it, en]));

  window.applyGenzLanguage = function applyGenzLanguage(lang, options = {}) {
    const map = lang === "it" ? toIt : toEn;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const value = node.nodeValue;
      const trimmed = value.trim();
      const replacement = map.get(trimmed);
      if (replacement) node.nodeValue = value.replace(trimmed, replacement);
    });

    document.querySelectorAll("[aria-label], [title], [content]").forEach((element) => {
      ["aria-label", "title", "content"].forEach((attr) => {
        const value = element.getAttribute(attr);
        if (value && map.has(value)) element.setAttribute(attr, map.get(value));
      });
    });

    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.langToggle === lang));
    });
    if (!options.silent) localStorage.setItem("sgc-genz-language", lang);
  };

  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => window.applyGenzLanguage(button.dataset.langToggle));
  });
  window.applyGenzLanguage(localStorage.getItem("sgc-genz-language") || "it", { silent: true });
}

window.addEventListener("DOMContentLoaded", initLanguageToggle);
