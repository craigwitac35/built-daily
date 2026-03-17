<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard — Built Daily</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>

  <!-- Header (Authenticated Nav) -->
  <header class="site-header">
    <div class="header-inner">
      <a href="dashboard.html" class="logo">
        <span class="logo-mark"></span>
        Built Daily
      </a>
      <nav class="nav-desktop">
        <a href="dashboard.html" class="active">Dashboard</a>
        <a href="profile.html">Profile</a>
        <a href="log.html">Log Food</a>
        <a href="weight.html">Weight</a>
        <a href="#" id="logout-btn">Logout</a>
      </nav>
      <button class="hamburger" aria-label="Toggle navigation">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
    <nav class="nav-mobile">
      <a href="dashboard.html" class="active">Dashboard</a>
      <a href="profile.html">Profile</a>
      <a href="log.html">Log Food</a>
      <a href="weight.html">Weight</a>
      <a href="#" id="logout-btn-mobile">Logout</a>
    </nav>
  </header>

  <!-- Main -->
  <main>
    <div class="container">

      <!-- Dashboard Header -->
      <div class="dashboard-header animate-in">
        <p class="dashboard-greeting" id="dash-greeting"></p>
        <h1>Your Daily Dashboard</h1>
        <p>Track your progress and stay focused on the habits that move you forward.</p>
      </div>

      <!-- Consistency & Streaks -->
      <div class="stats-grid animate-in delay-1">

        <div class="stat-card accent-border">
          <span class="stat-label">Consistency Score</span>
          <span class="stat-value" id="dash-consistency">–</span>
          <div class="progress-track">
            <div class="progress-bar" id="dash-consistency-bar"></div>
          </div>
          <span class="stat-note" id="dash-consistency-label">Last 7 days</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Current Streak</span>
          <span class="stat-value"><span id="dash-streak">0</span> <span class="stat-unit">days</span></span>
          <span class="stat-note">Consecutive days logged</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Best Streak</span>
          <span class="stat-value"><span id="dash-best-streak">0</span> <span class="stat-unit">days</span></span>
          <span class="stat-note">Personal record</span>
        </div>

      </div>

      <!-- Calorie Stats -->
      <h3 class="dashboard-section-title animate-in delay-2">Today's Calories</h3>
      <div class="stats-grid animate-in delay-2">

        <div class="stat-card accent-border">
          <span class="stat-label">Daily Calorie Target</span>
          <span class="stat-value" id="dash-calories-target">–</span>
          <span class="stat-note">Based on your profile and goal</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Calories Consumed</span>
          <span class="stat-value" id="dash-calories-consumed">0</span>
          <div class="progress-track">
            <div class="progress-bar" id="dash-calories-bar"></div>
          </div>
          <span class="stat-note">Logged today</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Calories Remaining</span>
          <span class="stat-value" id="dash-calories-remaining">–</span>
          <span class="stat-note">Left for today</span>
        </div>

      </div>

      <!-- Macros & Water -->
      <h3 class="dashboard-section-title animate-in delay-2">Today's Macros & Water</h3>
      <div class="stats-grid animate-in delay-2">

        <div class="stat-card">
          <span class="stat-label">Protein</span>
          <span class="stat-value"><span id="dash-protein">0</span> <span class="stat-unit">g</span></span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Carbs</span>
          <span class="stat-value"><span id="dash-carbs">0</span> <span class="stat-unit">g</span></span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Fat</span>
          <span class="stat-value"><span id="dash-fat">0</span> <span class="stat-unit">g</span></span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Water</span>
          <span class="stat-value"><span id="dash-water">0</span> <span class="stat-unit">glasses</span></span>
          <div class="progress-track">
            <div class="progress-bar" id="dash-water-bar"></div>
          </div>
          <span class="stat-note">Goal: 8 glasses</span>
        </div>

      </div>

      <!-- Weight Progress -->
      <h3 class="dashboard-section-title animate-in delay-3">Weight Progress</h3>
      <div class="stats-grid animate-in delay-3">

        <div class="stat-card accent-border">
          <span class="stat-label">Current Weight</span>
          <span class="stat-value"><span id="dash-weight-current">–</span> <span class="stat-unit">kg</span></span>
          <span class="stat-note">Most recent weigh-in</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Goal Weight</span>
          <span class="stat-value"><span id="dash-weight-goal">–</span> <span class="stat-unit">kg</span></span>
          <span class="stat-note">Target from profile</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Remaining</span>
          <span class="stat-value"><span id="dash-weight-remaining">–</span> <span class="stat-unit">kg</span></span>
          <span class="stat-note">Distance to goal</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Recent Change</span>
          <span class="stat-value" id="dash-weight-change">–</span>
          <span class="stat-note">Last 7 days</span>
        </div>

      </div>

      <!-- Weekly Summary -->
      <h3 class="dashboard-section-title animate-in delay-3">7-Day Summary</h3>
      <div class="stats-grid animate-in delay-3">

        <div class="stat-card accent-border">
          <span class="stat-label">Days Logged</span>
          <span class="stat-value" id="dash-week-days">0/7</span>
          <span class="stat-note">This week</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Avg Calories</span>
          <span class="stat-value"><span id="dash-week-calories">–</span> <span class="stat-unit">kcal</span></span>
          <span class="stat-note">Daily average</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Avg Protein</span>
          <span class="stat-value"><span id="dash-week-protein">–</span> <span class="stat-unit">g</span></span>
          <span class="stat-note">Daily average</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Avg Carbs</span>
          <span class="stat-value"><span id="dash-week-carbs">–</span> <span class="stat-unit">g</span></span>
          <span class="stat-note">Daily average</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Avg Fat</span>
          <span class="stat-value"><span id="dash-week-fat">–</span> <span class="stat-unit">g</span></span>
          <span class="stat-note">Daily average</span>
        </div>

      </div>

      <!-- Recent Logs -->
      <h3 class="dashboard-section-title animate-in delay-4">Recent Logs</h3>
      <div class="card recent-logs-card animate-in delay-4">
        <ul class="recent-logs-list" id="recent-logs-list">
          <li class="text-muted" style="padding:0.85rem 0">Loading…</li>
        </ul>
      </div>

      <!-- CTAs -->
      <div class="dashboard-cta animate-in delay-5">
        <a href="log.html" class="btn btn-primary">Log Today's Nutrition</a>
        <a href="weight.html" class="btn btn-ghost" style="margin-left: var(--space-sm);">Log Weight</a>
      </div>

    </div>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <p class="footer-name">Built Daily</p>
    <p class="footer-note">Discipline. Consistency. Progress.</p>
  </footer>

  <script src="js/nav.js"></script>
  <script type="module" src="js/dashboard.js"></script>
  <script type="module" src="js/auth.js"></script>
</body>
</html>
