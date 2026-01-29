const pokemonList = document.getElementById("pokemon-list");
const pokemonDetails = document.getElementById("pokemon-details");
const searchInput = document.getElementById("search");

let allPokemon = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Theme: restore preference and attach toggle (checkbox)
  const themeToggle = /** @type {HTMLInputElement|null} */ (
    document.getElementById("theme-toggle")
  );
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = savedTheme === "dark";
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
  const typesBadges = data.types
    .map((t) => {
      const typeName = t.type.name.toLowerCase();
      return `<span class="type-badge type-${typeName}">${capitalize(typeName)}</span>`;
    })
    .join(" ");

  const statsRows = data.stats
    .map((s) => {
      const label = capitalize(s.stat.name);
      const val = s.base_stat;
      const pct = Math.min(100, Math.round((val / 255) * 100));
      return `
      <div class="stat-row">
        <span class="stat-label">${label}</span>
        <div class="bar-container"><div class="bar-fill" style="width: ${pct}%"></div></div>
        <span class="stat-value">${val}</span>
      </div>`;
    })
    .join("");

  pokemonDetails.style.display = "block";
  pokemonDetails.innerHTML = `
    <div class="pokedex-card">
      <div class="header">
        <div class="pokeball-icon"></div>
        <h1>${capitalize(name)}</h1>
      </div>
      <div class="display-area">
        <div class="holo-circle"></div>
        <img class="pokemon-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" alt="${name}" />
        <div class="info-panel">
          <div class="info-row"><strong>ID:</strong> #${id}</div>
          <div class="info-row"><strong>Types:</strong> ${typesBadges}</div>
          <div class="info-row"><strong>Height:</strong> ${data.height / 10} m</div>
          <div class="info-row"><strong>Weight:</strong> ${data.weight / 10} kg</div>
        </div>
      </div>
      <div class="stats-box">
        ${statsRows}
      </div>
      <div class="footer">
        <button class="close-btn" onclick="pokemonDetails.style.display='none'">Close</button>
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

// Theme handling implemented above using a header button and body.dark-mode class
