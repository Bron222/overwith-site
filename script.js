// Overwith home page: the little "try it" demos, pop-up messages and sounds.
// The page still reads fine without this script; it only adds the fun.
(function () {
  "use strict";

  var SCRIBBLE =
    '<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M1 6 C 18 1, 28 9, 48 5 S 78 1, 99 5"/></svg>';

  function $(id) {
    return document.getElementById(id);
  }

  function pick(list, i) {
    return list[i % list.length];
  }

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---------- Pop-up messages ----------
  var toastEl = $("toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2200);
  }

  // ---------- Sounds ----------
  // Made in the browser (no audio files). Browsers only allow sound after a
  // click, so nothing ever plays when the page loads.
  var soundOn = true;
  try {
    soundOn = localStorage.getItem("ow-sound") !== "off";
  } catch (e) {
    // Storage blocked: keep the default.
  }

  var actx = null;
  function audio() {
    if (!soundOn) return null;
    try {
      if (!actx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        actx = new Ctx();
      }
      if (actx.state === "suspended") actx.resume();
      return actx;
    } catch (e) {
      return null;
    }
  }

  // One note that fades in and out. `slide` bends the pitch down a little.
  function note(c, freq, at, dur, type, vol, slide) {
    var t = c.currentTime + at;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  var sfx = {
    // A short, soft "tick"
    tick: function () {
      var c = audio();
      if (!c) return;
      note(c, 1320, 0, 0.09, "triangle", 0.14);
      note(c, 1980, 0.025, 0.07, "sine", 0.06);
    },
    // A rising four-note "ta-da"
    tada: function () {
      var c = audio();
      if (!c) return;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        note(c, f, i * 0.09, i === 3 ? 0.6 : 0.22, "triangle", 0.12);
      });
    },
    // A soft two-note "nope" that drops in pitch
    nope: function () {
      var c = audio();
      if (!c) return;
      note(c, 330, 0, 0.18, "square", 0.05, 0.92);
      note(c, 247, 0.14, 0.18, "square", 0.05, 0.92);
    }
  };

  var soundBtn = $("soundBtn");
  function showSound() {
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    $("soundLabel").textContent = soundOn ? "Sound on" : "Sound off";
  }
  if (soundBtn) {
    soundBtn.hidden = false;
    showSound();
    soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      try {
        localStorage.setItem("ow-sound", soundOn ? "on" : "off");
      } catch (e) {
        // Storage blocked: the choice lasts until the page is closed.
      }
      showSound();
      if (soundOn) sfx.tick();
    });
  }

  var cheers = [
    "Look at you go.",
    "Your mum would be so proud.",
    "Gone. Like it never happened.",
    "One less thing."
  ];
  var cheerN = 0;

  // ---------- 1. Hero list ----------
  var heroList = $("heroList");
  if (heroList) {
    var heroChecks = heroList.querySelectorAll(".check");
    var updateHero = function () {
      var done = 0;
      heroChecks.forEach(function (box) {
        if (box.checked) done++;
      });
      $("heroCount").textContent = "Today · " + done + " of " + heroChecks.length + " done";
      return done;
    };
    heroChecks.forEach(function (box) {
      box.addEventListener("change", function () {
        var done = updateHero();
        if (!box.checked) return;
        if (done === heroChecks.length) {
          sfx.tada();
          toast("All done?! Who even are you? 🎉");
        } else {
          sfx.tick();
          toast(pick(cheers, cheerN++));
        }
      });
    });
    updateHero();

    try {
      $("heroDate").textContent = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long"
      });
    } catch (e) {
      // Keep the fallback text.
    }
  }

  // ---------- 2. Day or week ----------
  var board = [
    { title: "Pay the electricity bill", where: "day" },
    { title: "Gym (allegedly)", where: "day" },
    { title: "Clean out the fridge", where: "week" },
    { title: "Return the jumper", where: "week" }
  ];
  var toWeek = [
    "Parked. Not forgotten.",
    "Future you can deal with it. This week, though.",
    "Bold strategy. We believe in you."
  ];
  var toDay = [
    "Tuesday it is. Bold.",
    "Oh, we're committing now? Love that.",
    "Locked in for Tuesday."
  ];
  var moveN = 0;

  function renderBoard(focusTitle) {
    ["day", "week"].forEach(function (where) {
      var ul = $(where + "List");
      var items = board.filter(function (t) {
        return t.where === where;
      });
      $(where + "Count").textContent = items.length + (items.length === 1 ? " task" : " tasks");
      ul.innerHTML = "";
      if (!items.length) {
        ul.innerHTML =
          '<li class="empty">' +
          (where === "day" ? "Tuesday is free. Enjoy it." : "Nothing parked. Very organised.") +
          "</li>";
        return;
      }
      items.forEach(function (t) {
        var li = document.createElement("li");
        li.className = "chip";
        li.innerHTML =
          "<span>" + esc(t.title) + '</span><button type="button">' +
          (where === "day" ? "Later this week" : "Do it Tuesday") +
          "</button>";
        var btn = li.querySelector("button");
        btn.setAttribute(
          "aria-label",
          (where === "day" ? "Move to sometime this week: " : "Move to Tuesday: ") + t.title
        );
        btn.addEventListener("click", function () {
          t.where = where === "day" ? "week" : "day";
          sfx.tick();
          toast(t.where === "week" ? pick(toWeek, moveN++) : pick(toDay, moveN++));
          renderBoard(t.title);
        });
        ul.appendChild(li);
        // Keep keyboard focus on the task that just moved.
        if (focusTitle === t.title) btn.focus();
      });
    });
  }
  if ($("dayList")) renderBoard();

  // ---------- 3. Carry forward ----------
  // Uses this real week, Monday to Sunday.
  var carryStart = [
    { title: "Return the library book" },
    { title: "Fix the squeaky door" },
    { title: "Learn Spanish", meta: "ambitious. we love it" }
  ];
  var monday = (function () {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  })();
  function dayDate(i) {
    var d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  }
  function fmt(d, opts) {
    try {
      return d.toLocaleDateString(undefined, opts);
    } catch (e) {
      return d.toDateString();
    }
  }

  var carry = [];
  var today = 0;
  var arriving = false;

  function resetCarry() {
    carry = carryStart.map(function (t) {
      return { title: t.title, meta: t.meta, done: false, from: null };
    });
    today = 0;
    renderCarry();
  }

  function carryCount() {
    var done = carry.filter(function (t) {
      return t.done;
    }).length;
    $("carryCount").textContent = carry.length
      ? "Today · " + done + " of " + carry.length + " done"
      : "Today";
  }

  function renderCarry() {
    var days = $("days");
    days.innerHTML = "";
    for (var i = 0; i < 7; i++) {
      var cell = document.createElement("div");
      cell.className = "day" + (i < today ? " past" : "") + (i === today ? " today" : "");
      var d = dayDate(i);
      cell.innerHTML = fmt(d, { weekday: "short" }) + "<b>" + d.getDate() + "</b>";
      days.appendChild(cell);
    }
    $("carryDate").textContent = fmt(dayDate(today), {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    var list = $("carryList");
    list.innerHTML = "";
    if (!carry.length) {
      list.innerHTML = '<li class="empty">Nothing left to carry. Suspiciously impressive.</li>';
    }
    carry.forEach(function (t, i) {
      var li = document.createElement("li");
      li.className = "task" + (arriving ? " arrive" : "");
      if (arriving) li.style.animationDelay = i * 90 + "ms";
      li.innerHTML =
        '<input class="check" type="checkbox" id="carry-' + i + '">' +
        '<label class="label" for="carry-' + i + '">' + esc(t.title) + SCRIBBLE +
        (t.meta ? '<span class="meta">' + esc(t.meta) + "</span>" : "") +
        (t.from ? '<span class="moved">from ' + esc(t.from) + "</span>" : "") +
        "</label>";
      li.querySelector("input").addEventListener("change", function (e) {
        t.done = e.target.checked;
        carryCount();
        if (!t.done) return;
        var allDone = carry.every(function (x) {
          return x.done;
        });
        if (allDone) sfx.tada();
        else sfx.tick();
        toast(pick(cheers, cheerN++));
      });
      list.appendChild(li);
    });
    arriving = false;
    carryCount();

    var sleep = $("sleep");
    var lastDay = today === 6;
    sleep.disabled = lastDay;
    sleep.textContent = lastDay ? "It's Sunday. Rest." : "Sleep on it 😴";
  }

  if ($("carryList")) {
    $("carryBtns").hidden = false;
    $("sleep").addEventListener("click", function () {
      if (today === 6) return;
      var from = fmt(dayDate(today), { weekday: "short" });
      var left = carry.filter(function (t) {
        return !t.done;
      });
      var finished = carry.length - left.length;
      today++;
      carry = left.map(function (t) {
        return { title: t.title, meta: t.meta, done: false, from: from };
      });
      arriving = true;
      renderCarry();
      if (!left.length) {
        toast("Clean slate. Enjoy that feeling.");
      } else {
        toast(
          left.length + (left.length === 1 ? " task" : " tasks") + " came with you" +
            (finished ? ". The rest are done." : ". Tomorrow's your day.")
        );
      }
    });
    $("carryReset").addEventListener("click", resetCarry);
    resetCarry();
  }

  // ---------- 4. Privacy counter ----------
  var poke = $("poke");
  if (poke) {
    var quips = [
      "Nope.",
      "Still zero.",
      "We genuinely have nowhere to put it.",
      "No servers. No spreadsheet. No snooping.",
      "You can keep clicking. We'll keep knowing nothing.",
      "Honestly? We admire the persistence."
    ];
    var pokeN = 0;
    var zero = $("zero");
    poke.hidden = false;
    poke.addEventListener("click", function () {
      // Restart the wobble animation.
      zero.classList.remove("shake");
      zero.getBoundingClientRect();
      zero.classList.add("shake");
      sfx.nope();
      $("quip").textContent = pick(quips, pokeN++);
    });
  }

  // ---------- Support page search ----------
  var faqSearch = $("faqSearch");
  if (faqSearch) {
    $("faqSearchBox").hidden = false;
    var faqs = document.querySelectorAll(".faq-group details");
    var groups = document.querySelectorAll(".faq-group");
    faqSearch.addEventListener("input", function () {
      var q = faqSearch.value.trim().toLowerCase();
      var shown = 0;
      faqs.forEach(function (d) {
        var match = !q || d.textContent.toLowerCase().includes(q);
        d.hidden = !match;
        // Open matching answers while searching, close them when cleared.
        d.open = Boolean(q) && match;
        if (match) shown++;
      });
      groups.forEach(function (g) {
        g.hidden = !g.querySelector("details:not([hidden])");
      });
      $("faqEmpty").hidden = shown > 0;
    });
  }

  // ---------- App store buttons ----------
  document.querySelectorAll("[data-soon]").forEach(function (b) {
    b.addEventListener("click", function () {
      toast("Not out yet. Ironic, we know.");
    });
  });
})();
