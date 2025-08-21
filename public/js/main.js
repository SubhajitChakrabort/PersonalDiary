// --- Config ---
const apiBase = '/api/entries';

// Example bank/weekly holidays (YYYY-MM-DD). Customize per your country.
// You can extend this list or fetch from a public holiday API later.
const bankHolidays = new Set([
  // '2025-01-01', '2025-01-26', '2025-08-15', '2025-10-02'
]);

let current = new Date();
let monthEntries = []; // cache entries for current month

const calendarEl = document.getElementById('calendar');
const monthLabel = document.getElementById('monthLabel');
const viewEntriesBtn = document.getElementById('viewEntriesBtn');
const monthEntriesModal = document.getElementById('monthEntriesModal');
const monthEntriesList = document.getElementById('monthEntriesList');

document.getElementById('prevMonth').addEventListener('click', () => {
  current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  render();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  render();
});

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isToday(d) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

async function fetchMonthEntries(year, month) {
  const res = await fetch(`${apiBase}/month?year=${year}&month=${month}`);
  if (!res.ok) throw new Error('Failed to fetch entries');
  return res.json();
}

async function fetchDateEntries(dateStr) {
  const res = await fetch(`${apiBase}?date=${dateStr}`);
  if (!res.ok) throw new Error('Failed to fetch day entries');
  return res.json();
}

function populateMonthEntriesList(entries) {
  monthEntriesList.innerHTML = '';
  if (!entries.length) {
    monthEntriesList.innerHTML = '<div class="p-4 text-gray-500">No entries yet this month.</div>';
    return;
  }
  for (const e of entries) {
    const li = document.createElement('div');
    li.className = 'p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2';
    const dateStr = new Date(e.date).toISOString().slice(0,10);
    li.innerHTML = `
      <div class="min-w-0">
        <div class="text-sm text-gray-500">${dateStr}</div>
        <div class="font-semibold truncate">${(e.title || 'Untitled')}</div>
        <div class="text-xs text-gray-600">Mood: ${e.mood} | Tags: ${(e.tags||[]).join(', ')}</div>
      </div>
      <div class="flex-shrink-0 flex gap-2">
        <button class="px-3 py-1 bg-blue-600 text-white rounded" data-view="${e._id}">View</button>
        <button class="px-3 py-1 bg-yellow-500 text-white rounded" data-edit="${e._id}">Edit</button>
        <button class="px-3 py-1 bg-red-600 text-white rounded" data-del="${e._id}">Delete</button>
      </div>`;
    monthEntriesList.appendChild(li);
  }
}

function openMonthEntriesModal() {
  populateMonthEntriesList(monthEntries);
  monthEntriesModal.classList.remove('hidden');
  monthEntriesModal.classList.add('flex');
}

function closeMonthEntriesModal() {
  monthEntriesModal.classList.add('hidden');
  monthEntriesModal.classList.remove('flex');
}

if (viewEntriesBtn) {
  viewEntriesBtn.addEventListener('click', openMonthEntriesModal);
}

if (monthEntriesList) {
  monthEntriesList.addEventListener('click', async (ev) => {
    const target = ev.target;
    const vid = target.getAttribute('data-view');
    const eid = target.getAttribute('data-edit');
    const did = target.getAttribute('data-del');
    if (vid) return openViewModal(vid);
    if (eid) return openEditById(eid);
    if (did) return deleteById(did);
  });
}

async function render() {
  const year = current.getFullYear();
  const month = current.getMonth();
  monthLabel.textContent = current.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  monthEntries = await fetchMonthEntries(year, month + 1);
  // Month entries are now viewed via modal

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay(); // 0 Sun .. 6 Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarEl.innerHTML = '';

  // Add blanks for previous month days
  for (let i = 0; i < startDay; i++) {
    const cell = document.createElement('div');
    cell.className = 'h-20 md:h-24 bg-transparent';
    calendarEl.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = ymd(dateObj);
    const weekday = dateObj.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isHoliday = bankHolidays.has(dateStr);
    const hasEntry = monthEntries.some(e => new Date(e.date).toISOString().slice(0,10) === dateStr);

    const cell = document.createElement('button');
    cell.className = 'h-20 md:h-24 p-2 rounded border text-left relative hover:ring-2 hover:ring-blue-300 focus:outline-none';
    cell.style.backgroundColor = isHoliday ? '#fee2e2' : (isWeekend ? '#fef3c7' : '#ffffff');
    if (isToday(dateObj)) cell.classList.add('ring-2', 'ring-emerald-400');

    cell.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold">${d}</span>
        ${hasEntry ? '<span class="inline-block w-2 h-2 rounded-full bg-blue-600"></span>' : ''}
      </div>
      <div class="mt-2 text-xs text-gray-600">${isHoliday ? 'Holiday' : isWeekend ? (weekday===0?'Sunday':'Saturday') : ''}</div>
    `;

    cell.addEventListener('click', async () => {
      const dayEntries = await fetchDateEntries(dateStr);
      if (dayEntries.length) {
        // open first entry view; grid below shows all
        openViewModal(dayEntries[0]._id);
      } else {
        openCreateModal(dateStr);
      }
    });

    calendarEl.appendChild(cell);
  }
}

// ----- Modal handling -----
const entryModal = document.getElementById('entryModal');
const entryForm = document.getElementById('entryForm');
const entryDate = document.getElementById('entryDate');
const entryTitle = document.getElementById('entryTitle');
const entryContent = document.getElementById('entryContent');
const entryMood = document.getElementById('entryMood');
const entryTags = document.getElementById('entryTags');
const entryId = document.getElementById('entryId');
const entryModalTitle = document.getElementById('entryModalTitle');

function openCreateModal(dateStr) {
  entryId.value = '';
  entryModalTitle.textContent = 'New Entry';
  entryDate.value = dateStr;
  entryTitle.value = '';
  entryContent.value = '';
  entryMood.value = 'neutral';
  entryTags.value = '';
  entryModal.classList.remove('hidden');
  entryModal.classList.add('flex');
}

async function openEditById(id) {
  const res = await fetch(`${apiBase}/${id}`);
  const e = await res.json();
  entryId.value = e._id;
  entryModalTitle.textContent = 'Edit Entry';
  entryDate.value = new Date(e.date).toISOString().slice(0,10);
  entryTitle.value = e.title || '';
  entryContent.value = e.content || '';
  entryMood.value = e.mood || 'neutral';
  entryTags.value = (e.tags || []).join(', ');
  entryModal.classList.remove('hidden');
  entryModal.classList.add('flex');
}

function closeEntryModal() {
  entryModal.classList.add('hidden');
  entryModal.classList.remove('flex');
}

entryForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const payload = {
    date: entryDate.value,
    title: entryTitle.value,
    content: entryContent.value,
    mood: entryMood.value,
    tags: entryTags.value
  };
  const id = entryId.value;
  const res = await fetch(id ? `${apiBase}/${id}` : apiBase, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) { alert('Failed to save'); return; }
  closeEntryModal();
  render();
});

// View modal
const viewModal = document.getElementById('viewModal');
const viewTitle = document.getElementById('viewTitle');
const viewDate = document.getElementById('viewDate');
const viewMood = document.getElementById('viewMood');
const viewTags = document.getElementById('viewTags');
const viewContent = document.getElementById('viewContent');
const viewEditBtn = document.getElementById('viewEditBtn');
const viewDeleteBtn = document.getElementById('viewDeleteBtn');
let viewingId = null;

async function openViewModal(id) {
  const res = await fetch(`${apiBase}/${id}`);
  if (!res.ok) { alert('Not found'); return; }
  const e = await res.json();
  viewingId = e._id;
  viewTitle.textContent = e.title || 'Diary Entry';
  viewDate.textContent = new Date(e.date).toDateString();
  viewMood.textContent = e.mood || 'neutral';
  viewTags.textContent = (e.tags || []).join(', ');
  viewContent.textContent = e.content || '';
  viewModal.classList.remove('hidden');
  viewModal.classList.add('flex');
}

function closeViewModal() {
  viewModal.classList.add('hidden');
  viewModal.classList.remove('flex');
}

viewEditBtn.addEventListener('click', async () => {
  if (!viewingId) return;
  closeViewModal();
  await openEditById(viewingId);
});

async function deleteById(id) {
  if (!confirm('Delete this entry?')) return;
  const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
  if (!res.ok) { alert('Failed to delete'); return; }
  closeViewModal();
  render();
}

viewDeleteBtn.addEventListener('click', async () => {
  if (!viewingId) return;
  await deleteById(viewingId);
});

// Init
render();
