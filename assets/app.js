const state = {
  cards: [],
  selected: new Set(),
  logoDevToken: "",
};

const MAX_COMPARE = 3;

const els = {
  search: document.getElementById("search"),
  maxFee: document.getElementById("max-fee"),
  maxFd: document.getElementById("max-fd"),
  cardCategory: document.getElementById("card-category"),
  rewardType: document.getElementById("reward-type"),
  clearFilters: document.getElementById("clear-filters"),
  cardList: document.getElementById("card-list"),
  resultsCount: document.getElementById("results-count"),
  compareWrap: document.getElementById("compare-table-wrap"),
  lastUpdated: document.getElementById("last-updated"),
  cardModal: document.getElementById("card-modal"),
  cardModalContent: document.getElementById("card-modal-content"),
  closeModal: document.getElementById("close-modal"),
};

const fmtInr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compareFields = [
  ["Issuer", "issuer"],
  ["Category", "cardCategory"],
  ["Type", "rewardType"],
  ["Joining fee", "joiningFee"],
  ["Annual fee", "annualFee"],
  ["Minimum FD", "minFd"],
  ["Credit limit policy", "limitPolicy"],
  ["Rewards", "rewards"],
  ["Forex markup", "forexMarkup"],
  ["Lounge access", "loungeAccess"],
  ["Eligibility", "eligibility"],
  ["Apply", "applyUrl"],
  ["Notes", "notes"],
];

function money(value) {
  if (typeof value !== "number") return value;
  return fmtInr.format(value);
}

function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase();
}

function getCardById(id) {
  return state.cards.find((card) => card.id === id);
}

function getCardImage(card) {
  return card.officialImage || card.image || "assets/card-art/placeholder.svg";
}

function getLogoUrl(domain) {
  if (!domain) return "";
  const params = new URLSearchParams({
    format: "png",
    size: "64",
    fallback: "monogram",
  });
  if (state.logoDevToken) params.set("token", state.logoDevToken);
  return `https://img.logo.dev/${domain}?${params.toString()}`;
}

function getCardLogos(card) {
  const domains = Array.isArray(card.logoDomains)
    ? card.logoDomains
    : [card.issuerDomain].filter(Boolean);
  return [...new Set(domains)].map((domain) => ({
    domain,
    url: getLogoUrl(domain),
  }));
}

function renderCardLogos(card) {
  return getCardLogos(card)
    .map(
      (logo) =>
        `<img class="issuer-logo" src="${logo.url}" alt="${logo.domain} logo" loading="lazy" onerror="this.onerror=null;this.style.display='none';" />`
    )
    .join("");
}

function getFilteredCards() {
  const query = normalize(els.search.value);
  const maxFee = Number(els.maxFee.value);
  const maxFd = Number(els.maxFd.value);
  const category = normalize(els.cardCategory.value);
  const reward = normalize(els.rewardType.value);

  return state.cards.filter((card) => {
    if (
      query &&
      !normalize(
        `${card.name} ${card.issuer} ${card.rewards} ${card.partner || ""}`
      ).includes(query)
    ) {
      return false;
    }
    if (Number.isFinite(maxFee) && els.maxFee.value && card.annualFee > maxFee) {
      return false;
    }
    if (Number.isFinite(maxFd) && els.maxFd.value && card.minFd > maxFd) {
      return false;
    }
    if (category && normalize(card.cardCategory) !== category) {
      return false;
    }
    if (reward && normalize(card.rewardType) !== reward) {
      return false;
    }
    return true;
  });
}

function renderCards() {
  const cards = getFilteredCards();
  els.resultsCount.textContent = `${cards.length} card(s)`;

  if (!cards.length) {
    els.cardList.innerHTML = `<p class="muted">No cards match the selected filters.</p>`;
    return;
  }

  els.cardList.innerHTML = cards
    .map((card) => {
      const selected = state.selected.has(card.id);
      const disable =
        !selected && state.selected.size >= MAX_COMPARE ? "disabled" : "";
      return `
      <article class="card" data-card-id="${card.id}" tabindex="0" role="button" aria-label="View details for ${card.name}">
        <img
          class="card-image"
          src="${getCardImage(card)}"
          alt="${card.imageAlt || `${card.name} card visual`}"
          loading="lazy"
          onerror="this.onerror=null;this.src='assets/card-art/placeholder.svg';"
        />
        <div class="issuer-row">
          ${renderCardLogos(card)}
          <p class="muted">${card.issuer}</p>
        </div>
        <h3>${card.name}</h3>
        <p class="muted small">${card.cardCategory}${
        card.partner ? ` • ${card.partner}` : ""
      }</p>
        <div class="chip-row">
          <span class="chip">Annual: ${money(card.annualFee)}</span>
          <span class="chip">Min FD: ${money(card.minFd)}</span>
          <span class="chip">${card.rewardType}</span>
        </div>
        <a
          class="apply-link ${card.applyUrl ? "" : "is-disabled"}"
          href="${card.applyUrl || ""}"
          ${
            card.applyUrl
              ? 'target="_blank" rel="noopener noreferrer sponsored"'
              : ""
          }
          ${card.applyUrl ? "" : 'aria-disabled="true" tabindex="-1"'}
        >
          ${card.applyUrl ? "Apply now" : "Apply link coming soon"}
        </a>
        <div class="select-row">
          <input type="checkbox" id="pick-${card.id}" data-id="${card.id}" ${
        selected ? "checked" : ""
      } ${disable} />
          <label for="pick-${card.id}">Compare</label>
        </div>
      </article>
    `;
    })
    .join("");

  els.cardList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      const id = e.target.getAttribute("data-id");
      if (e.target.checked) state.selected.add(id);
      else state.selected.delete(id);
      renderCards();
      renderComparison();
    });
  });
}

function openCardModal(cardId) {
  const card = getCardById(cardId);
  if (!card) return;

  els.cardModalContent.innerHTML = `
    <div class="card-modal-head">
      <img
        class="card-modal-image"
        src="${getCardImage(card)}"
        alt="${card.imageAlt || `${card.name} card visual`}"
        onerror="this.onerror=null;this.src='assets/card-art/placeholder.svg';"
      />
      <div class="card-modal-title-block">
        <div class="issuer-row">
          ${renderCardLogos(card)}
          <p class="muted">${card.issuer}</p>
        </div>
        <h3>${card.name}</h3>
        <p class="muted">${card.cardCategory}${card.partner ? ` • ${card.partner}` : ""}</p>
      </div>
    </div>
    <div class="card-modal-grid">
      <p><strong>Joining fee:</strong> ${money(card.joiningFee)}</p>
      <p><strong>Annual fee:</strong> ${money(card.annualFee)}</p>
      <p><strong>Minimum FD:</strong> ${money(card.minFd)}</p>
      <p><strong>Credit limit policy:</strong> ${card.limitPolicy}</p>
      <p><strong>Rewards:</strong> ${card.rewards}</p>
      <p><strong>Forex markup:</strong> ${card.forexMarkup}</p>
      <p><strong>Lounge access:</strong> ${card.loungeAccess}</p>
      <p><strong>Eligibility:</strong> ${card.eligibility}</p>
      <p><strong>Notes:</strong> ${card.notes}</p>
    </div>
    <div class="card-modal-actions">
      <a
        class="apply-link ${card.applyUrl ? "" : "is-disabled"}"
        href="${card.applyUrl || ""}"
        ${
          card.applyUrl
            ? 'target="_blank" rel="noopener noreferrer sponsored"'
            : ""
        }
        ${card.applyUrl ? "" : 'aria-disabled="true" tabindex="-1"'}
      >
        ${card.applyUrl ? "Apply now" : "Apply link coming soon"}
      </a>
    </div>
  `;

  if (typeof els.cardModal.showModal === "function") {
    els.cardModal.showModal();
  } else {
    els.cardModal.setAttribute("open", "true");
  }
}

function closeCardModal() {
  if (typeof els.cardModal.close === "function") {
    els.cardModal.close();
  } else {
    els.cardModal.removeAttribute("open");
  }
}

function renderComparison() {
  const selectedCards = state.cards.filter((card) => state.selected.has(card.id));

  if (!selectedCards.length) {
    els.compareWrap.innerHTML = `<p class="muted">No cards selected yet.</p>`;
    return;
  }

  const headers = selectedCards
    .map((card) => `<th scope="col">${card.name}</th>`)
    .join("");

  const rows = compareFields
    .map(([label, key]) => {
      const cols = selectedCards.map((card) => {
        if (key === "applyUrl") {
          if (!card.applyUrl) return "<td>Coming soon</td>";
          return `<td><a href="${card.applyUrl}" target="_blank" rel="noopener noreferrer sponsored">Apply now</a></td>`;
        }
        return `<td>${money(card[key]) ?? "-"}</td>`;
      });
      return `<tr><th scope="row">${label}</th>${cols.join("")}</tr>`;
    })
    .join("");

  els.compareWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th scope="col">Feature</th>
          ${headers}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function attachFilterHandlers() {
  [els.search, els.maxFee, els.maxFd, els.cardCategory, els.rewardType].forEach(
    (el) => {
      el.addEventListener("input", renderCards);
      el.addEventListener("change", renderCards);
    }
  );

  els.clearFilters.addEventListener("click", () => {
    els.search.value = "";
    els.maxFee.value = "";
    els.maxFd.value = "";
    els.cardCategory.value = "";
    els.rewardType.value = "";
    renderCards();
  });
}

function attachCardHandlers() {
  els.cardList.addEventListener("click", (event) => {
    const cardEl = event.target.closest(".card[data-card-id]");
    if (!cardEl) return;
    if (event.target.closest("a, input, label, button")) return;
    openCardModal(cardEl.getAttribute("data-card-id"));
  });

  els.cardList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const cardEl = event.target.closest(".card[data-card-id]");
    if (!cardEl) return;
    event.preventDefault();
    openCardModal(cardEl.getAttribute("data-card-id"));
  });
}

function attachModalHandlers() {
  els.closeModal.addEventListener("click", closeCardModal);
  els.cardModal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeCardModal();
  });
  els.cardModal.addEventListener("click", (event) => {
    if (event.target === els.cardModal) closeCardModal();
  });
}

async function init() {
  try {
    const response = await fetch("./data/cards.json");
    if (!response.ok) throw new Error("Failed to load card data");

    const payload = await response.json();
    state.cards = payload.cards;
    state.logoDevToken = payload.logoDevToken || "";
    els.lastUpdated.textContent = `Last updated: ${payload.lastUpdated}`;

    attachFilterHandlers();
    attachCardHandlers();
    attachModalHandlers();
    renderCards();
    renderComparison();
  } catch (err) {
    els.cardList.innerHTML = `<p class="muted">Could not load data. ${err.message}</p>`;
  }
}

init();
