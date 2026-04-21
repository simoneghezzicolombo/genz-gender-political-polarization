const regimes = ["Conservative", "Mediterranean", "Post-Socialist", "Social Democratic"];

const regimeMeta = {
  "Conservative": {
    color: "#1F3552",
    countries: "Austria, Belgium, Germany, France, Luxembourg, Netherlands, Ireland",
    evolutionFile: "assets/figures/evolution_galtan_Conservative.svg",
    evolutionComment:
      "This is the sharpest case of divergence in the regime analysis: Gen Z men remain distinctly higher on the traditional side of the scale, while the female trajectory trends lower.",
    groupedComment:
      "The grouped bars make the Conservative spread immediately readable: the distance is not the largest absolute gap in the figure, but it sits inside the regime where generational divergence is strongest.",
    gapComment:
      "The absolute Gen Z gap is large and visible even before looking at generational change. In substantive terms, young women and young men are already landing in different parts of the cultural space.",
    gdcComment:
      "The GDC index peaks here. That means the transition from Millennials to Gen Z unfolds differently for women and men, not just that their final Gen Z averages are far apart."
  },
  "Mediterranean": {
    color: "#E67E22",
    countries: "Cyprus, Spain, Greece, Italy, Malta, Portugal",
    evolutionFile: "assets/figures/evolution_galtan_Mediterranean.svg",
    evolutionComment:
      "The Mediterranean pattern is still clearly gendered, but the movement from Millennials to Gen Z is less dramatic than in the Conservative and Post-Socialist clusters.",
    groupedComment:
      "The grouped bars show a visible split in Gen Z, but also remind us that Mediterranean Europe does not stand apart because of exceptionally high average traditionalism.",
    gapComment:
      "The absolute gap remains substantial. The key point is not exceptionality, but persistence: the divide survives even in a regime cluster often described through delayed youth transitions and familistic welfare arrangements.",
    gdcComment:
      "Here the GDC is moderate. The regime shows divergence, but less of the sharp generational break that appears in Conservative Europe."
  },
  "Post-Socialist": {
    color: "#8B2D56",
    countries: "Bulgaria, Croatia, Czechia, Estonia, Hungary, Lithuania, Latvia, Poland, Romania, Slovakia, Slovenia",
    evolutionFile: "assets/figures/evolution_galtan_Post_Socialist.svg",
    evolutionComment:
      "Post-Socialist Europe stands out because both female and male Gen Z averages sit relatively high on the traditional side, with men reaching the highest mean in the regime comparison.",
    groupedComment:
      "This regime combines a clear gender split with a generally more traditional baseline, which makes it central to the thesis argument about cross-European variation inside the same generational story.",
    gapComment:
      "The absolute gap is not the biggest bar in the figure, but it comes on top of the most traditional overall positioning. That combination matters analytically.",
    gdcComment:
      "The GDC is also very high here, showing that the path from Millennials to Gen Z is strongly gendered rather than uniformly conservative."
  },
  "Social Democratic": {
    color: "#D62828",
    countries: "Denmark, Finland, Sweden",
    evolutionFile: "assets/figures/evolution_galtan_Social_Democratic.svg",
    evolutionComment:
      "The Social Democratic cluster still shows a visible gender split, but the generational trajectories remain closer to one another than in the Conservative and Post-Socialist cases.",
    groupedComment:
      "The grouped bars make a useful corrective: even in the cluster with the smallest divergence-in-change score, Gen Z women and men do not fully converge.",
    gapComment:
      "The level gap remains meaningful, which is why the smallest GDC in the figure should not be mistaken for the absence of polarization.",
    gdcComment:
      "This is the lowest GDC value in the regime comparison. The split exists, but it grows less explosively across generations than elsewhere."
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

  document.getElementById("evolution-figure").src = meta.evolutionFile;
  document.getElementById("evolution-figure").alt =
    `Original thesis chart for ${regime}: postmaterialist-traditional values by generation and gender.`;
  document.getElementById("evolution-comment").textContent = meta.evolutionComment;
  document.getElementById("grouped-comment").textContent = meta.groupedComment;
  document.getElementById("gap-comment").textContent = meta.gapComment;
  document.getElementById("gdc-comment").textContent = meta.gdcComment;
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

// Load the same final CSV exports used to build the thesis figures.
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
