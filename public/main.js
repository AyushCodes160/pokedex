const pokemonList = document.getElementById("pokemon-list");
const pokemonDetails = document.getElementById("pokemon-details");
const searchInput = document.getElementById("search");

let allPokemon = [];

document.addEventListener("DOMContentLoaded", async () => {
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
  pokemonDetails.style.display = "block";
  pokemonDetails.innerHTML = `
    <h2>${capitalize(name)}</h2>
    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" alt="${name}" />
    <p><strong>Types:</strong> ${data.types
      .map((t) => capitalize(t.type.name))
      .join(", ")}</p>
    <p><strong>Height:</strong> ${data.height / 10} m</p>
    <p><strong>Weight:</strong> ${data.weight / 10} kg</p>
    <p><strong>Stats:</strong></p>
    <ul>
      ${data.stats
        .map((s) => `<li>${capitalize(s.stat.name)}: ${s.base_stat}</li>`)
        .join("")}
    </ul>
    <button onclick="pokemonDetails.style.display='none'">Close</button>
  `;
}

searchInput.addEventListener("input", (e) => {
  const val = e.target.value.toLowerCase();
  const filtered = allPokemon.filter((p) => p.name.includes(val));
  renderPokemonList(filtered);
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
