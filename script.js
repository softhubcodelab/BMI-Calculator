const $ = (id) => document.getElementById(id);
function clearCalculatorState() {
  localStorage.removeItem("bmiFormState");
}



document.addEventListener("DOMContentLoaded", () => {
  const genderCards = document.querySelectorAll(".gender-card");
  let selectedGender = "Male";
  // Always start with a completely fresh form after opening/refreshing the calculator.
  clearCalculatorState();
  selectedGender = "Male";
  genderCards.forEach(c => c.classList.toggle("selected", c.dataset.gender === "Male"));
  ["age", "weight", "height"].forEach(id => { const field = $(id); if (field) field.value = ""; });
  const weightUnitField = $("weightUnit");
  const heightUnitField = $("heightUnit");
  if (weightUnitField) weightUnitField.value = "kg";
  if (heightUnitField) heightUnitField.value = "cm";

  genderCards.forEach(card => {
    card.addEventListener("click", () => {
      genderCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedGender = card.dataset.gender;
    });
  });

  const form = $("bmiForm");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const ageRaw = $("age").value.trim();
      const age = ageRaw === "" ? null : Number(ageRaw);   // age is optional
      const weight = Number($("weight").value);
      const height = Number($("height").value);
      const weightUnit = $("weightUnit").value;
      const heightUnit = $("heightUnit").value;
      const error = $("formError");

      if (age !== null && (!Number.isFinite(age) || age < 1 || age > 120)) {
        error.textContent = "Age must be between 1 and 120 (or leave it empty).";
        return;
      }

      if (!weight || weight <= 0 || !height || height <= 0) {
        error.textContent = "Please enter valid weight and height.";
        return;
      }

      error.textContent = "";


      let kg;
      switch (weightUnit) {
        case "g": kg = weight / 1000; break;
        case "lb": kg = weight * 0.45359237; break;
        case "oz": kg = weight * 0.028349523125; break;
        case "st": kg = weight * 6.35029318; break;
        default: kg = weight;
      }

      let meters;
      switch (heightUnit) {
        case "m": meters = height; break;
        case "mm": meters = height / 1000; break;
        case "in": meters = height * 0.0254; break;
        case "ft": meters = height * 0.3048; break;
        case "yd": meters = height * 0.9144; break;
        default: meters = height / 100;
      }

      const bmi = kg / (meters * meters);

      clearCalculatorState();
      localStorage.setItem("bmiData", JSON.stringify({
        age,
        weight,
        height,
        weightUnit,
        heightUnit,
        gender: selectedGender,
        bmi: Number(bmi.toFixed(1))
      }));

      location.href = "/result";
    });
  }


  const resultNumber = $("bmiNumber");

  if (resultNumber) {
    const raw = localStorage.getItem("bmiData");

    if (!raw) {
      location.href = "/calculator";
      return;
    }

    const data = JSON.parse(raw);
    const bmi = Number(data.bmi);

    resultNumber.textContent = bmi.toFixed(1);
    if (data.age === null || data.age === undefined || data.age === "") {
      // Age was not entered: hide the Age cell
      const ageCell = $("ageCell");
      if (ageCell) ageCell.style.display = "none";
      const grid = $("statsGrid");
      if (grid) grid.classList.add("no-age");
    } else {
      $("resultAge").textContent = data.age;
    }
    const weightLabels = { kg: "Kg", g: "g", lb: "Lb", oz: "Oz", st: "St" };
    const heightLabels = { cm: "Cm", m: "m", mm: "mm", in: "In", ft: "Ft", yd: "Yd" };
    $("resultWeight").textContent = `${data.weight} ${weightLabels[data.weightUnit] || "Kg"}`;
    $("resultHeight").textContent = `${data.height} ${heightLabels[data.heightUnit] || "Cm"}`;

    let category;
    if (bmi < 16) category = "Very severely underweight";
    else if (bmi < 17) category = "Severely underweight";
    else if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Normal";
    else if (bmi < 30) category = "Overweight";
    else category = "Obese";

    $("resultMessage").innerHTML = `You have <strong>${category}</strong> body weight!`;

    document.querySelectorAll(".scale-row").forEach(row => {
      row.classList.toggle("active", row.dataset.category === category);
    });

    // Ring percentage is visually capped between 0 and 40 BMI.
    const pct = Math.min(Math.max(bmi / 40 * 100, 3), 97);
    $("bmiRing").style.background =
      `conic-gradient(var(--primary) 0 ${pct}%, var(--track) ${pct}% 100%)`;

    // Healthy BMI range: 18.5–24.9, converted to the selected height.
    let normalMinKg = 18.5 * metersFromData(data) ** 2;
    let normalMaxKg = 24.9 * metersFromData(data) ** 2;

    if (data.weightUnit === "lb") {
      normalMinKg *= 2.2046226218;
      normalMaxKg *= 2.2046226218;
      $("normalWeight").textContent = `${normalMinKg.toFixed(1)} – ${normalMaxKg.toFixed(1)} Lb`;
    } else {
      $("normalWeight").textContent = `${normalMinKg.toFixed(1)} – ${normalMaxKg.toFixed(1)} Kg`;
    }
  }
});

function metersFromData(data) {
  switch (data.heightUnit) {
    case "m": return data.height;
    case "mm": return data.height / 1000;
    case "in": return data.height * 0.0254;
    case "ft": return data.height * 0.3048;
    case "yd": return data.height * 0.9144;
    default: return data.height / 100;
  }
}

// Prevent the browser's back/forward cache from restoring old calculator inputs.
window.addEventListener("pageshow", (event) => {
  if (document.getElementById("bmiForm")) {
    clearCalculatorState();
    ["age", "weight", "height"].forEach(id => {
      const field = document.getElementById(id);
      if (field) field.value = "";
    });
    const wu = document.getElementById("weightUnit");
    const hu = document.getElementById("heightUnit");
    if (wu) wu.value = "kg";
    if (hu) hu.value = "cm";
  }
});
