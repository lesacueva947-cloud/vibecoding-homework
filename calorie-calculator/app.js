// Ключ, под которым всё состояние хранится в localStorage браузера
const STORAGE_KEY = "calorie-calculator";
const DEFAULT_GOAL = 2000;

const form = document.getElementById("product-form");
const formError = document.getElementById("form-error");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const totalEl = document.getElementById("total");
const clearBtn = document.getElementById("clear-btn");
const goalInput = document.getElementById("goal-input");
const progress = document.getElementById("progress");
const progressFill = document.getElementById("progress-fill");
const goalStatus = document.getElementById("goal-status");

const state = loadState();

// ---------- Сохранение ----------

function isValidProduct(p) {
  return (
    p &&
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    Number.isFinite(p.kcalPer100) &&
    Number.isFinite(p.grams)
  );
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.products)) {
      return {
        products: saved.products.filter(isValidProduct),
        goal: saved.goal > 0 ? saved.goal : DEFAULT_GOAL,
      };
    }
  } catch (e) {
    // Данные повреждены или хранилище недоступно — начинаем с чистого листа
  }
  return { products: [], goal: DEFAULT_GOAL };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Хранилище недоступно (например, приватный режим) — работаем без сохранения
  }
}

// ---------- Расчёты ----------

function caloriesOf(product) {
  return Math.round((product.kcalPer100 * product.grams) / 100);
}

function totalCalories() {
  return state.products.reduce((sum, p) => sum + caloriesOf(p), 0);
}

function formatNumber(n) {
  return n.toLocaleString("ru-RU");
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Отрисовка ----------

function renderList() {
  list.replaceChildren();

  for (const product of state.products) {
    const item = document.createElement("li");
    item.className = "item";

    const info = document.createElement("div");
    info.className = "item-info";

    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = product.name;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = `${formatNumber(product.grams)} г · ${formatNumber(product.kcalPer100)} ккал/100 г`;

    info.append(name, meta);

    const kcal = document.createElement("div");
    kcal.className = "item-kcal";
    kcal.textContent = `${formatNumber(caloriesOf(product))} ккал`;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.dataset.id = product.id;
    del.textContent = "×";
    del.setAttribute("aria-label", `Удалить «${product.name}»`);
    del.title = "Удалить";

    item.append(info, kcal, del);
    list.append(item);
  }

  const hasProducts = state.products.length > 0;
  empty.hidden = hasProducts;
  clearBtn.hidden = !hasProducts;
}

function renderGoal(total) {
  const percent = Math.min((total / state.goal) * 100, 100);
  const over = total > state.goal;

  progressFill.style.width = `${percent}%`;
  progress.setAttribute("aria-valuenow", String(Math.round(percent)));
  progress.classList.toggle("over", over);
  goalStatus.classList.toggle("over", over);

  if (over) {
    goalStatus.textContent = `Цель превышена на ${formatNumber(total - state.goal)} ккал`;
  } else {
    goalStatus.textContent = `Осталось ${formatNumber(state.goal - total)} ккал · ${Math.round(percent)}% от цели`;
  }

  // Не перезаписываем поле, пока пользователь его редактирует
  if (document.activeElement !== goalInput) {
    goalInput.value = state.goal;
  }
}

function render() {
  const total = totalCalories();
  renderList();
  totalEl.textContent = formatNumber(total);
  renderGoal(total);
}

// ---------- Обработчики ----------

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = form.elements.name.value.trim();
  const kcalPer100 = Number(form.elements.kcal.value);
  const grams = Number(form.elements.grams.value);

  if (!name) {
    formError.textContent = "Введите название продукта.";
    form.elements.name.focus();
    return;
  }
  if (form.elements.kcal.value === "" || !Number.isFinite(kcalPer100) || kcalPer100 < 0) {
    formError.textContent = "Укажите калорийность на 100 г (число от 0).";
    form.elements.kcal.focus();
    return;
  }
  if (!Number.isFinite(grams) || grams <= 0) {
    formError.textContent = "Укажите вес порции в граммах (больше 0).";
    form.elements.grams.focus();
    return;
  }

  formError.textContent = "";
  state.products.push({ id: makeId(), name, kcalPer100, grams });
  saveState();
  render();

  form.reset();
  form.elements.name.focus();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-btn");
  if (!button) return;

  state.products = state.products.filter((p) => p.id !== button.dataset.id);
  saveState();
  render();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("Удалить все продукты из списка?")) return;

  state.products = [];
  saveState();
  render();
});

goalInput.addEventListener("change", () => {
  const goal = Math.round(Number(goalInput.value));
  if (Number.isFinite(goal) && goal > 0) {
    state.goal = goal;
    saveState();
  }
  goalInput.value = state.goal;
  render();
});

render();
