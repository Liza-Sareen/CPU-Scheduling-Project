// -------------------- GLOBALS --------------------
let count = 1;
const tableBody = document.querySelector("#processTable tbody");

// -------------------- ADD PROCESS --------------------
document.getElementById("addProcess").onclick = () => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>P${count}</td>
    <td><input type="number" class="arrival"></td>
    <td><input type="number" class="burst"></td>
    <td><input type="number" class="priority"></td>
  `;
  tableBody.appendChild(row);
  count++;
};

// -------------------- READ INPUT --------------------
function getProcesses() {
  const rows = document.querySelectorAll("#processTable tbody tr");
  let processes = [];

  rows.forEach((row, index) => {
    processes.push({
      id: `P${index + 1}`,
      arrival: Number(row.querySelector(".arrival").value),
      burst: Number(row.querySelector(".burst").value),
      priority: Number(row.querySelector(".priority").value)
    });
  });

  return processes;
}

// -------------------- FCFS --------------------
function fcfs(processes) {
  processes.sort((a, b) => a.arrival - b.arrival);
  let time = 0;

  processes.forEach(p => {
    if (time < p.arrival) time = p.arrival;
    p.start = time;
    p.completion = time + p.burst;
    p.turnaround = p.completion - p.arrival;
    p.waiting = p.turnaround - p.burst;
    time = p.completion;
  });

  return processes;
}

// -------------------- SJF (NON-PREEMPTIVE) --------------------
function sjf(processes) {
  let time = 0, completed = 0;
  const n = processes.length;
  const done = Array(n).fill(false);
  processes = processes.map(p => ({ ...p }));

  while (completed < n) {
    let idx = -1, minBurst = Infinity;

    for (let i = 0; i < n; i++) {
      if (!done[i] && processes[i].arrival <= time && processes[i].burst < minBurst) {
        minBurst = processes[i].burst;
        idx = i;
      }
    }

    if (idx === -1) {
      time++;
      continue;
    }

    processes[idx].start = time;
    processes[idx].completion = time + processes[idx].burst;
    processes[idx].turnaround = processes[idx].completion - processes[idx].arrival;
    processes[idx].waiting = processes[idx].turnaround - processes[idx].burst;
    time = processes[idx].completion;
    done[idx] = true;
    completed++;
  }

  processes.sort((a, b) => a.start - b.start);
  return processes;
}

// -------------------- ROUND ROBIN --------------------
function roundRobin(processes, quantum) {
  let time = 0, queue = [], timeline = [];
  processes = processes.map(p => ({ ...p, remaining: p.burst }));
  processes.sort((a, b) => a.arrival - b.arrival);

  let i = 0, completed = 0;

  while (completed < processes.length) {
    while (i < processes.length && processes[i].arrival <= time) {
      queue.push(processes[i++]);
    }

    if (queue.length === 0) {
      time++;
      continue;
    }

    let p = queue.shift();
    let exec = Math.min(quantum, p.remaining);

    timeline.push({ process: p.id, start: time, end: time + exec });
    time += exec;
    p.remaining -= exec;

    while (i < processes.length && processes[i].arrival <= time) {
      queue.push(processes[i++]);
    }

    if (p.remaining > 0) {
      queue.push(p);
    } else {
      p.completion = time;
      p.turnaround = p.completion - p.arrival;
      p.waiting = p.turnaround - p.burst;
      completed++;
    }
  }

  return { processes, timeline };
}

// -------------------- PRIORITY (NON-PREEMPTIVE) --------------------
function priorityScheduling(processes) {
  let time = 0, completed = 0;
  const n = processes.length;
  const done = Array(n).fill(false);
  processes = processes.map(p => ({ ...p }));

  while (completed < n) {
    let idx = -1, best = Infinity;

    for (let i = 0; i < n; i++) {
      if (!done[i] && processes[i].arrival <= time && processes[i].priority < best) {
        best = processes[i].priority;
        idx = i;
      }
    }

    if (idx === -1) {
      time++;
      continue;
    }

    processes[idx].start = time;
    processes[idx].completion = time + processes[idx].burst;
    processes[idx].turnaround = processes[idx].completion - processes[idx].arrival;
    processes[idx].waiting = processes[idx].turnaround - processes[idx].burst;
    time = processes[idx].completion;
    done[idx] = true;
    completed++;
  }

  processes.sort((a, b) => a.start - b.start);
  return processes;
}

// -------------------- UI HELPERS --------------------
function showMetrics(processes) {
  const tbody = document.querySelector("#metrics tbody");
  tbody.innerHTML = "";
  processes.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td>${p.waiting}</td>
        <td>${p.turnaround}</td>
      </tr>`;
  });
}

function drawGantt(data) {
  const gantt = document.getElementById("gantt");
  gantt.innerHTML = "";

  data.forEach(d => {
    const wrap = document.createElement("div");
    wrap.style.textAlign = "center";

    const block = document.createElement("div");
    block.className = "gantt-block";
    block.style.width = `${(d.end - d.start) * 40}px`;
    block.innerText = d.process;

    const time = document.createElement("div");
    time.innerText = `${d.start}-${d.end}`;

    wrap.appendChild(block);
    wrap.appendChild(time);
    gantt.appendChild(wrap);
  });
}

// -------------------- AI RECOMMENDATION --------------------
function averageWaitingTime(processes) {
  return (processes.reduce((s, p) => s + p.waiting, 0) / processes.length).toFixed(2);
}

function suggestBestAlgorithm(processes) {
  const fc = fcfs(processes.map(p => ({ ...p })));
  const sj = sjf(processes.map(p => ({ ...p })));

  return averageWaitingTime(sj) < averageWaitingTime(fc)
    ? { algo: "SJF", avg: averageWaitingTime(sj) }
    : { algo: "FCFS", avg: averageWaitingTime(fc) };
}

function showAIRecommendation(processes) {
  const box = document.getElementById("aiResult");
  if (!box) return;

  const best = suggestBestAlgorithm(processes);
  box.innerText = `Recommended Algorithm: ${best.algo} (Avg Waiting Time: ${best.avg})`;
}

// -------------------- RUN BUTTON --------------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("run").onclick = () => {
    const processes = getProcesses();
    if (processes.length === 0) return alert("Add processes first");

    const algo = document.getElementById("algorithm").value;

    if (algo === "fcfs") {
      const r = fcfs(processes);
      showMetrics(r);
      drawGantt(r.map(p => ({ process: p.id, start: p.start, end: p.completion })));
    }

    else if (algo === "sjf") {
      const r = sjf(processes);
      showMetrics(r);
      drawGantt(r.map(p => ({ process: p.id, start: p.start, end: p.completion })));
    }

    else if (algo === "rr") {
      const q = Number(document.getElementById("quantum").value);
      if (!q) return alert("Enter quantum");
      const r = roundRobin(processes, q);
      showMetrics(r.processes);
      drawGantt(r.timeline);
    }

    else if (algo === "priority") {
      const r = priorityScheduling(processes);
      showMetrics(r);
      drawGantt(r.map(p => ({ process: p.id, start: p.start, end: p.completion })));
    }

    showAIRecommendation(getProcesses());
  };
});
