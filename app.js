const COST = 80;
const STORAGE_KEY = "tiffin-tracker-v1";

const $ = (id) => document.getElementById(id);

/* -------------------------------- */
/* DATE HELPERS                     */
/* -------------------------------- */

function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso, amount) {
  const date = parseISO(iso);

  date.setDate(date.getDate() + amount);

  return todayISO(date);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

/* -------------------------------- */
/* STORAGE                          */
/* -------------------------------- */

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {
        days: {},
      };
    }

    const data = JSON.parse(raw);

    return {
      days: data.days || {},
    };
  } catch {
    return {
      days: {},
    };
  }
}

function save(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function dayRecord(state, iso) {
  return (
    state.days[iso] || {
      lunch: false,
      dinner: false,
    }
  );
}

function mealCount(record) {
  return (
    Number(!!record.lunch) +
    Number(!!record.dinner)
  );
}

/* -------------------------------- */
/* STATE                            */
/* -------------------------------- */

const state = load();

let selectedDay = todayISO();

const calendarDate = new Date();
calendarDate.setDate(1);

const billDate = new Date();
billDate.setDate(1);

/* -------------------------------- */
/* TOTALS                           */
/* -------------------------------- */

function totals() {
  let count = 0;
  let monthCount = 0;

  const prefix = selectedDay.slice(0, 7);

  for (const [iso, record] of Object.entries(
    state.days
  )) {
    const number = mealCount(record);

    count += number;

    if (iso.startsWith(prefix)) {
      monthCount += number;
    }
  }

  return {
    count,
    monthCount,
    spend: count * COST,
  };
}

/* -------------------------------- */
/* DAY UI                           */
/* -------------------------------- */

function renderTicks() {
  const record = dayRecord(
    state,
    selectedDay
  );

  for (const meal of ["lunch", "dinner"]) {
    const taken = !!record[meal];

    const card = $(`${meal}Card`);
    const button = $(`${meal}Tick`);

    card.classList.toggle(
      "taken",
      taken
    );

    button.classList.toggle(
      "taken",
      taken
    );

    if (taken) {
      button.textContent =
        meal === "lunch"
          ? "Lunch taken · tap to undo"
          : "Dinner taken · tap to undo";
    } else {
      button.textContent =
        meal === "lunch"
          ? "Mark lunch"
          : "Mark dinner";
    }
  }
}

function renderDayMeta() {
  const today = todayISO();

  const isToday =
    selectedDay === today;

  const isYesterday =
    selectedDay ===
    addDays(today, -1);

  $("dayLabel").textContent =
    isToday
      ? "Today"
      : isYesterday
      ? "Yesterday"
      : "Selected day";

  $("dayDate").textContent =
    parseISO(
      selectedDay
    ).toLocaleDateString(
      undefined,
      {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  $("nextDay").disabled =
    isToday;

  const record =
    dayRecord(
      state,
      selectedDay
    );

  $("daySpend").textContent =
    `₹${mealCount(record) * COST}`;
}

function renderStats() {
  const {
    count,
    monthCount,
    spend,
  } = totals();

  $("totalCount").textContent =
    String(count);

  $("monthCount").textContent =
    String(monthCount);

  $("totalSpend").textContent =
    `₹${spend}`;
}

/* -------------------------------- */
/* CALENDAR                         */
/* -------------------------------- */

function renderCalendar() {
  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  $("calendarMonth").textContent =
    calendarDate.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric",
      }
    );

  const grid =
    $("calendarGrid");

  grid.innerHTML = "";

  /* Empty cells before day 1 */

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "calendar-day empty";

    grid.appendChild(empty);
  }

  const today =
    todayISO();

  const currentMonth =
    new Date();

  currentMonth.setDate(1);

  const viewingFutureMonth =
    calendarDate >
    currentMonth;

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    const date =
      new Date(
        year,
        month,
        day
      );

    const iso =
      todayISO(date);

    const isFuture =
      iso > today;

    const record =
      dayRecord(
        state,
        iso
      );

    const lunchTaken =
      !!record.lunch;

    const dinnerTaken =
      !!record.dinner;

    const cell =
      document.createElement(
        "button"
      );

    cell.type = "button";

    cell.className =
      "calendar-day";

    if (
      iso === today
    ) {
      cell.classList.add(
        "today"
      );
    }

    if (
      iso === selectedDay
    ) {
      cell.classList.add(
        "selected"
      );
    }

    /*
      Future days are left blank.
      We don't call an upcoming day
      "missed" before it happens.
    */

    if (
      isFuture ||
      viewingFutureMonth
    ) {
      cell.classList.add(
        "future"
      );
    }

    const number =
      document.createElement(
        "span"
      );

    number.className =
      "calendar-number";

    number.textContent =
      String(day);

    const marks =
      document.createElement(
        "span"
      );

    marks.className =
      "calendar-meals";

    if (
      !isFuture &&
      !viewingFutureMonth
    ) {
      const lunch =
        document.createElement(
          "span"
        );

      lunch.className =
        lunchTaken
          ? "meal-mark lunch"
          : "meal-mark missed";

      lunch.textContent =
        lunchTaken
          ? "✓"
          : "×";

      lunch.title =
        lunchTaken
          ? "Lunch taken"
          : "Lunch missed";

      const dinner =
        document.createElement(
          "span"
        );

      dinner.className =
        dinnerTaken
          ? "meal-mark dinner"
          : "meal-mark missed";

      dinner.textContent =
        dinnerTaken
          ? "✓"
          : "×";

      dinner.title =
        dinnerTaken
          ? "Dinner taken"
          : "Dinner missed";

      marks.append(
        lunch,
        dinner
      );
    }

    cell.append(
      number,
      marks
    );

    if (
      !isFuture &&
      !viewingFutureMonth
    ) {
      cell.addEventListener(
        "click",
        () => {
          selectedDay = iso;

          render();

          document
            .querySelector(
              ".meals"
            )
            .scrollIntoView({
              behavior:
                "smooth",
              block:
                "nearest",
            });
        }
      );
    } else {
      cell.disabled = true;
    }

    grid.appendChild(cell);
  }
}

/* -------------------------------- */
/* CALENDAR NAVIGATION              */
/* -------------------------------- */

$("calendarPrev")
  .addEventListener(
    "click",
    () => {
      calendarDate.setMonth(
        calendarDate.getMonth() - 1
      );

      renderCalendar();
    }
  );

$("calendarNext")
  .addEventListener(
    "click",
    () => {
      const next =
        new Date(
          calendarDate
        );

      next.setMonth(
        next.getMonth() + 1
      );

      const current =
        new Date();

      current.setDate(1);

      if (
        next > current
      ) {
        return;
      }

      calendarDate.setTime(
        next.getTime()
      );

      renderCalendar();
    }
  );

/* -------------------------------- */
/* MONTHLY BILL                     */
/* -------------------------------- */

function calculateMonth(
  date
) {
  const prefix =
    monthKey(date);

  let lunch = 0;
  let dinner = 0;

  for (
    const [
      iso,
      record
    ] of Object.entries(
      state.days
    )
  ) {
    if (
      !iso.startsWith(prefix)
    ) {
      continue;
    }

    if (record.lunch) {
      lunch++;
    }

    if (record.dinner) {
      dinner++;
    }
  }

  const count =
    lunch + dinner;

  const total =
    count * COST;

  return {
    lunch,
    dinner,
    count,
    total,
  };
}

function renderBill() {
  $("billMonth").textContent =
    billDate.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric",
      }
    );

  const {
    lunch,
    dinner,
    count,
    total,
  } = calculateMonth(
    billDate
  );

  $("billLunch").textContent =
    String(lunch);

  $("billDinner").textContent =
    String(dinner);

  $("billCount").textContent =
    String(count);

  $("billTotal").textContent =
    `₹${total}`;
}

$("billPrev")
  .addEventListener(
    "click",
    () => {
      billDate.setMonth(
        billDate.getMonth() - 1
      );

      renderBill();
    }
  );

$("billNext")
  .addEventListener(
    "click",
    () => {
      const next =
        new Date(
          billDate
        );

      next.setMonth(
        next.getMonth() + 1
      );

      const current =
        new Date();

      current.setDate(1);

      if (
        next > current
      ) {
        return;
      }

      billDate.setTime(
        next.getTime()
      );

      renderBill();
    }
  );

/* -------------------------------- */
/* COPY BILL MESSAGE                */
/* -------------------------------- */

function createBillMessage() {
  const {
    lunch,
    dinner,
    count,
    total,
  } = calculateMonth(
    billDate
  );

  const monthName =
    billDate.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric",
      }
    );

  return `Hello Aunty,

${monthName} month's tiffin calculation:

Lunch: ${lunch}
Dinner: ${dinner}
Total Tiffins: ${count}
Rate: ₹${COST}/tiffin

Total: ₹${total}

Thank you 😊`;
}

$("copyBillBtn")
  .addEventListener(
    "click",
    async () => {
      const message =
        createBillMessage();

      const status =
        $("copyStatus");

      try {
        await navigator
          .clipboard
          .writeText(
            message
          );

        status.textContent =
          "Bill message copied ✓";
      } catch {
        /*
          Fallback for browsers
          where clipboard API isn't
          available.
        */

        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          message;

        document.body.appendChild(
          textarea
        );

        textarea.select();

        try {
          document.execCommand(
            "copy"
          );

          status.textContent =
            "Bill message copied ✓";
        } catch {
          status.textContent =
            "Could not copy automatically.";
        }

        textarea.remove();
      }

      setTimeout(() => {
        status.textContent = "";
      }, 2500);
    }
  );

/* -------------------------------- */
/* HISTORY                          */
/* -------------------------------- */

function renderHistory() {
  const items =
    Object.entries(
      state.days
    )
      .filter(
        ([, record]) =>
          mealCount(record) > 0
      )
      .sort(
        (a, b) =>
          a[0] < b[0] ? 1 : -1
      )
      .slice(0, 14);

  const list =
    $("historyList");

  list.innerHTML = "";

  if (!items.length) {
    const li =
      document.createElement(
        "li"
      );

    li.className = "empty";

    li.textContent =
      "No tiffins marked yet.";

    list.appendChild(li);

    return;
  }

  for (
    const [
      iso,
      record
    ] of items
  ) {
    const li =
      document.createElement(
        "li"
      );

    const left =
      document.createElement(
        "span"
      );

    const parts = [];

    if (record.lunch) {
      parts.push("Lunch");
    }

    if (record.dinner) {
      parts.push("Dinner");
    }

    left.textContent =
      `${parseISO(
        iso
      ).toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "short",
        }
      )} · ${parts.join(
        " + "
      )}`;

    const right =
      document.createElement(
        "span"
      );

    right.textContent =
      `₹${mealCount(record) * COST}`;

    li.append(
      left,
      right
    );

    li.addEventListener(
      "click",
      () => {
        selectedDay = iso;

        const date =
          parseISO(iso);

        calendarDate.setFullYear(
          date.getFullYear(),
          date.getMonth(),
          1
        );

        render();
      }
    );

    list.appendChild(li);
  }
}

/* -------------------------------- */
/* MAIN RENDER                      */
/* -------------------------------- */

function render() {
  renderTicks();
  renderDayMeta();
  renderStats();
  renderCalendar();
  renderBill();
  renderHistory();
}

/* -------------------------------- */
/* TOGGLE MEAL                      */
/* -------------------------------- */

function toggleMeal(
  meal
) {
  const record = {
    ...dayRecord(
      state,
      selectedDay
    ),
  };

  record[meal] =
    !record[meal];

  if (
    !record.lunch &&
    !record.dinner
  ) {
    delete state.days[
      selectedDay
    ];
  } else {
    state.days[
      selectedDay
    ] = record;
  }

  save(state);

  render();
}

/* -------------------------------- */
/* DAY BUTTONS                     */
/* -------------------------------- */

$("lunchTick")
  .addEventListener(
    "click",
    () => {
      toggleMeal("lunch");
    }
  );

$("dinnerTick")
  .addEventListener(
    "click",
    () => {
      toggleMeal("dinner");
    }
  );

$("prevDay")
  .addEventListener(
    "click",
    () => {
      selectedDay =
        addDays(
          selectedDay,
          -1
        );

      const date =
        parseISO(
          selectedDay
        );

      calendarDate.setFullYear(
        date.getFullYear(),
        date.getMonth(),
        1
      );

      render();
    }
  );

$("nextDay")
  .addEventListener(
    "click",
    () => {
      if (
        selectedDay ===
        todayISO()
      ) {
        return;
      }

      selectedDay =
        addDays(
          selectedDay,
          1
        );

      if (
        selectedDay >
        todayISO()
      ) {
        selectedDay =
          todayISO();
      }

      const date =
        parseISO(
          selectedDay
        );

      calendarDate.setFullYear(
        date.getFullYear(),
        date.getMonth(),
        1
      );

      render();
    }
  );

/* -------------------------------- */
/* RESET                            */
/* -------------------------------- */

$("resetBtn")
  .addEventListener(
    "click",
    () => {
      if (
        !confirm(
          "Clear every tiffin tick and start from zero?"
        )
      ) {
        return;
      }

      state.days = {};

      save(state);

      selectedDay =
        todayISO();

      const current =
        new Date();

      calendarDate.setFullYear(
        current.getFullYear(),
        current.getMonth(),
        1
      );

      billDate.setFullYear(
        current.getFullYear(),
        current.getMonth(),
        1
      );

      render();
    }
  );

/* -------------------------------- */
/* INITIALIZE                       */
/* -------------------------------- */

$("rate").textContent =
  String(COST);

render();

/* -------------------------------- */
/* PWA INSTALL                      */
/* -------------------------------- */

let deferredPrompt = null;

window.addEventListener(
  "beforeinstallprompt",
  (event) => {
    event.preventDefault();

    deferredPrompt = event;

    $("installBtn").hidden =
      false;

    $("installHint").hidden =
      false;
  }
);

$("installBtn")
  .addEventListener(
    "click",
    async () => {
      if (
        !deferredPrompt
      ) {
        return;
      }

      deferredPrompt.prompt();

      await deferredPrompt.userChoice;

      deferredPrompt = null;

      $("installBtn").hidden =
        true;
    }
  );

/* -------------------------------- */
/* SERVICE WORKER                   */
/* -------------------------------- */

if (
  "serviceWorker" in
  navigator
) {
  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});
}