const colors = ["#d95f4b", "#456fb0", "#2f7b63", "#bd8b2c", "#7a5aa6", "#3c7a86", "#a14f6d"];

const state = {
  step: "capture",
  image: null,
  quality: {
    brightness: "--",
    contrast: "--",
    coverage: "Need photo",
  },
  selectedGoal: "make the room feel larger",
  constraints: ["no purchases", "do not block door", "retain wardrobe access"],
  objects: [
    { id: "bed_1", label: "Bed", type: "bed", movable: false, x: 0.06, y: 0.46, w: 0.46, h: 0.34 },
    { id: "desk_1", label: "Desk", type: "desk", movable: true, x: 0.55, y: 0.36, w: 0.31, h: 0.28 },
    { id: "chair_1", label: "Chair", type: "chair", movable: true, x: 0.47, y: 0.53, w: 0.18, h: 0.25 },
    { id: "wardrobe_1", label: "Wardrobe", type: "wardrobe", movable: false, x: 0.72, y: 0.12, w: 0.22, h: 0.36 },
    { id: "clutter_1", label: "Floor clutter", type: "clutter", movable: true, x: 0.31, y: 0.72, w: 0.26, h: 0.15 },
  ],
  plan: [],
};

const goals = [
  "make the room feel larger",
  "improve study space",
  "reduce visible clutter",
  "improve walking space",
  "improve lighting",
  "create a calmer appearance",
];

const canvas = document.querySelector("#roomCanvas");
const planCanvas = document.querySelector("#planCanvas");
const ctx = canvas.getContext("2d");
const planCtx = planCanvas.getContext("2d");

document.querySelectorAll(".step").forEach((button) => {
  button.addEventListener("click", () => showStep(button.dataset.step));
});

document.querySelector("#roomPhoto").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const image = new Image();
  image.src = URL.createObjectURL(file);
  await image.decode();
  state.image = image;
  measureQuality(image);
  document.querySelector("#emptyState").style.display = "none";
  drawRoomCanvas();
  drawPlanCanvas();
  renderAll();
});

document.querySelector("#addObjectBtn").addEventListener("click", () => {
  const index = state.objects.length + 1;
  state.objects.push({
    id: `item_${index}`,
    label: `Item ${index}`,
    type: "clutter",
    movable: true,
    x: 0.18 + Math.random() * 0.48,
    y: 0.18 + Math.random() * 0.48,
    w: 0.2,
    h: 0.16,
  });
  renderAll();
});

document.querySelector("#generateBtn").addEventListener("click", () => {
  state.plan = generatePlan();
  renderPlan();
  drawPlanCanvas();
});

document.querySelector("#resetBtn").addEventListener("click", () => {
  location.reload();
});

function showStep(step) {
  state.step = step;
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === step));
  document.querySelectorAll(".step").forEach((button) => button.classList.toggle("active", button.dataset.step === step));
  if (step === "plan" && state.plan.length === 0) {
    state.plan = generatePlan();
  }
  renderAll();
}

function renderAll() {
  renderQuality();
  renderInventory();
  renderConstraints();
  renderAnalysis();
  renderGoals();
  renderPlan();
  drawRoomCanvas();
  drawPlanCanvas();
}

function measureQuality(image) {
  const sample = document.createElement("canvas");
  const width = 120;
  const height = Math.max(1, Math.round((image.height / image.width) * width));
  sample.width = width;
  sample.height = height;
  const sampleCtx = sample.getContext("2d");
  sampleCtx.drawImage(image, 0, 0, width, height);
  const data = sampleCtx.getImageData(0, 0, width, height).data;
  let total = 0;
  const values = [];
  for (let i = 0; i < data.length; i += 4) {
    const value = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    total += value;
    values.push(value);
  }
  const mean = total / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  state.quality = {
    brightness: `${Math.round((mean / 255) * 100)}%`,
    contrast: `${Math.round((Math.sqrt(variance) / 90) * 100)}%`,
    coverage: image.width > image.height ? "wide shot" : "portrait crop",
  };
}

function renderQuality() {
  const metrics = [
    ["Brightness", state.quality.brightness],
    ["Contrast", state.quality.contrast],
    ["Coverage", state.quality.coverage],
  ];
  document.querySelector("#qualityMetrics").innerHTML = metrics
    .map(([label, value]) => `<div class="metric"><strong>${value}</strong><small>${label}</small></div>`)
    .join("");
}

function renderInventory() {
  const list = document.querySelector("#inventoryList");
  const template = document.querySelector("#objectTemplate");
  list.innerHTML = "";
  state.objects.forEach((object, index) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector(".swatch").style.background = colors[index % colors.length];
    const label = row.querySelector(".label-input");
    const type = row.querySelector(".type-input");
    const movable = row.querySelector(".movable-input");
    label.value = object.label;
    type.value = object.type;
    movable.checked = object.movable;
    label.addEventListener("input", () => {
      object.label = label.value;
      drawRoomCanvas();
      drawPlanCanvas();
    });
    type.addEventListener("change", () => {
      object.type = type.value;
      state.plan = generatePlan();
      renderAll();
    });
    movable.addEventListener("change", () => {
      object.movable = movable.checked;
      state.plan = generatePlan();
      renderAll();
    });
    list.appendChild(row);
  });
}

function renderConstraints() {
  const constraints = ["no purchases", "do not move bed", "do not block door", "retain wardrobe access", "keep desk usable"];
  document.querySelector("#constraintChips").innerHTML = constraints
    .map((constraint) => {
      const active = state.constraints.includes(constraint) ? "active" : "";
      return `<button class="chip ${active}" type="button" data-constraint="${constraint}">${constraint}</button>`;
    })
    .join("");
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const value = chip.dataset.constraint;
      state.constraints = state.constraints.includes(value)
        ? state.constraints.filter((constraint) => constraint !== value)
        : [...state.constraints, value];
      state.plan = generatePlan();
      renderAll();
    });
  });
}

function renderAnalysis() {
  const clutterCount = state.objects.filter((object) => ["clutter", "clothing", "boxes"].includes(object.type)).length;
  const movableCount = state.objects.filter((object) => object.movable).length;
  const desk = state.objects.find((object) => object.type === "desk");
  const chair = state.objects.find((object) => object.type === "chair");
  const flow = Math.max(30, 78 - clutterCount * 14 - (chair && chair.x < 0.52 ? 8 : 0));
  const calm = Math.max(28, 74 - clutterCount * 11 + (state.constraints.includes("no purchases") ? 4 : 0));
  const clutter = Math.min(95, 28 + clutterCount * 23);

  document.querySelector("#styleScore").textContent = calm;
  document.querySelector("#clutterScore").textContent = clutter;
  document.querySelector("#flowScore").textContent = flow;
  document.querySelector("#roomCategory").textContent =
    movableCount > 3 ? "Student room, flexible layout" : "Bedroom, fixed-furniture layout";

  const findings = [
    {
      title: "Likely style",
      body: "Practical modern bedroom with mixed storage. Confidence is low until real scene understanding is connected.",
    },
    {
      title: "Clutter pressure",
      body:
        clutterCount > 0
          ? "Loose or uncertain items should be grouped, hidden, folded, or moved off the walking path first."
          : "No clutter items are currently marked. Add any loose objects you want the plan to handle.",
    },
    {
      title: "Workspace clearance",
      body: desk && chair ? "The desk-chair pair should stay together and leave chair pull-back space." : "Add a desk and chair to unlock workspace-specific suggestions.",
    },
  ];
  document.querySelector("#findingList").innerHTML = findings
    .map((finding) => `<article class="finding"><strong>${finding.title}</strong><p>${finding.body}</p></article>`)
    .join("");
}

function renderGoals() {
  document.querySelector("#goalGrid").innerHTML = goals
    .map((goal) => `<button class="goal ${goal === state.selectedGoal ? "active" : ""}" type="button" data-goal="${goal}">${goal}</button>`)
    .join("");
  document.querySelectorAll(".goal").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedGoal = button.dataset.goal;
      state.plan = generatePlan();
      renderAll();
    });
  });
}

function generatePlan() {
  const objects = state.objects;
  const actions = [];
  const clutter = objects.filter((object) => ["clutter", "clothing", "boxes"].includes(object.type) && object.movable);
  const desk = objects.find((object) => object.type === "desk");
  const chair = objects.find((object) => object.type === "chair");
  const bed = objects.find((object) => object.type === "bed");
  const wardrobe = objects.find((object) => object.type === "wardrobe");

  clutter.slice(0, 2).forEach((object) => {
    actions.push({
      action: object.type === "clothing" ? "fold" : "group",
      object: object.label,
      destination: wardrobe ? "inside or beside the wardrobe" : "one storage zone against a wall",
      reason: "Reduces visible floor clutter while staying in zero-budget mode.",
    });
  });

  if (desk?.movable && state.selectedGoal.includes("study")) {
    actions.push({
      action: "move",
      object: desk.label,
      destination: "closer to the brightest wall or window side",
      reason: "Improves work focus and keeps the desk as the room's active zone.",
    });
  } else if (desk?.movable) {
    actions.push({
      action: "align",
      object: desk.label,
      destination: "flat against the nearest wall",
      reason: "Opens the center of the room without buying storage.",
    });
  }

  if (chair?.movable) {
    actions.push({
      action: "rotate",
      object: chair.label,
      destination: "tucked squarely under the desk when not in use",
      reason: "Improves walking space and reduces visual noise.",
    });
  }

  if (bed && !bed.movable) {
    actions.push({
      action: "clear_surface",
      object: bed.label,
      destination: "keep bedding and loose items within the bed footprint",
      reason: "Treats the fixed bed as a calm anchor instead of moving it.",
    });
  }

  actions.push({
    action: "validate",
    object: "Door and wardrobe paths",
    destination: "leave a clear route after each move",
    reason: "Hard constraint check: no purchase, no blocked access, no unsupported new furniture.",
  });

  return actions.slice(0, 5).map((action, index) => ({ ...action, step: index + 1 }));
}

function renderPlan() {
  if (state.plan.length === 0) state.plan = generatePlan();
  document.querySelector("#planList").innerHTML = state.plan
    .map(
      (item) =>
        `<article class="plan-item"><strong>${item.step}. ${item.action}: ${item.object}</strong><p>To: ${item.destination}. ${item.reason}</p></article>`,
    )
    .join("");
}

function drawRoomCanvas() {
  drawBase(ctx, canvas);
  state.objects.forEach((object, index) => drawBox(ctx, canvas, object, colors[index % colors.length]));
}

function drawPlanCanvas() {
  drawBase(planCtx, planCanvas);
  state.objects.forEach((object, index) => drawBox(planCtx, planCanvas, object, colors[index % colors.length]));
  state.plan.slice(0, 4).forEach((item, index) => drawArrow(planCtx, planCanvas, index, item));
}

function drawBase(context, target) {
  context.clearRect(0, 0, target.width, target.height);
  if (state.image) {
    const scale = Math.min(target.width / state.image.width, target.height / state.image.height);
    const width = state.image.width * scale;
    const height = state.image.height * scale;
    const x = (target.width - width) / 2;
    const y = (target.height - height) / 2;
    context.fillStyle = "#242b28";
    context.fillRect(0, 0, target.width, target.height);
    context.drawImage(state.image, x, y, width, height);
  } else {
    context.fillStyle = "#2a302d";
    context.fillRect(0, 0, target.width, target.height);
    context.strokeStyle = "rgba(255,255,255,0.16)";
    for (let i = 0; i < target.width; i += 60) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, target.height);
      context.stroke();
    }
  }
}

function drawBox(context, target, object, color) {
  const x = object.x * target.width;
  const y = object.y * target.height;
  const w = object.w * target.width;
  const h = object.h * target.height;
  context.lineWidth = 4;
  context.strokeStyle = color;
  context.fillStyle = color + "2e";
  context.fillRect(x, y, w, h);
  context.strokeRect(x, y, w, h);
  context.fillStyle = color;
  context.fillRect(x, Math.max(0, y - 28), Math.min(w + 80, 190), 28);
  context.fillStyle = "#fff";
  context.font = "700 20px system-ui";
  context.fillText(object.label, x + 10, Math.max(21, y - 8));
}

function drawArrow(context, target, index, item) {
  const y = 84 + index * 92;
  const startX = target.width - 300;
  const endX = target.width - 110;
  context.strokeStyle = colors[index % colors.length];
  context.fillStyle = colors[index % colors.length];
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(startX, y);
  context.lineTo(endX, y - 20);
  context.stroke();
  context.beginPath();
  context.moveTo(endX, y - 20);
  context.lineTo(endX - 18, y - 30);
  context.lineTo(endX - 12, y - 7);
  context.closePath();
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.93)";
  context.fillRect(startX - 14, y + 10, 285, 48);
  context.fillStyle = "#1d2522";
  context.font = "800 17px system-ui";
  context.fillText(`${item.step}. ${item.action} ${item.object}`, startX, y + 40);
}

renderAll();
