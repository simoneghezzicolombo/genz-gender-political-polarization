(function () {
  "use strict";

  const PLOTLY_SRC = "https://cdn.plot.ly/plotly-2.35.2.min.js";

  let plotlyLoading = null;
  function ensurePlotly() {
    if (window.Plotly) return Promise.resolve(window.Plotly);
    if (plotlyLoading) return plotlyLoading;
    plotlyLoading = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-plotly-loader="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Plotly));
        existing.addEventListener("error", reject);
        return;
      }
      const s = document.createElement("script");
      s.src = PLOTLY_SRC;
      s.async = true;
      s.dataset.plotlyLoader = "true";
      s.onload = () => resolve(window.Plotly);
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return plotlyLoading;
  }

  function configFor(container) {
    return {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: [
        "lasso2d",
        "select2d",
        "autoScale2d",
        "hoverClosestCartesian",
        "hoverCompareCartesian",
        "toggleSpikelines",
      ],
    };
  }

  async function renderContainer(container) {
    if (container.dataset.rendered === "true") return;
    const src = container.dataset.src;
    if (!src) return;
    container.dataset.rendered = "true";

    const plot = container.querySelector(".plot-target");
    const status = container.querySelector(".plot-status");
    try {
      if (status) status.textContent = "Loading interactive chart...";
      const [Plotly, fig] = await Promise.all([
        ensurePlotly(),
        fetch(src).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} for ${src}`);
          return r.json();
        }),
      ]);

      // Clean layout: let Plotly pick responsive size
      const layout = Object.assign({}, fig.layout || {});
      layout.autosize = true;
      delete layout.width;
      delete layout.height;
      if (layout.margin) {
        layout.margin = Object.assign({ l: 56, r: 28, t: 56, b: 56 }, layout.margin);
      }
      // Ensure a readable hovermode if missing
      if (!layout.hovermode) layout.hovermode = "closest";

      const cfg = Object.assign(configFor(container), fig.config || {});
      cfg.displaylogo = false;
      cfg.responsive = true;

      await Plotly.newPlot(plot, fig.data || [], layout, cfg);
      if (status) status.remove();

      // Keep responsive on resize
      window.addEventListener(
        "resize",
        () => {
          if (plot.isConnected) Plotly.Plots.resize(plot);
        },
        { passive: true }
      );
    } catch (err) {
      container.dataset.rendered = "false";
      console.error("Interactive chart failed:", src, err);
      if (status) {
        status.textContent =
          "Could not load the interactive chart. Please refresh the page or check your connection.";
        status.classList.add("plot-status--error");
      }
    }
  }

  function init() {
    const containers = Array.from(document.querySelectorAll("[data-interactive]"));
    if (!containers.length) return;

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              renderContainer(entry.target);
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "200px 0px" }
      );
      containers.forEach((c) => io.observe(c));
    } else {
      containers.forEach(renderContainer);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
