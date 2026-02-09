const pokemonList = document.getElementById("pokemon-list");
const pokemonDetails = document.getElementById("pokemon-details");
const searchInput = document.getElementById("search");

let allPokemon = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Auth Check
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'auth.html';
    return;
  }

  // Logout Handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'auth.html';
    });
  }

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

  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
  const data = await res.json();
  allPokemon = data.results;
  renderPokemonList(allPokemon);

  // Automatically load Bulbasaur on startup
  await showPokemonDetails(1, "bulbasaur", true);

  // Mobile Search Logic
  const mobileSearchBtn = document.getElementById('mobile-search-btn');
  const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
  const closeSearchBtn = document.getElementById('close-search-btn');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchResults = document.getElementById('mobile-search-results');

  if (mobileSearchBtn) {
      mobileSearchBtn.addEventListener('click', () => {
          mobileSearchOverlay.classList.add('active');
          mobileSearchInput.focus();
          renderMobileSearchResults(allPokemon); // Initial render
      });
  }

  if (closeSearchBtn) {
      closeSearchBtn.addEventListener('click', () => {
          mobileSearchOverlay.classList.remove('active');
      });
  }

  if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase();
          const filtered = allPokemon.filter(p => p.name.includes(query));
          renderMobileSearchResults(filtered);
      });
  }

  function renderMobileSearchResults(list) {
      mobileSearchResults.innerHTML = "";
      list.forEach((pokemon) => {
        const card = document.createElement("div");
        card.className = "pokemon-card";
        const id = pokemon.url.split("/").filter(Boolean).pop();
        card.innerHTML = `
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${pokemon.name}" loading="lazy" />
          <h3>${formatName(pokemon.name)}</h3>
        `;
        card.onclick = () => {
            showPokemonDetails(id, pokemon.name);
            mobileSearchOverlay.classList.remove('active');
        };
        mobileSearchResults.appendChild(card);
      });
  }
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
      <h3>${formatName(pokemon.name)}</h3>
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
            <div class="stats-header">
              <div class="stats-name">${formatName(name)}</div>
              <div class="stats-type">
                ${data.types.map(t => `<span class="type-pill type-${t.type.name.toLowerCase()}">${t.type.name.toUpperCase()}</span>`).join(" ")}
              </div>
            </div>
            
            <div class="stats-bars">
              ${data.stats.map(s => {
                const val = s.base_stat;
                const sName = s.stat.name === 'hp' ? 'HP' : 
                              s.stat.name === 'special-attack' ? 'Sp. Atk' :
                              s.stat.name === 'special-defense' ? 'Sp. Def' :
                              formatName(s.stat.name);
                // Simple color logic based on value
                let color = "stat-low";
                if (val >= 60) color = "stat-mid";
                if (val >= 90) color = "stat-high";
                
                // Visual width cap at 100% just for the bar, though stats go higher
                const width = Math.min(val, 100);

                return `
                  <div class="stat-bar">
                    <div class="s-label">${sName}</div>
                    <div class="s-track">
                      <div class="s-fill ${color}" style="width: ${width}%"></div>
                    </div>
                    <div class="s-val">${val}</div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

        <div class="summary-right">
          <div class="topbar">
            <div class="topbar-inner">
              <div class="left">
                <div class="orange-dot"></div>
                <span class="name">${formatName(name)}</span>
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

function formatName(str) {
  let words = str.split('-');
  if (words.includes('mega')) {
    words = words.filter(w => w !== 'mega');
    words.unshift('Mega');
  } else if (words.includes('gmax')) { // PokeAPI uses 'gmax'
    words = words.filter(w => w !== 'gmax');
    words.unshift('Gigantamax');
  }

  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Mobile View Logic
const mainLayout = document.querySelector('.pokedex-layout');
const backBtn = document.getElementById('back-to-list-btn');

function showMobileDetails() {
    if (window.innerWidth <= 768) {
        mainLayout.classList.add('show-details');
        if (backBtn) backBtn.style.display = 'flex';
    }
}

function hideMobileDetails() {
    mainLayout.classList.remove('show-details');
    if (backBtn) backBtn.style.display = 'none';
}

if (backBtn) {
    backBtn.addEventListener('click', hideMobileDetails);
}

// Override showPokemonDetails to trigger mobile view
const originalShowDetails = showPokemonDetails;
showPokemonDetails = async function(id, name, skipViewSwitch = false) {
    await originalShowDetails(id, name);
    if (!skipViewSwitch) {
        showMobileDetails();
    }
};
