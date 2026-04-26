const regimes = ["Conservative", "Mediterranean", "Post-Socialist", "Social Democratic"];

const regimeMeta = {
  "Conservative": {
    color: "#1F3552",
    countries: "Austria, Belgium, Germany, France, Luxembourg, Netherlands, Ireland",
    evolutionFile: "data/interactive/phase3/fig_p3_evolution_conservative.json",
    evolutionComment:
      "This is the sharpest generational split in the whole regime picture. In Conservative Europe, young men stay planted on the traditional side of the cultural axis while young women pull clearly toward postmaterialist values \u2014 so the female line bends down while the male line barely moves.",
    groupedComment:
      "Looking only at Gen Z, the Conservative gap is wide enough to be read at a glance, but it is not the widest bar in the figure. The point is the combination: a solid gap today <em>plus</em> the largest generational divergence out of the four regimes.",
    gapComment:
      "The absolute Gen Z gap in Conservative Europe is sizeable even before bringing generations into the picture: young women and young men are already living in two different parts of the cultural space.",
    gdcComment:
      "The GDC peaks here. The transition from Millennials to Gen Z is not only big, it is strongly <em>gendered</em>: women and men move in opposite directions rather than together."
  },
  "Mediterranean": {
    color: "#E67E22",
    countries: "Cyprus, Spain, Greece, Italy, Malta, Portugal",
    evolutionFile: "data/interactive/phase3/fig_p3_evolution_mediterranean.json",
    evolutionComment:
      "Mediterranean Europe also splits its young generation by gender, but more quietly. The female and male trajectories move apart from Millennials onward without the dramatic hinge you see in the Conservative cluster.",
    groupedComment:
      "Gen Z still splits into two clearly different bars, yet the Mediterranean cluster is not defined by unusually high traditionalism. The story here is the <em>persistence</em> of the gap in a setting people often describe through delayed adulthood and family-based welfare.",
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
      "Post-Socialist Europe is the most traditional cluster overall. Both young women and young men score high on the cultural axis, and young men reach the <em>highest</em> male mean in the whole comparison \u2014 the gender split happens on top of an already conservative baseline.",
    groupedComment:
      "The Gen Z bars here are the tallest among the four regimes for men, and the split between women and men is clearly visible. This combination \u2014 traditional baseline plus gender gap \u2014 is what makes Post-Socialist Europe central to the thesis argument.",
    gapComment:
      "The absolute gap is not the largest bar in the figure, but it layers on top of the most traditional positioning of the whole regime comparison. That is what matters analytically.",
    gdcComment:
      "The GDC is also very high here: the move from Millennials to Gen Z is strongly <em>gendered</em> rather than a uniform conservative drift shared by both sexes."
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
      "The <em>level</em> gap remains meaningful here too. The lowest GDC in the comparison should not be read as the absence of polarization, only as a less explosive generational change.",
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
