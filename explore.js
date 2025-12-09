// explore.js — Full version with toggle (Option A)

(function () {
  "use strict";

  let allCards = [];
  let arenaConfig = [];
  let selectedArenaName = null;

  const state = {
    toxicBin: new Set(),
    spellBin: new Set(),
    chartMode: "wins", // "wins" or "winrate"
  };

  // ---------- INIT ----------

  function initExplorer() {
    const controlsEl = document.querySelector("#explorer-controls");
    const chartEl = document.querySelector("#explorer-chart");
    if (!controlsEl || !chartEl) return;
    if (typeof window.loadCardData !== "function") return;

    window.loadCardData().then((rows) => {
      allCards = rows || [];
      arenaConfig = window.ARENA_CONFIG || [];

      // Default arena = highest
      selectedArenaName =
        (arenaConfig[arenaConfig.length - 1] || arenaConfig[0] || {}).name ||
        null;

      inferInitialBins();
      buildExplorerUI();
      buildChartToggleUI();
      updateBinLists();
      updateSearchResults();
      updateExplorerChart();
    });
  }

  // Seed bins based on story defaults
  function inferInitialBins() {
    state.toxicBin.clear();
    state.spellBin.clear();

    allCards.forEach((row) => {
      if (row.bin === "toxic_troop") state.toxicBin.add(row.card_name);
      else if (row.bin === "cheap_spell") state.spellBin.add(row.card_name);
    });
  }

  // ---------- UI BUILD ----------

  function buildExplorerUI() {
    const controls = d3.select("#explorer-controls");
    controls.selectAll("*").remove();

    // Arena selector
    const arenaSection = controls
      .append("div")
      .attr("class", "explorer-section");

    arenaSection
      .append("div")
      .attr("class", "explorer-section-title")
      .text("1. Choose an arena");

    const arenaSelect = arenaSection
      .append("select")
      .attr("id", "explorer-arena-select")
      .attr("class", "explorer-select");

    arenaSelect
      .selectAll("option")
      .data(arenaConfig)
      .join("option")
      .attr("value", (d) => d.name)
      .property("selected", (d) => d.name === selectedArenaName)
      .text((d) => d.name);

    arenaSelect.on("change", function () {
      selectedArenaName = this.value;
      updateExplorerChart();
      updateSearchResults();
    });

    // -------------------------------
    // Search + filters
    // -------------------------------
    const filterSection = controls
      .append("div")
      .attr("class", "explorer-section");

    filterSection
      .append("div")
      .attr("class", "explorer-section-title")
      .text("2. Search & filter cards");

    filterSection
      .append("p")
      .attr("class", "explorer-helper-text")
      .text("Search by name or keyword, then add cards into each bin.");

    const searchInput = filterSection
      .append("input")
      .attr("type", "text")
      .attr("id", "explorer-search-input")
      .attr("class", "explorer-input")
      .attr(
        "placeholder",
        "Search by name or keyword (e.g. 'Mega', 'spell', 'zap')"
      );

    const filterRow = filterSection
      .append("div")
      .attr("class", "explorer-filter-row");

    // Build unique filter lists
    const uniqueElixirs = Array.from(
      new Set(allCards.map((d) => d.elixir).filter((v) => v != null))
    ).sort((a, b) => a - b);

    const uniqueRarities = Array.from(
      new Set(allCards.map((d) => d.rarity).filter(Boolean))
    ).sort();

    const uniqueTypes = Array.from(
      new Set(allCards.map((d) => d.card_type).filter(Boolean))
    ).sort();

    // Elixir select
    const elixirSelect = filterRow
      .append("select")
      .attr("id", "explorer-elixir-filter")
      .attr("class", "explorer-select explorer-select--small");

    elixirSelect.append("option").attr("value", "").text("Any elixir");

    elixirSelect
      .selectAll("option.elixir")
      .data(uniqueElixirs)
      .join("option")
      .attr("value", (d) => d)
      .text((d) => `${d} elixir`);

    // Rarity select
    const raritySelect = filterRow
      .append("select")
      .attr("id", "explorer-rarity-filter")
      .attr("class", "explorer-select explorer-select--small");

    raritySelect.append("option").attr("value", "").text("Any rarity");

    raritySelect
      .selectAll("option.rarity")
      .data(uniqueRarities)
      .join("option")
      .attr("value", (d) => d)
      .text((d) => d);

    // Type select
    const typeSelect = filterRow
      .append("select")
      .attr("id", "explorer-type-filter")
      .attr("class", "explorer-select explorer-select--small");

    typeSelect.append("option").attr("value", "").text("Any type");

    typeSelect
      .selectAll("option.type")
      .data(uniqueTypes)
      .join("option")
      .attr("value", (d) => d)
      .text((d) => d);

    // Search results
    filterSection
      .append("div")
      .attr("class", "explorer-section-subtitle")
      .text("Search results");

    filterSection
      .append("div")
      .attr("id", "explorer-search-results")
      .attr("class", "explorer-search-results");

    // -------------------------------
    // Bin builder
    // -------------------------------
    const binsSection = controls
      .append("div")
      .attr("class", "explorer-section explorer-section--bins");

    binsSection
      .append("div")
      .attr("class", "explorer-section-title")
      .text("3. Build your two bins");

    const binsRow = binsSection
      .append("div")
      .attr("class", "explorer-bins-row");

    // Toxic bin
    const toxicCol = binsRow
      .append("div")
      .attr("class", "explorer-bin explorer-bin--toxic");

    toxicCol
      .append("div")
      .attr("class", "explorer-bin-title")
      .attr("contenteditable", "true")
      .text("“Toxic troop” bin");

    toxicCol
      .append("div")
      .attr("id", "explorer-toxic-bin-list")
      .attr("class", "explorer-bin-list");

    // Spell bin
    const spellCol = binsRow
      .append("div")
      .attr("class", "explorer-bin explorer-bin--spell");

    spellCol
      .append("div")
      .attr("class", "explorer-bin-title")
      .attr("contenteditable", "true")
      .text("“Cheap spell” bin");

    spellCol
      .append("div")
      .attr("id", "explorer-spell-bin-list")
      .attr("class", "explorer-bin-list");

    // Reset buttons
    const resetRow = binsSection
      .append("div")
      .attr("class", "explorer-reset-row");

    resetRow
      .append("button")
      .attr("class", "explorer-button")
      .text("Reset to default bins")
      .on("click", () => {
        inferInitialBins();
        updateBinLists();
        updateSearchResults();
        updateExplorerChart();
      });

    resetRow
      .append("button")
      .attr("class", "explorer-button explorer-button--ghost")
      .text("Clear both bins")
      .on("click", () => {
        state.toxicBin.clear();
        state.spellBin.clear();
        updateBinLists();
        updateSearchResults();
        updateExplorerChart();
      });

    // Register filter listeners
    function handleFilterChange() {
      updateSearchResults();
    }
    searchInput.on("input", handleFilterChange);
    elixirSelect.on("change", handleFilterChange);
    raritySelect.on("change", handleFilterChange);
    typeSelect.on("change", handleFilterChange);
  }

  // ---------- CHART TOGGLE UI ----------

function buildChartToggleUI() {
  const container = d3.select("#explorer-chart");
  container.selectAll(".explorer-chart-toggle").remove();

  const toggleBar = container
    .insert("div", ":first-child") // insert above chart
    .attr("class", "explorer-chart-toggle centered-toggle");

  const options = [
    { mode: "wins", label: "Wins" },
    { mode: "winrate", label: "Win Rate" },
  ];

  toggleBar
    .selectAll("button")
    .data(options)
    .join("button")
    .attr("class", (d) =>
      `explorer-toggle-btn ${d.mode === "wins" ? "explorer-toggle-wins" : "explorer-toggle-winrate"}`
    )
    .classed("active", (d) => state.chartMode === d.mode)
    .text((d) => d.label)
    .on("click", (event, d) => {
      state.chartMode = d.mode;
      updateExplorerChart();
    });
}


  function updateToggleActive() {
    const winsBtn = d3.select(".explorer-toggle-wins");
    const rateBtn = d3.select(".explorer-toggle-winrate");

    winsBtn.classed("active", state.chartMode === "wins");
    rateBtn.classed("active", state.chartMode === "winrate");
  }

  // ---------- SEARCH ----------

  function getFilteredCards() {
    const term = (d3.select("#explorer-search-input").property("value") || "")
      .toLowerCase();

    const elixirFilter = d3
      .select("#explorer-elixir-filter")
      .property("value");
    const rarityFilter = d3
      .select("#explorer-rarity-filter")
      .property("value");
    const typeFilter = d3.select("#explorer-type-filter").property("value");

    let filtered = allCards.slice();

    // Must have wins in arena
    if (selectedArenaName && typeof window.getWinsForArena === "function") {
      filtered = filtered.filter(
        (row) => window.getWinsForArena(row, selectedArenaName) > 0
      );
    }

    if (term) {
      filtered = filtered.filter((row) => {
        const name = row.card_name.toLowerCase();
        const type = (row.card_type || "").toLowerCase();
        const rarity = (row.rarity || "").toLowerCase();
        return (
          name.includes(term) || type.includes(term) || rarity.includes(term)
        );
      });
    }

    if (elixirFilter !== "") {
      filtered = filtered.filter(
        (row) => Number(row.elixir) === Number(elixirFilter)
      );
    }

    if (rarityFilter !== "") {
      filtered = filtered.filter((row) => row.rarity === rarityFilter);
    }

    if (typeFilter !== "") {
      filtered = filtered.filter((row) => row.card_type === typeFilter);
    }

    // Sort by wins
    filtered.sort((a, b) =>
      d3.descending(
        window.getWinsForArena(a, selectedArenaName),
        window.getWinsForArena(b, selectedArenaName)
      )
    );

    return filtered;
  }

  function updateSearchResults() {
    const container = d3.select("#explorer-search-results");
    if (container.empty()) return;

    const cards = getFilteredCards().slice(0, 40);

    container.selectAll("*").remove();

    if (!cards.length) {
      container
        .append("div")
        .attr("class", "explorer-search-empty")
        .text("No cards match these filters in this arena.");
      return;
    }

    const rows = container
      .selectAll(".explorer-search-card")
      .data(cards, (d) => d.card_name)
      .join("div")
      .attr("class", "explorer-search-card");

    rows.each(function (d) {
      const rowSel = d3.select(this);
      rowSel.selectAll("*").remove();

      const info = rowSel
        .append("div")
        .attr("class", "explorer-search-card-info");

      info
        .append("div")
        .attr("class", "explorer-search-card-name")
        .text(d.card_name);

      const metaParts = [];
      if (d.card_type) metaParts.push(d.card_type);
      if (d.rarity) metaParts.push(d.rarity);
      if (d.elixir != null)
        metaParts.push(
          `${d.elixir} <img src="images/elixir.webp" class="elixir-icon">`
        );

      info
        .append("div")
        .attr("class", "explorer-search-card-meta")
        .html(metaParts.join(" · "));

      // Buttons
      const buttons = rowSel
        .append("div")
        .attr("class", "explorer-search-card-buttons");

      const inToxic = state.toxicBin.has(d.card_name);
      const inSpell = state.spellBin.has(d.card_name);

      const toxicBtn = buttons
        .append("button")
        .attr(
          "class",
          "explorer-button explorer-button--tiny explorer-button--toxic"
        )
        .text(inToxic ? "In toxic bin" : "Add to toxic");

      if (inToxic) {
        toxicBtn.attr("disabled", true);
      } else {
        toxicBtn.on("click", (event) => {
          event.stopPropagation();
          addToBin("toxic", d.card_name);
        });
      }

      const spellBtn = buttons
        .append("button")
        .attr(
          "class",
          "explorer-button explorer-button--tiny explorer-button--spell"
        )
        .text(inSpell ? "In fair bin" : "Add to cheap");

      if (inSpell) {
        spellBtn.attr("disabled", true);
      } else {
        spellBtn.on("click", (event) => {
          event.stopPropagation();
          addToBin("spell", d.card_name);
        });
      }
    });
  }

  // ---------- BIN MANAGEMENT ----------

  function addToBin(binKey, cardName) {
    if (!cardName) return;

    if (binKey === "toxic") {
      state.spellBin.delete(cardName);
      state.toxicBin.add(cardName);
    } else {
      state.toxicBin.delete(cardName);
      state.spellBin.add(cardName);
    }

    updateBinLists();
    updateSearchResults();
    updateExplorerChart();
  }

  function updateBinLists() {
    const toxicList = d3.select("#explorer-toxic-bin-list");
    const spellList = d3.select("#explorer-spell-bin-list");
    if (toxicList.empty() || spellList.empty()) return;

    toxicList.selectAll("*").remove();
    spellList.selectAll("*").remove();

    const toxicCards = Array.from(state.toxicBin).sort();
    const spellCards = Array.from(state.spellBin).sort();

    function makeItems(sel, cards, bin) {
      if (!cards.length) {
        sel.append("div")
          .attr("class", "explorer-bin-empty")
          .text("No cards yet. Add from the search results.");
        return;
      }
      const items = sel
        .selectAll(".explorer-bin-pill")
        .data(cards, (d) => d)
        .join("div")
        .attr(
          "class",
          `explorer-bin-pill explorer-bin-pill--${bin === "toxic" ? "toxic" : "spell"}`
        );

      items
        .append("span")
        .attr("class", "explorer-bin-pill-label")
        .text((d) => d);

      items
        .append("button")
        .attr("class", "explorer-bin-pill-remove")
        .text("×")
        .on("click", (event, d) => {
          event.stopPropagation();
          state[bin === "toxic" ? "toxicBin" : "spellBin"].delete(d);
          updateBinLists();
          updateSearchResults();
          updateExplorerChart();
        });
    }

    makeItems(toxicList, toxicCards, "toxic");
    makeItems(spellList, spellCards, "spell");
  }

  // ---------- CHART DATA ----------

  function buildChartDataForArena(sortMode) {
    if (!selectedArenaName) return [];

    const byName = new Map(allCards.map((r) => [r.card_name, r]));
    const combined = [];

    function add(name, bin) {
      const row = byName.get(name);
      if (!row) return;

      const wins = window.getWinsForArena(row, selectedArenaName) || 0;
      if (wins <= 0) return;

      let winRate = 0;
      if (typeof window.getWinRateForArena === "function") {
        winRate = window.getWinRateForArena(row, selectedArenaName) || 0;
      } else {
        // Fallback for old datasets without rwin_* columns
        const total = row.overall_count || 0;
        winRate = total ? wins / total : 0;
      }

      combined.push({
        card_name: name,
        wins,
        win_rate: winRate,
        bin,
      });
    }


    state.toxicBin.forEach((name) => add(name, "toxic_troop"));
    state.spellBin.forEach((name) => add(name, "cheap_spell"));

    // Sort based on the currently selected metric
    if (sortMode === "winrate") {
      combined.sort((a, b) => d3.descending(a.win_rate, b.win_rate));
    } else {
      combined.sort((a, b) => d3.descending(a.wins, b.wins));
    }

    return combined;
  }


  // ---------- CHART RENDERING ----------

  function updateExplorerChart() {
    const container = d3.select("#explorer-chart");
    if (container.empty()) return;

    updateToggleActive();

    // Clear old charts, keep toggle
    container.selectAll(".explorer-chart-area").remove();

    const chartArea = container
      .append("div")
      .attr("class", "explorer-chart-area");

    const data = buildChartDataForArena(state.chartMode);
    if (!data.length) {
      chartArea
        .append("div")
        .attr("class", "explorer-chart-empty")
        .text(
          "No cards in your bins have wins in this arena. Add cards or switch arenas."
        );
      return;
    }

    if (state.chartMode === "wins") {
      renderWinsChart(chartArea, data);
    } else {
      renderWinRateChart(chartArea, data);
    }
  }

  // ---- Wins Chart ----


  function renderWinsChart(container, data) {
    const node = container.node();
    const fullWidth = Math.max(320, node.clientWidth || 320);

    const margin = { top: 32, right: 40, bottom: 80, left: 60 };
    const width = fullWidth - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    const wrap = container.append("div").attr("class", "explorer-chart-wins");

    const svg = wrap
      .append("svg")
      .attr("width", fullWidth)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.card_name))
      .range([0, width])
      .padding(0.2);

    const minWins = d3.min(data, (d) => d.wins) || 0;
    const maxWins = d3.max(data, (d) => d.wins) || 0;

    let yMin = minWins;
    let yMax = maxWins;

    // Add padding around the data range so mean lines / differences pop out
    const pad = (yMax - yMin) * 0.1 || (maxWins || 1) * 0.1;
    yMin = Math.max(0, yMin - pad);
    yMax = yMax + pad;

    if (yMax <= yMin) {
      yMin = 0;
      yMax = maxWins || 1;
    }

    const y = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([height, 0]);

    const color = d3
      .scaleOrdinal()
      .domain(["toxic_troop", "cheap_spell"])
      .range(["#d62728", "#1f77b4"]);

    g.selectAll(".bar-wins")
      .data(data)
      .join("rect")
      .attr("class", "bar-wins")
      .attr("x", (d) => x(d.card_name))
      .attr("y", (d) => y(d.wins))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.wins))
      .attr("fill", (d) => color(d.bin));

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end");

    g.append("g").call(d3.axisLeft(y));

    // X-axis label (“Cards”)
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 55)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Cards");

    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Total Wins");

    const toxicMean = d3.mean(
      data.filter((d) => d.bin === "toxic_troop").map((d) => d.wins)
    );

    const spellMean = d3.mean(
      data.filter((d) => d.bin === "cheap_spell").map((d) => d.wins)
    );

    const meanGroup = g.append("g");

    if (toxicMean != null) {
      meanGroup
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(toxicMean))
        .attr("y2", y(toxicMean))
        .attr("class", "mean-line mean-line--toxic");

      meanGroup
        .append("text")
        .attr("x", width)
        .attr("y", y(toxicMean) - 4)
        .attr("text-anchor", "end")
        .attr("class", "mean-label mean-label--toxic")
        .text("Toxic troop mean");
    }

    if (spellMean != null) {
      meanGroup
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(spellMean))
        .attr("y2", y(spellMean))
        .attr("class", "mean-line mean-line--spell");

      meanGroup
        .append("text")
        .attr("x", width)
        .attr("y", y(spellMean) - 4)
        .attr("text-anchor", "end")
        .attr("class", "mean-label mean-label--spell")
        .text("Cheap spell mean");
    }

    // "Zoomed scale: a–b wins" label
    const [d0, d1] = y.domain();
    const fmt = d3.format(",");
    svg
      .append("text")
      .attr("x", fullWidth - margin.right)
      .attr("y", height + margin.top + margin.bottom - 6)
      .attr("text-anchor", "end")
      .attr("class", "explorer-chart-note")
      .style("font-size", "0.7rem")
      .style("fill", "#555555")
      .text(`Zoomed scale: ${fmt(d0)}–${fmt(d1)} wins`);

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 20)
      .attr("class", "explorer-chart-title")
      .style("font-weight", "600")
      .text("Wins by Card");
  }



  

  // ---- Win Rate Chart ----

  function renderWinRateChart(container, data) {
    const node = container.node();
    const fullWidth = Math.max(320, node.clientWidth || 320);

    const margin = { top: 32, right: 40, bottom: 80, left: 60 };
    const width = fullWidth - margin.left - margin.right;
    const height = 340 - margin.top - margin.bottom;

    const wrap = container
      .append("div")
      .attr("class", "explorer-chart-winrate");

    const svg = wrap
      .append("svg")
      .attr("width", fullWidth)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.card_name))
      .range([0, width])
      .padding(0.2);

    const minRate = d3.min(data, (d) => d.win_rate);
    const maxRate = d3.max(data, (d) => d.win_rate);

    let yMin = minRate != null ? minRate : 0;
    let yMax = maxRate != null ? maxRate : 0.5;

    // Add a bit of padding above/below the data range
    const pad = (yMax - yMin) * 0.1 || 0.02;
    yMin = Math.max(0, yMin - pad);
    yMax = Math.min(1, yMax + pad);

    // If the range is still very tight, enforce a minimum band (~5%)
    if (yMax - yMin < 0.05) {
      const mid = (yMax + yMin) / 2;
      yMin = Math.max(0, mid - 0.025);
      yMax = Math.min(1, mid + 0.025);
    }

    const y = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([height, 0]);

    const color = d3
      .scaleOrdinal()
      .domain(["toxic_troop", "cheap_spell"])
      .range(["#d62728", "#1f77b4"]);

    g.selectAll(".bar-winrate")
      .data(data)
      .join("rect")
      .attr("class", "bar-winrate")
      .attr("x", (d) => x(d.card_name))
      .attr("y", (d) => y(d.win_rate))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.win_rate))
      .attr("fill", (d) => color(d.bin));

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));

    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Win Rate (%)");

    // X-axis label (“Cards”)
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 55)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Cards");

    // 50% reference line (no label now)
    if (yMin < 0.5 && yMax > 0.5) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(0.5))
        .attr("y2", y(0.5))
        .attr("class", "mean-line mean-line--baseline");
    }

    // "Zoomed scale: x%–y%" label
    const [d0, d1] = y.domain();
    svg
      .append("text")
      .attr("x", fullWidth - margin.right)
      .attr("y", height + margin.top + margin.bottom - 6)
      .attr("text-anchor", "end")
      .attr("class", "explorer-chart-note")
      .style("font-size", "0.7rem")
      .style("fill", "#555555")
      .text(
        `Zoomed scale: ${d3.format(".0%")(d0)}–${d3.format(".0%")(d1)}`
      );

    // Mean lines for win rate
    const toxicMean = d3.mean(
      data.filter((d) => d.bin === "toxic_troop").map((d) => d.win_rate)
    );
    const spellMean = d3.mean(
      data.filter((d) => d.bin === "cheap_spell").map((d) => d.win_rate)
    );

    const meanGroup = g.append("g");

    if (toxicMean != null) {
      meanGroup
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(toxicMean))
        .attr("y2", y(toxicMean))
        .attr("class", "mean-line mean-line--toxic");

      meanGroup
        .append("text")
        .attr("x", width)
        .attr("y", y(toxicMean) - 4)
        .attr("text-anchor", "end")
        .attr("class", "mean-label mean-label--toxic")
        .text("Toxic troop mean");
    }

    if (spellMean != null) {
      meanGroup
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(spellMean))
        .attr("y2", y(spellMean))
        .attr("class", "mean-line mean-line--spell");

      meanGroup
        .append("text")
        .attr("x", width)
        .attr("y", y(spellMean) - 4)
        .attr("text-anchor", "end")
        .attr("class", "mean-label mean-label--spell")
        .text("Cheap spell mean");
    }

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 20)
      .attr("class", "explorer-chart-title")
      .style("font-weight", "600")
      .text("Win Rate by Card");
  }



  // ---------- START ----------

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExplorer);
  } else {
    initExplorer();
  }
})();
