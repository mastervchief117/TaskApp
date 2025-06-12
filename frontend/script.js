/* ====== ZMIENNE GLOBALNE ====== */
let previousView = 'pulpit-view'; // globalnie: zapamiętujemy skąd przeszliśmy
let selectedPriorityColor = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let edytowanyElement = null;
let calendarTarget = null;
let startScreen = 'Pulpit';

/* ====== FUNKCJE WIDOKÓW ====== */

// Pokazuje wybrany widok (SPA)
function showView(id, clicked = null) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (clicked) {
    clicked.classList.add('active');
  } else {
    const navItems = document.querySelectorAll('.nav-item');
    if (id === 'pulpit-view') navItems[0].classList.add('active');
    if (id === 'zadania-view') navItems[1].classList.add('active');
  }
  updateBottomNavVisibility(id);

  if (id == 'pulpit-view') {
    ustawDzisiejszaDate();
  }
}

// Przełącza zakładki (Nadchodzące/Ukończone)
function switchTab(isUpcoming) {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  tabs[isUpcoming ? 0 : 1].classList.add('active');

  updateTaskVisibility();
  updateTaskCounters();
}

/* ====== FORMULARZ: DODAWANIE ZADANIA ====== */

// Otwiera formularz z odpowiedniego miejsca
function openAddTask(originId) {
  previousView = originId;
  showView('dodaj-zadanie');
}

// Powrót z formularza (Strzałka/Anuluj)
function goBack() {
  clearForm();
  showView(previousView);
}

// Obsługa przycisku Zapisz
function zapiszZadanie(event) {
  event.preventDefault();

  const titleValue = document.getElementById('title').value.trim();
  const descriptionValue = document.getElementById('description').value.trim();
  const dateValue = document.getElementById('selected-date').textContent;
  const priorityValue = document.getElementById('selected-priority').textContent;

  if (!titleValue || !descriptionValue || dateValue === '--.--.----' || priorityValue === '-' || !selectedPriorityColor) {
    showFormError("Uzupełnij wszystkie pola");
    return;
  }

  const taskElement = document.createElement('div');
  taskElement.classList.add('task-card');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.classList.add('task-checkbox');

  const dot = document.createElement('div');
  dot.classList.add('task-dot');
dot.style.backgroundColor = selectedPriorityColor;
dot.setAttribute('data-priority-color', selectedPriorityColor);

const titleEl = document.createElement('div');
titleEl.classList.add('task-title');
titleEl.appendChild(dot);
titleEl.append(document.createTextNode(titleValue));

const dateEl = document.createElement('div');
dateEl.classList.add('task-date');
dateEl.textContent = dateValue;

const descriptionEl = document.createElement('div');
descriptionEl.classList.add('task-desc');
descriptionEl.textContent = descriptionValue;

const textBlock = document.createElement('div');
textBlock.classList.add('task-text');
textBlock.appendChild(titleEl);
textBlock.appendChild(dateEl);
textBlock.appendChild(descriptionEl);

const editIcon = document.createElement('img');
editIcon.src = 'assets/Edit 2.svg';
editIcon.alt = 'Edytuj';
editIcon.classList.add('task-edit');
editIcon.onclick = () => openEditTask(taskElement);

const leftSide = document.createElement('div');
leftSide.classList.add('task-left');
leftSide.appendChild(checkbox);
leftSide.appendChild(textBlock);

taskElement.appendChild(leftSide);
taskElement.appendChild(editIcon);

const upcomingList = document.getElementById('upcoming-tasks');
if (upcomingList.textContent.includes('Brak zadań')) {
  upcomingList.textContent = '';
}

upcomingList.appendChild(taskElement);
zapiszZadaniaDoLocalStorage();

// Checkbox - przenoszenie do "Ukończone"
checkbox.addEventListener('change', () => {
  const doneList = document.getElementById('done-tasks');
  const originalColor = dot.getAttribute('data-priority-color');

  if (checkbox.checked) {
    dot.style.backgroundColor = '#22D337';
    doneList.appendChild(taskElement);
  } else {
    dot.style.backgroundColor = originalColor;
    upcomingList.appendChild(taskElement);
  }

  updateTaskVisibility();
  updateTaskCounters();
});

clearForm();
updateTaskCounters();
zapiszZadaniaDoLocalStorage();
showView('zadania-view');
switchTab(true);
}

/* ====== WIDOCZNOŚĆ NAWIGACJI DOLNEJ ====== */

function updateBottomNavVisibility(currentId) {
  const bottomNav = document.querySelector('.bottom-nav');
  if (['dodaj-zadanie', 'edytuj-zadanie', 'ustawienia-view', 'start-screen'].includes(currentId)) {
    bottomNav.style.display = 'none';
  } else {
    bottomNav.style.display = 'flex';
  }
}

/* ====== FORMULARZ: CZYSZCZENIE PÓL ====== */

function clearForm() {
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('selected-date').textContent = '--.--.----';
  document.getElementById('selected-priority').textContent = '-';
  selectedPriorityColor = null;
}

/* ====== ROZWIJANA LISTA PRIORYTETU ====== */

function togglePriorityDropdown() {
  const dropdown = document.getElementById('priority-options');
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function selectPriority(name, color) {
  document.getElementById('selected-priority').textContent = name;
  selectedPriorityColor = color;
  document.getElementById('priority-options').style.display = 'none';
}

/* ====== WIDOCZNOŚĆ ZADAŃ: NADCHODZĄCE vs UKOŃCZONE ====== */

function updateTaskVisibility() {
  const upcomingList = document.getElementById('upcoming-tasks');
  const doneList = document.getElementById('done-tasks');
  const isUpcomingActive = document.querySelector('.tab.active').textContent === 'Nadchodzące';

  upcomingList.classList.toggle('hidden', !isUpcomingActive);
  doneList.classList.toggle('hidden', isUpcomingActive);

  // Czyści tekst "Brak zadań", jeśli obecne
  if (upcomingList.textContent === 'Brak zadań') {
    upcomingList.textContent = '';
  }
  if (doneList.textContent === 'Brak zadań') {
    doneList.textContent = '';
  }
}

/* ====== LICZNIKI ZADAŃ (karty na Pulpicie)====== */

function updateTaskCounters() {
  const upcomingCount = document.getElementById('upcoming-tasks').children.length;
  const doneCount = document.getElementById('done-tasks').children.length;

  document.getElementById('count-upcoming').textContent = formatTaskLabel(upcomingCount);
  document.getElementById('count-done').textContent = formatTaskLabel(doneCount);
}

/* ====== POPUP KALENDARZA ====== */

function toggleCalendar(target = 'add') {
  calendarTarget = target;
  document.getElementById('calendar-overlay').classList.remove('hidden');
  generateCalendar(currentMonth, currentYear);
}

function closeCalendar() {
  document.getElementById('calendar-overlay').classList.add('hidden');
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateCalendar(currentMonth, currentYear);
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  generateCalendar(currentMonth, currentYear);
}

function generateCalendar(month, year) {
  const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const daysContainer = document.getElementById('calendar-days');
  const monthLabel = document.getElementById('calendar-month');

  daysContainer.innerHTML = '';
  monthLabel.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = ['PO', 'WT', 'ŚR', 'CZ', 'PT', 'SO', 'ND'];
  weekdays.forEach(day => {
    const el = document.createElement('div');
    el.textContent = day;
    el.style.fontWeight = 'bold';
    daysContainer.appendChild(el);
  });

  for (let i = 1; i < (firstDay === 0 ? 7 : firstDay); i++) {
    daysContainer.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement('div');
    dayEl.classList.add('day');
  
    const today = new Date();
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    if (isToday) {
      dayEl.classList.add('today');
    }
  
    dayEl.textContent = d;
    dayEl.onclick = () => {
      const formatted = `${d.toString().padStart(2, '0')}.${(month + 1).toString().padStart(2, '0')}.${year}`;
      if (calendarTarget === 'edit') {
        document.getElementById('edit-selected-date').textContent = formatted;
      } else {
        document.getElementById('selected-date').textContent = formatted;
      }
      closeCalendar();
    };    
  
    daysContainer.appendChild(dayEl);
  }
}

/* ====== POPUP FILTRA ZADAŃ ====== */

function openFilter() {
  toggleFilter();
  document.getElementById('filter-overlay').classList.remove('hidden');
}

function toggleFilter() {
  const isUpcoming = document.querySelector('.tab.active').textContent === 'Nadchodzące';
  document.getElementById('filter-options-upcoming').classList.toggle('hidden', !isUpcoming);
  document.getElementById('filter-options-done').classList.toggle('hidden', isUpcoming);
}

function closeFilter() {
  document.getElementById('filter-overlay').classList.add('hidden');
}
function applyFilter() {
  const isUpcoming = document.querySelector('.tab.active').textContent === 'Nadchodzące';

  if (isUpcoming) {
    const dateSort = document.querySelector('input[name="date-sort"]:checked')?.value;
    const priorityFilter = document.querySelector('input[name="priority-filter"]:checked')?.value;

    const upcomingList = document.getElementById('upcoming-tasks');
    const tasks = Array.from(upcomingList.children);

    tasks.sort((a, b) => {
      const dateA = new Date(a.querySelector('.task-date').textContent.split('.').reverse().join('-'));
      const dateB = new Date(b.querySelector('.task-date').textContent.split('.').reverse().join('-'));
      return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
    });

    tasks.forEach(task => upcomingList.appendChild(task));

    function rgbToHex(rgb) {
      const match = rgb.match(/\d+/g);
      if (!match || match.length < 3) return null;
      return "#" + match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    tasks.forEach(task => {
      const dot = task.querySelector('.task-dot');
      const taskColor = rgbToHex(dot?.style.backgroundColor);
      if (priorityFilter === 'all') {
        task.style.display = 'flex';
      } else {
        task.style.display = (taskColor === priorityFilter.toUpperCase()) ? 'flex' : 'none';
      }
    });

  } else {
    const doneSort = document.querySelector('input[name="done-sort"]:checked')?.value;
    const doneList = document.getElementById('done-tasks');
    const doneTasks = Array.from(doneList.children);

    doneTasks.sort((a, b) => {
      const dateA = new Date(a.querySelector('.task-date').textContent.split('.').reverse().join('-'));
      const dateB = new Date(b.querySelector('.task-date').textContent.split('.').reverse().join('-'));
      return doneSort === 'asc' ? dateA - dateB : dateB - dateA;
    });

    doneTasks.forEach(task => doneList.appendChild(task));
  }

  closeFilter();
}

/* ====== LICZBA ZADAŃ (format tekstu) ====== */

function formatTaskLabel(count) {
  if (count === 1) return '1 zadanie';
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return `${count} zadania`;
  }
  return `${count} zadań`;
}

/* ====== KALENDARZ: ZAMYKANIE PO KLINIĘCIU W TŁO ====== */

document.getElementById('calendar-overlay').addEventListener('click', function (event) {
  const popup = document.querySelector('.calendar-popup');
  // Jeśli kliknięto dokładnie w overlay (tło), zamknij kalendarz
  if (event.target.id === 'calendar-overlay') {
    closeCalendar();
  }
});

/* ====== EDYCJA ZADANIA ====== */

function openEditTask(taskElement) {
  previousView = 'zadania-view';
  edytowanyElement = taskElement;

  const title = taskElement.querySelector('.task-title').innerText.trim();
  const description = taskElement.querySelector('.task-desc').innerText.trim();
  const date = taskElement.querySelector('.task-date').innerText.trim();
  const dot = taskElement.querySelector('.task-dot');
  const priority = dot.getAttribute('data-priority-color');

  document.getElementById('edit-title').value = title;
  document.getElementById('edit-description').value = description;
  document.getElementById('edit-selected-date').textContent = date;
  document.getElementById('edit-selected-priority').textContent = getPriorityName(priority);
  selectedPriorityColor = priority;
  
  document.getElementById('edit-priority-options').classList.add('hidden');
  showView('edytuj-zadanie');
}

function getPriorityName(color) {
  switch (color.toUpperCase()) {
    case '#FE0000': return 'Wysoki';
    case '#FEA500': return 'Średni';
    case '#D1D5DB': return 'Niski';
    default: return '-';
  }
}

function zapiszEdytowaneZadanie(e) {
  e.preventDefault();
  if (!edytowanyElement) return;

  const title = document.getElementById('edit-title').value.trim();
  const desc = document.getElementById('edit-description').value.trim();
  const date = document.getElementById('edit-selected-date').textContent.trim();
  const priorityName = document.getElementById('edit-selected-priority').textContent.trim();

  if (!title || !desc || date === '--.--.----' || priorityName === '-' || !selectedPriorityColor) {
    alert("Uzupełnij wszystkie pola");
    return;
  }

  const titleElement = edytowanyElement.querySelector('.task-title');
  const dot = titleElement.querySelector('.task-dot');
  titleElement.innerHTML = '';
  titleElement.appendChild(dot);
  titleElement.append(document.createTextNode(title));

  edytowanyElement.querySelector('.task-desc').textContent = desc;
  edytowanyElement.querySelector('.task-date').textContent = date;

  dot.style.backgroundColor = selectedPriorityColor;
  dot.setAttribute('data-priority-color', selectedPriorityColor);

  edytowanyElement = null;
  selectedPriorityColor = null;

  updateTaskCounters();
  zapiszZadaniaDoLocalStorage();
  showView('zadania-view');
  switchTab(true);
}

/* ====== USUWANIE ZADANIA ====== */

function usunZadanie() {
  if (edytowanyElement) {
    edytowanyElement.remove();
    edytowanyElement = null;
    updateTaskCounters();
    zapiszZadaniaDoLocalStorage();
    showView('zadania-view');
  }
}

/* ====== FUNKCJA POWROTU (Z formularza lub ustawień) ====== */

function goBack() {
  // Czyszczenie formularza dodawania
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('selected-date').textContent = '--.--.----';
  document.getElementById('selected-priority').textContent = '-';

  // Czyszczenie formularza edycji
  document.getElementById('edit-title').value = '';
  document.getElementById('edit-description').value = '';
  document.getElementById('edit-selected-date').textContent = '--.--.----';
  document.getElementById('edit-selected-priority').textContent = '-';
  document.getElementById('edit-priority-options').classList.add('hidden');
  selectedPriorityColor = null;
  edytowanyElement = null;

  showView(previousView || 'pulpit-view');
}

/* ====== EDYCJA PRIORYTETU (W trybie edycji zadania) ====== */

function selectEditPriority(name, color) {
  document.getElementById('edit-selected-priority').textContent = name;
  selectedPriorityColor = color;
  document.getElementById('edit-priority-options').classList.add('hidden');
}

function toggleEditPriorityDropdown() {
  const dropdown = document.getElementById('edit-priority-options');
  dropdown.classList.toggle('hidden');
}

calendarTarget = 'edit';

/* ====== OTWARCIE WIDOKU USTAWIEŃ ====== */

function openSettings() {
  previousView = document.querySelector('.view:not(.hidden)')?.id || 'pulpit-view';

  const savedEmail = localStorage.getItem('userEmail') || '';
  const savedName = localStorage.getItem('userName') || '';
  const savedStartScreen = localStorage.getItem('startScreen') || 'Pulpit';

  document.getElementById('email').value = savedEmail;
  document.getElementById('username').value = savedName;
  document.getElementById('selected-start-screen').textContent = savedStartScreen;

  if (savedName) {
    document.querySelector('.welcome').textContent = `Witaj, ${savedName}!`;
  }

  showView('ustawienia-view');
}

/* ====== DROPDOWN STARTOWEGO EKRANU (USTAWIENIA) ====== */

function toggleStartScreenDropdown() {
  document.getElementById('start-screen-options').classList.toggle('hidden');
}

function selectStartScreen(name) {
  document.getElementById('selected-start-screen').textContent = name;
  document.getElementById('start-screen-options').classList.add('hidden');
}

/* ====== ZAPISZ USTAWIENIA (Do localStorage)====== */

function zapiszUstawienia(e) {
  e.preventDefault();

  const name = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const start = document.getElementById('selected-start-screen').textContent;

  localStorage.setItem('userName', name);
  localStorage.setItem('userEmail', email);
  localStorage.setItem('startScreen', start);

  if (name) {
    document.querySelector('.welcome').textContent = `Witaj, ${name}!`;
  }

  showView(previousView || 'pulpit-view');
}

/* ====== INICJALIZACJA STRONY PO ZAŁADOWANIU ====== */
window.onload = () => {
  const savedName = localStorage.getItem('userName');
  const savedEmail = localStorage.getItem('userEmail');

  document.getElementById('start-screen').classList.add('loaded');
  document.getElementById('save-task-button').addEventListener('click', zapiszZadanie);
  document.getElementById('save-settings-button').addEventListener('click', zapiszUstawienia);

  if (!savedName || !savedEmail) {
    showView('start-screen');
  } else {
    document.querySelector('.welcome').textContent = `Witaj, ${savedName}!`;

    showView(localStorage.getItem('startScreen') === 'Lista zadań' ? 'zadania-view' : 'pulpit-view');

    // Poczekaj aż widok zostanie załadowany, dopiero potem ustaw datę
    requestAnimationFrame(() => {
      ustawDzisiejszaDate();
    });

    zaladujZadaniaZLocalStorage();
  }
};

function zapiszDaneStartowe(event) {
  event.preventDefault();

  const name = document.getElementById('start-name').value.trim();
  const email = document.getElementById('start-email').value.trim();

  if (!name || !email) {
    showFormError("Uzupełnij wszystkie pola");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFormError("Wpisz poprawny adres e-mail");
    return;
  }

  localStorage.setItem('userName', name);
  localStorage.setItem('userEmail', email);

  document.querySelector('.welcome').textContent = `Witaj, ${name}!`;

  showView('pulpit-view');
}

/* ====== USTAW DZISIEJSZĄ DATĘ I DZIEŃ TYGODNIA NA PULPICIE ====== */

function ustawDzisiejszaDate() {
  const today = new Date();
  const dni = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const numerDnia = today.getDay();
  const dzienTygodnia = dni[numerDnia];
  
  const formatted =
    today.getDate().toString().padStart(2, '0') + '.' +
    (today.getMonth() + 1).toString().padStart(2, '0') + '.' +
    today.getFullYear();

  const dateEl = document.getElementById('current-date');
  const dayEl = document.getElementById('current-weekday');

  if (dateEl && dayEl) {
    dateEl.textContent = formatted;
    dayEl.textContent = dzienTygodnia;
  }
}

/* ====== LOCALSTORAGE: ZAPIS I WCZYTWANIE ZADAŃ ====== */

// Zapisuje aktualną listę zadań (Nadchodzące i ukończone) do localStorage
function zapiszZadaniaDoLocalStorage() {
  const allTasks = [];
  const lists = ['upcoming-tasks', 'done-tasks'];

  lists.forEach(listId => {
    const isDone = listId === 'done-tasks';
    const list = document.getElementById(listId);
    Array.from(list.children).forEach(task => {
      allTasks.push({
        title: task.querySelector('.task-title').innerText.trim(),
        desc: task.querySelector('.task-desc').innerText.trim(),
        date: task.querySelector('.task-date').innerText.trim(),
        priority: task.querySelector('.task-dot').getAttribute('data-priority-color'),
        done: isDone
      });
    });
  });

  localStorage.setItem('tasks', JSON.stringify(allTasks));
}

// Ładuje zadania z localStorage przy starcie aplikacji
function zaladujZadaniaZLocalStorage() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const upcomingList = document.getElementById('upcoming-tasks');
  const doneList = document.getElementById('done-tasks');

  tasks.forEach(t => {
    const taskElement = stworzElementZadania(t.title, t.desc, t.date, t.priority);
    const checkbox = taskElement.querySelector('input[type="checkbox"]');
    
    if (t.done) {
      checkbox.checked = true;
      taskElement.querySelector('.task-dot').style.backgroundColor = '#22D337';
      doneList.appendChild(taskElement);
    } else {
      upcomingList.appendChild(taskElement);
    }
  });

  updateTaskVisibility();
  updateTaskCounters();
}

// Tworzy kafelek zadania z pełną strukturą HTML i obsługą checkboxa
function stworzElementZadania(title, desc, date, priorityColor) {
  const taskElement = document.createElement('div');
  taskElement.classList.add('task-card');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.classList.add('task-checkbox');

  const dot = document.createElement('div');
  dot.classList.add('task-dot');
  dot.style.backgroundColor = priorityColor;
  dot.setAttribute('data-priority-color', priorityColor);

  const titleEl = document.createElement('div');
  titleEl.classList.add('task-title');
  titleEl.appendChild(dot);
  titleEl.append(document.createTextNode(title));

  const dateEl = document.createElement('div');
  dateEl.classList.add('task-date');
  dateEl.textContent = date;

  const descriptionEl = document.createElement('div');
  descriptionEl.classList.add('task-desc');
  descriptionEl.textContent = desc;

  const textBlock = document.createElement('div');
  textBlock.classList.add('task-text');
  textBlock.appendChild(titleEl);
  textBlock.appendChild(dateEl);
  textBlock.appendChild(descriptionEl);

  const editIcon = document.createElement('img');
  editIcon.src = 'assets/Edit 2.svg';
  editIcon.alt = 'Edytuj';
  editIcon.classList.add('task-edit');
  editIcon.onclick = () => openEditTask(taskElement);

  const leftSide = document.createElement('div');
  leftSide.classList.add('task-left');
  leftSide.appendChild(checkbox);
  leftSide.appendChild(textBlock);

  taskElement.appendChild(leftSide);
  taskElement.appendChild(editIcon);

  // Obsługa checkboxa: przenosi zadanie między listami
  checkbox.addEventListener('change', () => {
    const doneList = document.getElementById('done-tasks');
    const upcomingList = document.getElementById('upcoming-tasks');
    const originalColor = dot.getAttribute('data-priority-color');

    if (checkbox.checked) {
      dot.style.backgroundColor = '#22D337'; // zielony
      doneList.appendChild(taskElement);
    } else {
      dot.style.backgroundColor = originalColor;
      upcomingList.appendChild(taskElement);
    }

    updateTaskVisibility();
    updateTaskCounters();
    zapiszZadaniaDoLocalStorage();
  });

  return taskElement;
}
// Czekaj na załadowanie tła zanim pokażesz ekran startowy
const bgImage = new Image();
bgImage.src = "assets/Tło.svg";

bgImage.onload = () => {
  const savedName = localStorage.getItem('userName');
  const savedEmail = localStorage.getItem('userEmail');
  document.getElementById('start-screen').classList.add('loaded');

  if (!savedName || !savedEmail) {
    showView('start-screen');
  } else {
    document.querySelector('.welcome').textContent = `Witaj, ${savedName}!`;
    ustawDzisiejszaDate();
    zaladujZadaniaZLocalStorage();
    showView(localStorage.getItem('startScreen') === 'Lista zadań' ? 'zadania-view' : 'pulpit-view');
  }
};

function showFormError(message) {
  const alertBox = document.getElementById('form-error');
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');
  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 2500);
}
