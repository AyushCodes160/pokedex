const pokemonList = document.getElementById("pokemon-list");
const pokemonDetails = document.getElementById("pokemon-details");
const searchInput = document.getElementById("search");

let allPokemon = [];

document.addEventListener("DOMContentLoaded", async () => {
  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = savedTheme
    ? savedTheme === "dark"
    : window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) {
    document.body.classList.add("dark-mode");
  }
  if (themeToggle) {
    themeToggle.checked = prefersDark;
    themeToggle.addEventListener("change", () => {
      const isDark = themeToggle.checked;
      document.body.classList.toggle("dark-mode", isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }

  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
  const data = await res.json();
  allPokemon = data.results;
  renderPokemonList(allPokemon);

  // Automatically load Bulbasaur on startup
  await showPokemonDetails(1, "bulbasaur");
});

function renderPokemonList(list) {
  pokemonList.innerHTML = "";
  list.forEach((pokemon) => {
    const card = document.createElement("div");
    card.className = "pokemon-card";
    const id = pokemon.url.split("/").filter(Boolean).pop();
    card.innerHTML = `
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${
        pokemon.name
      }" />
      <h3>${capitalize(pokemon.name)}</h3>
    `;
    card.onclick = () => showPokemonDetails(id, pokemon.name);
    pokemonList.appendChild(card);
  });
}

async function showPokemonDetails(id, name) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  const typeLabels = data.types.map((t) => t.type.name.toUpperCase());
  const baseExp = data.base_experience ?? "—";

  pokemonDetails.style.display = "block";
  pokemonDetails.innerHTML = `
    <div class="summary-card">
      <div class="summary-diagonal"></div>
      <div class="summary-content">
        <div class="summary-left">
          <div class="summary-tabs">
            <span class="chevron">‹</span>
            <div class="icons-row">
              <span class="circle-icon"></span>
              <span class="mini-icon">⏱</span>
              <span class="mini-icon">★</span>
              <span class="mini-icon">📄</span>
              <span class="mini-icon">🏆</span>
            </div>
            <span class="chevron">›</span>
          </div>

          <div class="summary-table">
            <div class="summary-row alt"><span class="label">Name</span><span class="value bold">${capitalize(name)}</span></div>
            <div class="summary-row"><span class="label">Type</span><span class="value"><span class="type-pill">${typeLabels.join(" / ")}</span></span></div>
            <div class="summary-row"><span class="label">ID No.</span><span class="value bold">${id}</span></div>
            <div class="summary-row alt"><span class="label">Current no. of Exp. Points</span><span class="value bold">${baseExp}</span></div>

            <div class="exp-section">
              <div class="exp-total"></div>
              <div class="exp-needed">
                <div class="exp-track"><div class="exp-fill" style="width: 60%"></div></div>
              </div>
            </div>

            <div class="markings">
              <div class="play-icon">▶</div>
              <div class="marks">● ▲ ■ ◆ ♥ ★</div>
            </div>

            <div class="held-item">
              <div class="held-header">
                <span class="held-label">Held Item</span>
                <div class="held-meta">
                  <div class="held-dot"></div>
                  <span class="held-name">Miracle Seed</span>
                </div>
              </div>
              <p class="held-desc">An item to be held by a Pokémon. It's a seed imbued with life-force that boosts the power of Grass-type moves.</p>
            </div>
          </div>
        </div>

        <div class="summary-right">
          <div class="topbar">
            <div class="topbar-inner">
              <div class="left">
                <div class="orange-dot"></div>
                <span class="name">${capitalize(name)}</span>
              </div>
              <div class="right">
                <span class="gender">♂</span>
              </div>
            </div>
          </div>
          <div class="image-wrap">
            <div class="circle-bg"></div>
            <img class="summary-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" alt="${name}" />
          </div>
        </div>
      </div>
    </div>
  `;
}

searchInput.addEventListener("input", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;

  const val = target.value.trim().toLowerCase();
  const isNumeric = /^\d+$/.test(val);
  const normalizedNumeric = isNumeric ? String(parseInt(val, 10)) : null;

  const filtered = allPokemon.filter((p) => {
    const id = p.url.split("/").filter(Boolean).pop();
    return isNumeric
      ? id === normalizedNumeric
      : p.name.toLowerCase().includes(val);
  });

  renderPokemonList(filtered);
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
