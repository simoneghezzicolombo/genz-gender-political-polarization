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
        existing.addEventListener("error", (err) => {
          plotlyLoading = null;
          existing.remove();
          reject(err);
        });
        return;
      }
      const s = document.createElement("script");
      s.src = PLOTLY_SRC;
      s.async = true;
      s.dataset.plotlyLoader = "true";
      s.onload = () => resolve(window.Plotly);
      s.onerror = (err) => {
        plotlyLoading = null;
        s.remove();
        reject(err);
      };
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

  function isNarrowViewport() {
    return window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
  }

  function applyResponsiveLayout(layout) {
    if (!isNarrowViewport()) return layout;
    // Scale down margins, title and tick font sizes on phones so the chart
    // still breathes inside ~360px wide viewports.
    layout.margin = Object.assign({}, layout.margin || {}, {
      l: Math.min((layout.margin && layout.margin.l) || 56, 48),
      r: Math.min((layout.margin && layout.margin.r) || 28, 16),
      t: Math.min((layout.margin && layout.margin.t) || 56, 56),
      b: Math.min((layout.margin && layout.margin.b) || 56, 64),
    });
    if (layout.title && typeof layout.title === "object") {
      layout.title = Object.assign({}, layout.title, {
        font: Object.assign({ size: 13 }, layout.title.font || {}, { size: 13 }),
      });
    }
    layout.font = Object.assign({ size: 11 }, layout.font || {}, { size: 11 });
    if (layout.legend) {
      layout.legend = Object.assign({}, layout.legend, {
        font: Object.assign({ size: 11 }, layout.legend.font || {}),
      });
    }
    if (layout.xaxis) {
      layout.xaxis = Object.assign({}, layout.xaxis);
      if (typeof layout.xaxis.tickangle !== "number") layout.xaxis.tickangle = -25;
      layout.xaxis.automargin = true;
    }
    if (layout.yaxis) {
      layout.yaxis = Object.assign({}, layout.yaxis, { automargin: true });
    }
    return layout;
  }

  async function renderContainer(container) {
    if (container.dataset.rendered === "true") return;
    const src = container.dataset.src;
    if (!src) return;
    container.dataset.rendered = "true";

    const plot = container.querySelector(".plot-target");
    const status = container.querySelector(".plot-status");
    try {
      if (status) {
        status.textContent = "Loading interactive chart...";
        status.style.display = "";
      }
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

      applyResponsiveLayout(layout);

      const cfg = Object.assign(configFor(container), fig.config || {});
      cfg.displaylogo = false;
      cfg.responsive = true;

      await Plotly.newPlot(plot, fig.data || [], layout, cfg);
      if (status) status.remove();

      // Keep responsive on resize: redraw + reapply mobile-aware layout tweaks
      const onResize = () => {
        if (!plot.isConnected) return;
        const relayout = applyResponsiveLayout(Object.assign({}, fig.layout || {}));
        Plotly.relayout(plot, {
          "margin.l": relayout.margin.l,
          "margin.r": relayout.margin.r,
          "margin.t": relayout.margin.t,
          "margin.b": relayout.margin.b,
        }).catch(() => {});
        Plotly.Plots.resize(plot);
      };
      window.addEventListener("resize", onResize, { passive: true });
    } catch (err) {
      container.dataset.rendered = "false";
      console.error("Interactive chart failed:", src, err);
      if (status) {
        status.innerHTML =
          'Could not load the interactive chart. <button type="button" class="plot-retry">Retry</button>';
        status.classList.add("plot-status--error");
        const retry = status.querySelector(".plot-retry");
        if (retry) {
          retry.addEventListener(
            "click",
            () => {
              status.classList.remove("plot-status--error");
              status.textContent = "Loading interactive chart...";
              renderContainer(container);
            },
            { once: true }
          );
        }
      }
    }
  }

  async function remountContainer(container, newSrc) {
    if (!container) return;
    if (newSrc) container.dataset.src = newSrc;
    const plot = container.querySelector(".plot-target");
    if (plot && window.Plotly && typeof window.Plotly.purge === "function") {
      try { window.Plotly.purge(plot); } catch (_) {}
    }
    container.dataset.rendered = "false";
    // Re-attach a status overlay if it was removed after a successful render
    if (!container.querySelector(".plot-status")) {
      const status = document.createElement("div");
      status.className = "plot-status";
      status.textContent = "Loading interactive chart...";
      container.appendChild(status);
    }
    return renderContainer(container);
  }

  window.InteractiveCharts = window.InteractiveCharts || {};
  window.InteractiveCharts.remount = remountContainer;

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
