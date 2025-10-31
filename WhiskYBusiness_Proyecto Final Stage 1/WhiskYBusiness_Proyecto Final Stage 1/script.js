const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('modal');
const cancelBtn = document.getElementById('cancelBtn');
const recipeForm = document.getElementById('recipeForm');
const anonymousChk = document.getElementById('anonymous');
const nameWrapper = document.getElementById('nameWrapper');
const toggle = document.getElementById('themeToggle');
const root = document.documentElement;

const RECIPES_KEY = 'whisk_recipes';
const savedTheme = localStorage.getItem('kawaiiTheme');

// ---- MODO OSCURO ----
if (savedTheme === 'dark') {
  root.classList.add('dark');
  if (toggle) toggle.checked = true;
}

if (toggle) {
  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      root.classList.add('dark');
      localStorage.setItem('kawaiiTheme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('kawaiiTheme', 'light');
    }
  });
}

// ---- FUNCIONES DE LOCALSTORAGE ----
function loadRecipes() {
  try {
    const raw = localStorage.getItem(RECIPES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo recetas:', e);
    return [];
  }
}

function saveRecipes(list) {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(list));
}

// ---- CREACIÓN DE TARJETAS ----
function createCard(recipe, id) {
  const art = document.createElement('article');
  art.className = 'card recipe fade-in';
  art.tabIndex = 0;
  art.dataset.id = id;

  art.innerHTML = `
    <img src="${recipe.image || 'images/pancakes_fresa.jpg'}" alt="${recipe.title}" class="card-img">
    <h4 class="card-title">${recipe.title}</h4>
    <div class="card-body">
      <p class="intro">${recipe.description || ''}</p>
      <div class="card-details">
        <h5>Ingredientes</h5>
        <ul>${(recipe.ingredients || []).map(i => `<li>${i}</li>`).join('')}</ul>
        <h5>Preparación</h5>
        <ol>${(recipe.instructions || []).map(s => `<li>${s}</li>`).join('')}</ol>
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn delete" data-id="${id}">Eliminar</button>
        </div>
      </div>
    </div>
  `;

  art.addEventListener('click', () => art.classList.toggle('expanded'));
  art.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') art.classList.toggle('expanded');
  });

  return art;
}

// ---- RENDERIZADO ----
function renderSavedRecipes() {
  const container = document.querySelector('.recipes');
  if (!container) return;

  // borrar recetas agregadas antes (sin tocar las del HTML base)
  container.querySelectorAll('.card[data-id]').forEach(el => el.remove());

  const list = loadRecipes();
  const baseRecipes = Array.from(container.children); // recetas del HTML

  // insertar las nuevas recetas arriba del contenido original
  list.forEach((r, idx) => {
    const card = createCard(r, idx);
    container.insertBefore(card, baseRecipes[0]); // las nuevas van primero
  });
}

function addRecipe(recipe) {
  const list = loadRecipes();
  list.unshift(recipe); // agrega primero
  saveRecipes(list);
  renderSavedRecipes();
}

// ---- MODAL ----
function openModal() {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  recipeForm.reset();
  nameWrapper.style.display = '';
}

addBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);

anonymousChk.addEventListener('change', (e) => {
  nameWrapper.style.display = e.target.checked ? 'none' : '';
});

recipeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const ingredients = document.getElementById('ingredients').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const instructions = document.getElementById('instructions').value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const author = document.getElementById('author').value.trim();
  const anonymous = document.getElementById('anonymous').checked;

  // 🔽 CAMBIO NUEVO: lectura de la imagen seleccionada
  const fileInput = document.getElementById('image');
  let imageData = '';

  if (fileInput.files && fileInput.files[0]) {
    if (fileInput.files[0].size > 1024 * 500) { // máximo 500 KB
      alert('La imagen es muy grande (máximo 500 KB)');
      return;
    }

    imageData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(fileInput.files[0]);
    });
  }
  // 🔼 FIN CAMBIO NUEVO

  const recipe = {
    title: title || 'Sin título',
    ingredients,
    instructions,
    author: anonymous ? 'Anónimo' : author,
    image: imageData || 'images/pancakes_fresa.jpg',
    description: (instructions[0] || '').slice(0, 60)
  };

  addRecipe(recipe);
  closeModal();
});

// ---- ELIMINAR RECETAS ----
document.addEventListener('click', (e) => {
  if (e.target.matches('.btn.delete')) {
    const id = Number(e.target.dataset.id);
    const list = loadRecipes();
    if (!isNaN(id) && id >= 0 && id < list.length) {
      list.splice(id, 1);
      saveRecipes(list);
      renderSavedRecipes();
    }
  }
});

// ---- INICIALIZAR ----
renderSavedRecipes();
