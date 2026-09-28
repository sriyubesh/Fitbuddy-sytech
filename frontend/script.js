/**
 * FitBuddy Frontend Controller (Stitch UI Edition)
 * Manages the multi-step onboarding wizard, Gemini AI generation,
 * interactive 7-day routine, nutrition advice, and plan adjustments.
 */

document.addEventListener("DOMContentLoaded", () => {
  // State
  let currentStep = 1;
  let activeGoal = "Muscle Gain";
  let activeIntensity = "Medium";
  let activeExperience = "Beginner";
  let activeDayTab = 0;
  let currentViewMode = "grid";

  let currentUser = null;
  let currentPlan = null;
  let historyPlans = [];

  // DOM Elements - Stepper & Wizard
  const wizardContainer = document.getElementById("wizard-container");
  const heroBanner = document.getElementById("hero-banner");
  const step1Card = document.getElementById("step-1-card");
  const step2Card = document.getElementById("step-2-card");
  const step3Card = document.getElementById("step-3-card");

  const stepLabel1 = document.getElementById("step-label-1");
  const stepLabel2 = document.getElementById("step-label-2");
  const stepLabel3 = document.getElementById("step-label-3");
  const stepperBarFill = document.getElementById("stepper-bar-fill");

  const toStep2Btn = document.getElementById("to-step-2-btn");
  const toStep3Btn = document.getElementById("to-step-3-btn");
  const backToStep1Btn = document.getElementById("back-to-step-1-btn");
  const backToStep2Btn = document.getElementById("back-to-step-2-btn");
  const generatePlanBtn = document.getElementById("generate-plan-btn");

  const nameInput = document.getElementById("name");
  const ageInput = document.getElementById("age");
  const weightInput = document.getElementById("weight");
  const heightInput = document.getElementById("height");
  const equipmentSelect = document.getElementById("equipment-select");
  const weightValPreview = document.getElementById("weight-val-preview");

  // Loading Overlay
  const loadingOverlay = document.getElementById("loading-overlay");
  const loadingStageText = document.getElementById("loading-stage-text");

  // Dashboard Elements
  const dashboardView = document.getElementById("dashboard-view");
  const athleteAvatar = document.getElementById("athlete-avatar");
  const planTitleHeading = document.getElementById("plan-title-heading");
  const badgeGoal = document.getElementById("badge-goal");
  const badgeIntensity = document.getElementById("badge-intensity");
  const badgeExp = document.getElementById("badge-exp");
  const badgeWeight = document.getElementById("badge-weight");
  const planOverviewText = document.getElementById("plan-overview-text");
  const safetyAlert = document.getElementById("safety-alert");
  const safetyDirectiveText = document.getElementById("safety-directive-text");

  const nutritionTipBody = document.getElementById("nutrition-tip-body");
  const nutritionGoalTag = document.getElementById("nutrition-goal-tag");
  const nutritionDisclaimerText = document.getElementById("nutrition-disclaimer-text");

  const viewGridBtn = document.getElementById("view-grid-btn");
  const viewTabsBtn = document.getElementById("view-tabs-btn");
  const tabbedDayView = document.getElementById("tabbed-day-view");
  const dayTabsNav = document.getElementById("day-tabs-nav");
  const activeDayDetail = document.getElementById("active-day-detail");
  const daysGrid = document.getElementById("days-grid");

  // Feedback Form
  const feedbackForm = document.getElementById("feedback-form");
  const feedbackInput = document.getElementById("feedback-input");
  const submitFeedbackBtn = document.getElementById("submit-feedback-btn");
  const feedbackSpinner = document.getElementById("feedback-spinner");

  // Header & History Controls
  const navBuilderBtn = document.getElementById("nav-builder-btn");
  const navScheduleBtn = document.getElementById("nav-schedule-btn");
  const headerCtaBtn = document.getElementById("header-cta-btn");
  const viewHistoryBtn = document.getElementById("view-history-btn");
  const historyCount = document.getElementById("history-count");
  const historyModal = document.getElementById("history-modal");
  const historyItemsContainer = document.getElementById("history-items-container");
  const closeHistoryModal = document.getElementById("close-history-modal");
  const btnReEval = document.getElementById("btn-re-eval");
  const btnPrintPlan = document.getElementById("btn-print-plan");
  const brandHomeBtn = document.getElementById("brand-home-btn");
  const toastContainer = document.getElementById("toast-container");

  // -----------------------------------------------------------
  // Notifications / Toast
  // -----------------------------------------------------------
  function showToast(message, type = "success", duration = 4000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
    toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, duration);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Weight preview update
  if (weightInput && weightValPreview) {
    weightInput.addEventListener("input", () => {
      weightValPreview.textContent = `${weightInput.value || 0} kg`;
    });
  }

  // -----------------------------------------------------------
  // Step Navigation Logic
  // -----------------------------------------------------------
  function goToStep(step) {
    currentStep = step;

    // Toggle cards
    step1Card.style.display = step === 1 ? "block" : "none";
    step2Card.style.display = step === 2 ? "block" : "none";
    step3Card.style.display = step === 3 ? "block" : "none";

    // Toggle hero banner
    heroBanner.style.display = step === 1 ? "block" : "none";

    // Update stepper bar
    stepperBarFill.style.width = `${(step / 3) * 100}%`;

    stepLabel1.className = `step-label ${step === 1 ? "active" : ""}`;
    stepLabel2.className = `step-label ${step === 2 ? "active" : ""}`;
    stepLabel3.className = `step-label ${step === 3 ? "active" : ""}`;

    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  // Goal Cards selection
  document.querySelectorAll(".goal-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".goal-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      activeGoal = card.getAttribute("data-goal");
    });
  });

  // Intensity Cards selection
  document.querySelectorAll(".pref-card[data-intensity]").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".pref-card[data-intensity]").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      activeIntensity = card.getAttribute("data-intensity");
    });
  });

  // Experience Cards selection
  document.querySelectorAll(".pref-card[data-exp]").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".pref-card[data-exp]").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      activeExperience = card.getAttribute("data-exp");
    });
  });

  // Step 1 Validation & Next
  toStep2Btn.addEventListener("click", () => {
    document.getElementById("name-error").textContent = "";
    document.getElementById("age-error").textContent = "";
    document.getElementById("weight-error").textContent = "";

    const name = nameInput.value.trim();
    const age = parseInt(ageInput.value, 10);
    const weight = parseFloat(weightInput.value);

    let valid = true;
    if (!name) {
      document.getElementById("name-error").textContent = "Please enter your name.";
      valid = false;
    }
    if (isNaN(age) || age < 12 || age > 120) {
      document.getElementById("age-error").textContent = "Age must be between 12 and 120 years.";
      valid = false;
    }
    if (isNaN(weight) || weight < 20 || weight > 400) {
      document.getElementById("weight-error").textContent = "Weight must be between 20 kg and 400 kg.";
      valid = false;
    }

    if (valid) goToStep(2);
  });

  backToStep1Btn.addEventListener("click", () => goToStep(1));
  toStep3Btn.addEventListener("click", () => goToStep(3));
  backToStep2Btn.addEventListener("click", () => goToStep(2));

  // -----------------------------------------------------------
  // API Fetch Utility
  // -----------------------------------------------------------
  async function apiFetch(endpoint, options = {}) {
    const res = await fetch(endpoint, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      let msg = "Request failed";
      if (data && data.detail) {
        msg = Array.isArray(data.detail) ? data.detail.map((d) => d.msg || d).join(", ") : data.detail;
      }
      throw new Error(msg);
    }
    return data;
  }

  // -----------------------------------------------------------
  // Generate Plan Handler (Calls FastAPI & Gemini)
  // -----------------------------------------------------------
  generatePlanBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const age = parseInt(ageInput.value, 10);
    const weight = parseFloat(weightInput.value);

    // Show radar loading screen
    loadingOverlay.style.display = "flex";

    const loadingStages = [
      "Analyzing body metrics & target intensity...",
      "Consulting Gemini AI exercise physiology model...",
      "Balancing progressive overload and compound lifts...",
      "Formulating tailored recovery intervals and rest days...",
      "Synthesizing sport-specific nutrition & fuel recommendations...",
    ];
    let stageIdx = 0;
    const stageTimer = setInterval(() => {
      stageIdx = (stageIdx + 1) % loadingStages.length;
      loadingStageText.textContent = loadingStages[stageIdx];
    }, 2200);

    try {
      // 1. Create or ensure user in DB (POST /users)
      const user = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          age,
          weight,
          goal: activeGoal,
          intensity: activeIntensity,
          experience: activeExperience,
        }),
      });
      currentUser = user;

      // 2. Generate Plan with Gemini (POST /generate-plan)
      const planRes = await apiFetch("/generate-plan", {
        method: "POST",
        body: JSON.stringify({ user_id: currentUser.id }),
      });
      currentPlan = planRes;

      // 3. Fetch nutrition advice
      fetchNutritionTip(currentUser.goal, currentUser.name);

      // 4. Render Dashboard
      renderDashboard(currentUser, currentPlan);
      showToast("Personalized 7-day routine created!", "success");

      // Switch view
      wizardContainer.style.display = "none";
      dashboardView.style.display = "flex";
      navScheduleBtn.style.display = "inline-flex";
      viewHistoryBtn.style.display = "inline-flex";

      refreshHistoryCount();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      showToast(err.message || "Failed to generate workout plan", "error");
    } finally {
      clearInterval(stageTimer);
      loadingOverlay.style.display = "none";
    }
  });

  // Nutrition Tip API
  async function fetchNutritionTip(goal, name) {
    try {
      const tipData = await apiFetch("/nutrition-tip", {
        method: "POST",
        body: JSON.stringify({ goal, name }),
      });
      nutritionGoalTag.textContent = `Targeted for: ${tipData.goal}`;
      nutritionTipBody.textContent = `"${tipData.tip}"`;
      if (tipData.disclaimer) {
        nutritionDisclaimerText.textContent = tipData.disclaimer;
      }
    } catch (err) {
      nutritionTipBody.textContent =
        '"Aim to consume high-quality protein with each meal and maintain optimal hydration to support muscular recovery and cellular hydration."';
    }
  }

  // -----------------------------------------------------------
  // Render Dashboard
  // -----------------------------------------------------------
  function renderDashboard(user, planWrapper) {
    athleteAvatar.textContent = (user.name || "A").charAt(0).toUpperCase();
    planTitleHeading.textContent = planWrapper.plan_data.plan_title || `7-Day Plan for ${user.name}`;

    badgeGoal.textContent = `Goal: ${user.goal}`;
    badgeIntensity.textContent = `${user.intensity} Intensity`;
    badgeExp.textContent = `${user.experience} Level`;
    badgeWeight.textContent = `${user.weight} kg`;

    planOverviewText.textContent = planWrapper.plan_data.overview || "Your customized 7-day training routine.";

    if (planWrapper.plan_data.safety_guidelines) {
      safetyDirectiveText.innerHTML = `<strong>Safety Directive:</strong> ${escapeHtml(planWrapper.plan_data.safety_guidelines)}`;
      safetyAlert.style.display = "flex";
    } else {
      safetyAlert.style.display = "none";
    }

    const days = planWrapper.plan_data.days || [];

    // Render Grid
    daysGrid.innerHTML = "";
    days.forEach((dayData, idx) => {
      const card = createDayCard(dayData, idx + 1);
      daysGrid.appendChild(card);
    });

    // Render Tabbed Navigation
    dayTabsNav.innerHTML = "";
    days.forEach((dayData, idx) => {
      const btn = document.createElement("button");
      btn.className = `day-tab-btn ${idx === activeDayTab ? "active" : ""}`;
      btn.textContent = `${dayData.day}: ${dayData.focus}`;
      btn.addEventListener("click", () => {
        activeDayTab = idx;
        document.querySelectorAll(".day-tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderActiveDayDetail(days[activeDayTab]);
      });
      dayTabsNav.appendChild(btn);
    });

    if (days.length > 0) {
      renderActiveDayDetail(days[activeDayTab]);
    }
  }

  function createDayCard(dayData, dayNum) {
    const card = document.createElement("div");
    card.className = "day-card";

    let exHtml = "";
    if (dayData.exercises && dayData.exercises.length > 0) {
      exHtml = dayData.exercises
        .map(
          (ex) => `
        <li class="exercise-item">
          <div class="exercise-name">${escapeHtml(ex.exercise)}</div>
          <div class="exercise-specs">
            <span class="spec-chip spec-sets">Sets: ${escapeHtml(ex.sets)}</span>
            <span class="spec-chip spec-reps">Reps: ${escapeHtml(ex.reps)}</span>
            <span class="spec-chip spec-rest">Rest: ${escapeHtml(ex.rest)}</span>
          </div>
        </li>
      `
        )
        .join("");
    } else {
      exHtml = `<li class="exercise-item"><div class="exercise-name" style="color: #94a3b8; font-style: italic;">Active Rest &amp; Regeneration Protocol</div></li>`;
    }

    card.innerHTML = `
      <div>
        <div class="day-card-header">
          <span class="day-badge">${escapeHtml(dayData.day || `Day ${dayNum}`)}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#64748b;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        </div>
        <h4 class="day-focus-title">${escapeHtml(dayData.focus || "Daily Conditioning")}</h4>
        <ul class="exercise-list">${exHtml}</ul>
      </div>
      <div class="recovery-note">
        <strong style="color: #fb923c;">Recovery:</strong> ${escapeHtml(dayData.rest_recovery || "Light static stretches and hydrate.")}
      </div>
    `;

    return card;
  }

  function renderActiveDayDetail(dayData) {
    if (!dayData) return;
    let exHtml = "";
    if (dayData.exercises && dayData.exercises.length > 0) {
      exHtml = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${dayData.exercises
            .map(
              (ex) => `
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(51, 65, 85, 0.8); border-radius: 12px; padding: 1rem;">
              <div style="font-weight: 800; font-size: 1rem; color: #fff; margin-bottom: 0.5rem;">${escapeHtml(ex.exercise)}</div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="spec-chip spec-sets">Sets: ${escapeHtml(ex.sets)}</span>
                <span class="spec-chip spec-reps">Reps: ${escapeHtml(ex.reps)}</span>
                <span class="spec-chip spec-rest">Rest: ${escapeHtml(ex.rest)}</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } else {
      exHtml = `<div style="text-align: center; padding: 2rem; background: rgba(15, 23, 42, 0.5); border-radius: 12px; color: #94a3b8;">Active Recovery &amp; Muscle Repair</div>`;
    }

    activeDayDetail.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <span class="day-badge">${escapeHtml(dayData.day)}</span>
          <h4 style="font-size: 1.5rem; font-weight: 900; color: #fff; margin-top: 0.5rem;">${escapeHtml(dayData.focus)}</h4>
        </div>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <h5 style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.75rem;">Scheduled Exercises</h5>
        ${exHtml}
      </div>
      <div class="recovery-note" style="font-size: 0.85rem;">
        <strong style="color: #fb923c;">Recovery Protocol:</strong> ${escapeHtml(dayData.rest_recovery)}
      </div>
    `;
  }

  // View toggle handlers
  viewGridBtn.addEventListener("click", () => {
    viewGridBtn.classList.add("active");
    viewTabsBtn.classList.remove("active");
    daysGrid.style.display = "grid";
    tabbedDayView.style.display = "none";
  });

  viewTabsBtn.addEventListener("click", () => {
    viewTabsBtn.classList.add("active");
    viewGridBtn.classList.remove("active");
    daysGrid.style.display = "none";
    tabbedDayView.style.display = "block";
  });

  // Quick suggestion chips
  document.querySelectorAll(".quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const text = chip.getAttribute("data-text");
      feedbackInput.value = text;
      feedbackInput.focus();
    });
  });

  // -----------------------------------------------------------
  // Submit Feedback & Real-Time Plan Regeneration
  // -----------------------------------------------------------
  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = feedbackInput.value.trim();

    if (!text || text.length < 3) {
      showToast("Please enter at least 3 characters of feedback", "error");
      return;
    }
    if (!currentUser || !currentPlan) {
      showToast("No active plan to update", "error");
      return;
    }

    submitFeedbackBtn.disabled = true;
    feedbackSpinner.style.display = "flex";

    try {
      const res = await apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUser.id,
          plan_id: currentPlan.id,
          feedback_text: text,
        }),
      });

      // Update active plan
      currentPlan = {
        id: currentPlan.id,
        user_id: currentUser.id,
        plan_data: res.updated_plan,
        created_at: res.created_at,
      };

      renderDashboard(currentUser, currentPlan);
      feedbackInput.value = "";
      showToast("Plan successfully updated with your feedback!", "success");
      refreshHistoryCount();

      // Smooth scroll to routine
      document.querySelector(".schedule-section").scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      showToast(err.message || "Failed to update plan with feedback", "error");
    } finally {
      submitFeedbackBtn.disabled = false;
      feedbackSpinner.style.display = "none";
    }
  });

  // -----------------------------------------------------------
  // History Modal
  // -----------------------------------------------------------
  async function refreshHistoryCount() {
    if (!currentUser) return;
    try {
      const list = await apiFetch(`/plans/${currentUser.id}`);
      historyPlans = list;
      historyCount.textContent = list.length;
    } catch (e) {
      console.warn("History fetch:", e);
    }
  }

  viewHistoryBtn.addEventListener("click", async () => {
    if (!currentUser) return;
    historyItemsContainer.innerHTML = "<p class='empty-text'>Loading history...</p>";
    historyModal.style.display = "flex";

    try {
      const list = await apiFetch(`/plans/${currentUser.id}`);
      historyPlans = list;
      historyCount.textContent = list.length;

      if (!list || list.length === 0) {
        historyItemsContainer.innerHTML = "<p class='empty-text'>No saved plan versions found.</p>";
        return;
      }

      historyItemsContainer.innerHTML = "";
      list.forEach((p, idx) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
          <div class="history-item-top">
            <div class="history-item-title">${escapeHtml(p.plan_data.plan_title || `Routine Version #${list.length - idx}`)}</div>
            <span class="history-item-badge">${p.plan_data.days?.length || 7} Days</span>
          </div>
          <div class="history-item-date">${new Date(p.created_at).toLocaleString()}</div>
          <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.35rem;">${escapeHtml(p.plan_data.overview || "")}</p>
        `;
        item.addEventListener("click", () => {
          currentPlan = p;
          renderDashboard(currentUser, p);
          historyModal.style.display = "none";
          showToast("Loaded routine from history.", "success");
        });
        historyItemsContainer.appendChild(item);
      });
    } catch (err) {
      historyItemsContainer.innerHTML = `<p class="error-msg">${escapeHtml(err.message)}</p>`;
    }
  });

  closeHistoryModal.addEventListener("click", () => {
    historyModal.style.display = "none";
  });

  historyModal.addEventListener("click", (e) => {
    if (e.target === historyModal) historyModal.style.display = "none";
  });

  // Re-evaluate button
  btnReEval.addEventListener("click", () => {
    wizardContainer.style.display = "block";
    dashboardView.style.display = "none";
    goToStep(1);
  });

  // Print button
  btnPrintPlan.addEventListener("click", () => window.print());

  // Top Nav Actions
  navBuilderBtn.addEventListener("click", () => {
    wizardContainer.style.display = "block";
    dashboardView.style.display = "none";
    goToStep(1);
  });

  navScheduleBtn.addEventListener("click", () => {
    if (currentPlan) {
      wizardContainer.style.display = "none";
      dashboardView.style.display = "flex";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  headerCtaBtn.addEventListener("click", () => {
    wizardContainer.style.display = "block";
    dashboardView.style.display = "none";
    goToStep(1);
  });

  brandHomeBtn.addEventListener("click", () => {
    if (currentPlan) {
      wizardContainer.style.display = "none";
      dashboardView.style.display = "flex";
    } else {
      goToStep(1);
    }
  });
});
