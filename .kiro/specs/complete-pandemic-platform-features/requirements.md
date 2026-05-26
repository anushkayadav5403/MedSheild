# Requirements Document

## Introduction

This document specifies requirements for completing the National Pandemic Simulation & Healthcare Crisis Intelligence Platform by implementing missing UI components that expose existing backend features. The platform currently has comprehensive backend simulation logic (SEIR models, forecasting, vaccine optimization, healthcare collapse prediction, mobility simulation, intervention analysis) but some features are not fully exposed in the user interface. This specification focuses on surfacing all backend capabilities with consistent UI/UX patterns matching the existing design system.

## Glossary

- **Platform**: The National Pandemic Simulation & Healthcare Crisis Intelligence Platform web application
- **Dashboard**: The main overview page showing national statistics and alerts
- **Intelligence_Hub**: The advanced analytics page with AI forecasting and intervention analysis
- **Map_Page**: The geospatial visualization page with outbreak simulation
- **Resources_Page**: The hospital resource monitoring and medicine demand analytics page
- **Planning_Page**: The emergency response planning and scenario management page
- **Vaccination_Page**: The national vaccination tracking and state-level breakdown page
- **Passport_Page**: The citizen health passport with QR code and vaccination records
- **Symptoms_Page**: The citizen symptom reporting and outbreak cluster detection page
- **Settings_Page**: The configuration and role switching page
- **Offline_Page**: The offline-first crisis cache for network-loss scenarios
- **Backend_Functions**: The simulation.ts module containing all analytical algorithms
- **UI_Component**: A React component that renders data visualization or interactive controls
- **shadcn_ui**: The component library used for consistent UI patterns
- **SEIR_Model**: Susceptible-Exposed-Infected-Recovered epidemiological model
- **Intervention**: A policy measure that affects disease transmission (lockdown, masks, curfew, etc.)
- **Collapse_Risk**: A metric predicting healthcare system failure based on ICU load and case pressure

## Requirements

### Requirement 1: Expose Healthcare Collapse Prediction on Dashboard

**User Story:** As a crisis responder, I want to see healthcare collapse predictions prominently on the dashboard, so that I can prioritize resource allocation to at-risk districts.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Platform SHALL display a "Collapse Risk Watch" panel showing the top 4 districts by risk score
2. THE Platform SHALL render each district entry with city name, state, ICU load percentage, risk level, and risk score
3. WHEN a district has a "Critical" risk level, THE Platform SHALL display the risk score in red (var(--severe))
4. WHEN a district has a "High" risk level, THE Platform SHALL display the risk score in orange (var(--moderate))
5. THE Platform SHALL provide a link to the Intelligence_Hub for viewing the complete collapse risk table
6. FOR ALL districts displayed, THE Platform SHALL use data from the predictHealthcareCollapse() Backend_Function

### Requirement 2: Add Medicine Demand Alerts to Dashboard

**User Story:** As a healthcare coordinator, I want to see critical medicine supply alerts on the dashboard, so that I can request emergency procurement before stockouts occur.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Platform SHALL display a "Critical Supply Alerts" section within the National Resource Status panel
2. THE Platform SHALL filter medicines where stockDays <= 5 from the medicineDemand Backend_Function
3. THE Platform SHALL display up to 3 critical medicines with name and remaining stock days
4. WHEN a medicine has <= 3 days of stock, THE Platform SHALL display the stock days in red (var(--red))
5. WHEN a medicine has 4-5 days of stock, THE Platform SHALL display the stock days in orange (var(--moderate))

### Requirement 3: Enhance Map Page with Real-Time Intervention Controls

**User Story:** As a crisis responder, I want to toggle intervention policies on the map page and see immediate impact on the simulation, so that I can evaluate policy effectiveness before implementation.

#### Acceptance Criteria

1. WHEN the Map_Page loads, THE Platform SHALL display an "Interventions" toggle button in the control panel
2. WHEN the user clicks the interventions toggle, THE Platform SHALL expand a panel showing all available interventions from defaultInterventions
3. THE Platform SHALL render each intervention with a checkbox, label, and impact percentage
4. WHEN the user toggles an intervention checkbox, THE Platform SHALL recalculate the effective R₀ using analyzeInterventions() Backend_Function
5. THE Platform SHALL update the SEIR projection chart to reflect the new effective R₀ within 100ms
6. THE Platform SHALL display the calculated case reduction percentage below the intervention list
7. THE Platform SHALL persist intervention selections during the simulation playback

### Requirement 4: Add Vaccine Distribution Optimizer to Resources Page

**User Story:** As a healthcare coordinator, I want to see optimized vaccine allocation recommendations on the resources page, so that I can coordinate distribution with district health officers.

#### Acceptance Criteria

1. WHEN the Resources_Page loads, THE Platform SHALL display a "Vaccine Distribution Optimizer" panel
2. THE Platform SHALL call optimizeVaccineDistribution() Backend_Function with a configurable total dose parameter
3. THE Platform SHALL render a table showing city, state, priority level, recommended doses, and coverage gap for the top 10 cities
4. WHEN a city has priority "P1", THE Platform SHALL display the priority badge in red (var(--red))
5. WHEN a city has priority "P2", THE Platform SHALL display the priority badge in orange (var(--moderate))
6. WHEN a city has priority "P3", THE Platform SHALL display the priority badge in green (var(--mild))
7. THE Platform SHALL provide a bar chart showing total dose allocation by priority level (P1, P2, P3)
8. THE Platform SHALL allow the user to adjust the total available doses using a slider control (range: 1M - 5M doses)

### Requirement 5: Add Mobility Flow Visualization to Intelligence Hub

**User Story:** As a crisis responder, I want to visualize population mobility flows between cities, so that I can identify high-risk travel corridors and implement targeted restrictions.

#### Acceptance Criteria

1. WHEN the Intelligence_Hub "Mobility Sim" tab is active, THE Platform SHALL display a "Population Mobility Flows" table
2. THE Platform SHALL call simulateMobility() Backend_Function with the current lockdown level parameter
3. THE Platform SHALL render each flow with origin city, destination city, daily volume, and risk contribution index
4. WHEN a flow has risk contribution > 80, THE Platform SHALL display the risk index in red (var(--red))
5. WHEN a flow has risk contribution 50-80, THE Platform SHALL display the risk index in orange (var(--moderate))
6. WHEN a flow has risk contribution < 50, THE Platform SHALL display the risk index in green (var(--mild))
7. THE Platform SHALL provide a lockdown intensity slider (0-100%) that updates the mobility simulation in real-time
8. THE Platform SHALL display the current lockdown percentage next to the slider control

### Requirement 6: Enhance Symptoms Page with Outbreak Cluster Detection

**User Story:** As a citizen, I want to see suspected outbreak clusters in my region, so that I can avoid high-risk areas and take extra precautions.

#### Acceptance Criteria

1. WHEN the Symptoms_Page loads, THE Platform SHALL display a "Suspected Outbreak Clusters" panel
2. THE Platform SHALL identify districts with symptom report spikes > 200% compared to 24-hour baseline
3. THE Platform SHALL render each cluster with district name, spike percentage, and severity indicator
4. WHEN a cluster has spike > 300%, THE Platform SHALL display it with red styling (var(--red))
5. WHEN a cluster has spike 200-300%, THE Platform SHALL display it with orange styling (var(--moderate))
6. THE Platform SHALL display an "EMERGING CLUSTER" badge for all detected clusters
7. THE Platform SHALL show at least 3 clusters if available, sorted by spike percentage descending

### Requirement 7: Add Emergency Scenario Action Tracking to Planning Page

**User Story:** As a crisis responder, I want to track completion status of emergency response actions, so that I can monitor progress and identify bottlenecks in real-time.

#### Acceptance Criteria

1. WHEN the Planning_Page loads, THE Platform SHALL display all emergency scenarios from emergencyScenarios Backend_Function
2. THE Platform SHALL render each scenario with name, severity, status, zones covered, and lead agency
3. WHEN a user selects a scenario, THE Platform SHALL display an "Action Checklist" with all associated actions
4. THE Platform SHALL render each action with a checkbox, task description, owner, and ETA
5. WHEN a user clicks an action checkbox, THE Platform SHALL toggle the action's done status
6. WHEN an action is marked done, THE Platform SHALL display it with strikethrough text and a green checkmark icon
7. WHEN an action is not done, THE Platform SHALL display it with normal text and an empty circle icon
8. THE Platform SHALL persist action completion state in component state during the session

### Requirement 8: Add Vaccination Record Verification to Passport Page

**User Story:** As a citizen, I want to see verification status for each vaccination dose, so that I can confirm my records are officially recognized.

#### Acceptance Criteria

1. WHEN the Passport_Page loads, THE Platform SHALL display a "Vaccination Record" section
2. THE Platform SHALL render each dose from myPassport.doses with dose number, vaccine name, date, site, and batch number
3. WHEN a dose has verified: true, THE Platform SHALL display a "COWIN VERIFIED" badge with a green checkmark icon
4. WHEN a dose has verified: false, THE Platform SHALL display a "PENDING VERIFICATION" badge with a yellow warning icon
5. THE Platform SHALL provide a "Sync with CoWIN" button that triggers a toast notification
6. THE Platform SHALL display dose information in a card layout with consistent spacing and typography

### Requirement 9: Add Daily Symptom Check-in History to Passport Page

**User Story:** As a citizen, I want to see my 7-day symptom check-in history, so that I can track my health status over time and share it with healthcare providers.

#### Acceptance Criteria

1. WHEN the Passport_Page loads, THE Platform SHALL display a "Daily Symptom Check-in" section
2. THE Platform SHALL render a 7-day calendar grid showing check-in status for each day
3. WHEN a day has status "ok", THE Platform SHALL display it with green styling (var(--mild))
4. WHEN a day has status "mild", THE Platform SHALL display it with orange styling (var(--moderate))
5. WHEN a day has status "bad", THE Platform SHALL display it with red styling (var(--red))
6. WHEN a day has status "none", THE Platform SHALL display it with gray styling and dashed border
7. THE Platform SHALL provide a "Check In Today" button that opens a symptom reporting modal
8. WHEN the user submits a check-in, THE Platform SHALL update the current day's status based on temperature and symptoms

### Requirement 10: Add Offline Facility Caching to Offline Page

**User Story:** As a citizen, I want to save nearby healthcare facilities to my device, so that I can access critical contact information during network outages.

#### Acceptance Criteria

1. WHEN the Offline_Page loads, THE Platform SHALL display a "Save My Area" button
2. WHEN the user clicks "Save My Area", THE Platform SHALL store facilities data in localStorage
3. THE Platform SHALL save the current timestamp as "sentinel.offlineSavedAt" in localStorage
4. THE Platform SHALL save the facilities array as "sentinel.facilities" in localStorage
5. WHEN the save operation completes, THE Platform SHALL display a "CACHE READY" confirmation with timestamp
6. THE Platform SHALL show the number of cached facilities and district contacts in the confirmation
7. WHEN the user clicks "Test Offline Mode", THE Platform SHALL render the offline interface using cached data
8. THE Platform SHALL display emergency contact buttons (112, 108, 1298) with tel: links in offline mode

### Requirement 11: Add Resource Demand Forecasting to Resources Page

**User Story:** As a healthcare coordinator, I want to see projected medicine demand for the next 7 days, so that I can proactively request supplies before shortages occur.

#### Acceptance Criteria

1. WHEN the Resources_Page loads, THE Platform SHALL display a "Resource Demand Analytics" panel
2. THE Platform SHALL render a horizontal bar chart showing daily units for each medicine from medicineDemand Backend_Function
3. THE Platform SHALL display a list of medicines with name, daily units, stock days, and trend indicator
4. WHEN a medicine has stockDays <= 4, THE Platform SHALL display stock days in red (var(--red))
5. WHEN a medicine has stockDays 5-8, THE Platform SHALL display stock days in orange (var(--moderate))
6. WHEN a medicine has stockDays > 8, THE Platform SHALL display stock days in green (var(--mild))
7. THE Platform SHALL show trend indicators ("rising", "stable", "falling") for each medicine

### Requirement 12: Add State-Level Vaccination Breakdown to Vaccination Page

**User Story:** As a healthcare coordinator, I want to see vaccination coverage by state, so that I can identify regions needing targeted campaigns.

#### Acceptance Criteria

1. WHEN the Vaccination_Page loads, THE Platform SHALL display a "State Coverage Breakdown" panel
2. THE Platform SHALL render a stacked bar chart using stateVaccination data from mockData
3. THE Platform SHALL display three segments per state: fully vaccinated (green), partial (orange), unvaccinated (red)
4. THE Platform SHALL show state codes on the X-axis using JetBrains Mono font
5. THE Platform SHALL show percentage values on the Y-axis (0-100%)
6. THE Platform SHALL provide a legend identifying "Fully", "Partial", and "Unvax" segments
7. THE Platform SHALL use consistent colors: green (#10b981), orange (#f59e0b), red (#ef4444)

### Requirement 13: Add SEIR Model Parameter Controls to Map Page

**User Story:** As a crisis responder, I want to adjust SEIR model parameters on the map page, so that I can simulate different disease characteristics and evaluate preparedness.

#### Acceptance Criteria

1. WHEN the Map_Page loads, THE Platform SHALL display a "Disease Model" dropdown in the control panel
2. THE Platform SHALL provide options: "COVID-19", "Influenza H1N1", "Dengue", "Custom"
3. THE Platform SHALL display a "Base Spread Rate" slider with range 1-10 representing R₀ values
4. WHEN the user adjusts the spread rate slider, THE Platform SHALL update the displayed R₀ value in real-time
5. THE Platform SHALL recalculate the simulation using the new R₀ value via analyzeInterventions() Backend_Function
6. THE Platform SHALL update the SEIR projection chart to reflect the new parameters within 100ms
7. THE Platform SHALL display the current R₀ value next to the slider in teal color (var(--teal))

### Requirement 14: Add Hospital Status Filtering to Resources Page

**User Story:** As a healthcare coordinator, I want to filter hospitals by operational status, so that I can quickly identify facilities in crisis.

#### Acceptance Criteria

1. WHEN the Resources_Page loads, THE Platform SHALL display filter controls above the hospital table
2. THE Platform SHALL provide a "Critical only" checkbox filter
3. WHEN the "Critical only" checkbox is checked, THE Platform SHALL filter hospitals where icuUsed / icuCapacity >= 0.85
4. THE Platform SHALL provide a state dropdown filter with "All India" and individual state options
5. WHEN a state is selected, THE Platform SHALL filter hospitals matching that state
6. THE Platform SHALL update the hospital table immediately when filters change
7. THE Platform SHALL maintain filter state during the user session

### Requirement 15: Add Intervention Impact Summary to Intelligence Hub

**User Story:** As a crisis responder, I want to see a summary of intervention impact metrics, so that I can quickly assess the effectiveness of current policies.

#### Acceptance Criteria

1. WHEN the Intelligence_Hub "Interventions" tab is active, THE Platform SHALL display an "Impact Analysis — 30 Days" panel
2. THE Platform SHALL call analyzeInterventions() Backend_Function with current base R₀ and enabled interventions
3. THE Platform SHALL display four metrics: Effective R₀, Case Reduction %, Baseline Infections, With Interventions
4. THE Platform SHALL render Effective R₀ in teal color (var(--teal))
5. THE Platform SHALL render Case Reduction % in green color (var(--mild))
6. THE Platform SHALL render Baseline Infections in red color (var(--severe))
7. THE Platform SHALL render With Interventions in blue color (var(--blue))
8. THE Platform SHALL display hospitalization delta (difference in hospital beds needed) below the metrics
9. WHEN hospitalization delta is negative, THE Platform SHALL display it in green (var(--mild))
10. WHEN hospitalization delta is positive, THE Platform SHALL display it in red (var(--red))

### Requirement 16: Add Real-Time Alert Streaming to Dashboard

**User Story:** As a crisis responder, I want to see live alerts with auto-refresh indicators, so that I can respond to emerging situations immediately.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Platform SHALL display a "Live Alerts" panel
2. THE Platform SHALL render the top 5 alerts from the alerts array in mockData
3. THE Platform SHALL display each alert with severity indicator, message, district, and timestamp
4. WHEN an alert has severity "RED", THE Platform SHALL display it with red styling (var(--red))
5. WHEN an alert has severity "AMBER", THE Platform SHALL display it with orange styling (var(--moderate))
6. WHEN an alert has severity "GREEN", THE Platform SHALL display it with green styling (var(--mild))
7. THE Platform SHALL display an "AUTO-REFRESH 30s" indicator in the panel header
8. THE Platform SHALL show a pulsing "LIVE" indicator with animation in the panel header

### Requirement 17: Add Pandemic Readiness Score to Passport Page

**User Story:** As a citizen, I want to see my pandemic readiness score, so that I can understand my preparedness level and take action to improve it.

#### Acceptance Criteria

1. WHEN the Passport_Page loads, THE Platform SHALL calculate a readiness score using the computeScore() function
2. THE Platform SHALL display the score as a percentage (0-100%) in large teal text (var(--teal))
3. THE Platform SHALL render a progress bar showing the score visually
4. THE Platform SHALL award 20 points for having blood type information
5. THE Platform SHALL award 15 points for having allergy information
6. THE Platform SHALL award 25 points for having 2+ vaccination doses
7. THE Platform SHALL award 20 points for having 2+ emergency contacts
8. THE Platform SHALL award 20 points for having medical conditions or medications documented

### Requirement 18: Add Facility Type Filtering to Offline Page

**User Story:** As a citizen, I want to filter cached facilities by type and capabilities, so that I can quickly find the right facility during an emergency.

#### Acceptance Criteria

1. WHEN the Offline_Page is in offline mode, THE Platform SHALL display filter buttons above the facility list
2. THE Platform SHALL provide four filter options: "All", "Hospital", "24hr", "Oxygen"
3. WHEN "Hospital" is selected, THE Platform SHALL show only facilities where type includes "Hospital"
4. WHEN "24hr" is selected, THE Platform SHALL show only facilities where open24hr is true
5. WHEN "Oxygen" is selected, THE Platform SHALL show only facilities where hasOxygen is true
6. WHEN "All" is selected, THE Platform SHALL show all cached facilities
7. THE Platform SHALL highlight the active filter button with teal background (var(--teal))
8. THE Platform SHALL update the facility list immediately when filter changes

### Requirement 19: Add Simulation Playback Controls to Map Page

**User Story:** As a crisis responder, I want to play, pause, and scrub through the pandemic simulation, so that I can analyze outbreak progression at different time points.

#### Acceptance Criteria

1. WHEN the Map_Page loads, THE Platform SHALL display a "Simulation Day" slider (range 0-30)
2. THE Platform SHALL display a "Run Simulation" button that starts automatic playback
3. WHEN the user clicks "Run Simulation", THE Platform SHALL increment simDay every 600ms
4. WHEN the simulation is running, THE Platform SHALL change the button to "Pause" with a pause icon
5. WHEN the user clicks "Pause", THE Platform SHALL stop automatic playback
6. WHEN the user manually adjusts the slider, THE Platform SHALL stop automatic playback
7. THE Platform SHALL display the current simulation day as "D+{simDay}" next to the slider
8. WHEN simDay reaches 30, THE Platform SHALL automatically stop playback

### Requirement 20: Add Emergency Contact Quick Actions to Passport Page

**User Story:** As a citizen, I want to quickly call my emergency contacts from my passport, so that I can get help during a health crisis.

#### Acceptance Criteria

1. WHEN the Passport_Page loads, THE Platform SHALL display an "Emergency Contacts" panel
2. THE Platform SHALL render each contact from myPassport.emergencyContacts with name and phone number
3. THE Platform SHALL display each contact as a clickable card with hover effect
4. WHEN a user clicks a contact card, THE Platform SHALL initiate a phone call using tel: protocol
5. THE Platform SHALL display a phone icon on the right side of each contact card
6. THE Platform SHALL render phone numbers in teal color (var(--teal)) using monospace font
7. THE Platform SHALL provide visual feedback (background color change) on hover

