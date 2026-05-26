# Implementation Plan: Complete Pandemic Platform Features

## Overview

This implementation plan creates 20 UI features that expose existing backend simulation capabilities in the National Pandemic Simulation Platform. All backend functions already exist in `simulation.ts` and `mockData.ts` — this plan focuses on creating React components that surface these capabilities with consistent UX patterns using TypeScript, React 18, TanStack Router, shadcn/ui, and Recharts.

## Tasks

- [x] 1. Enhance Dashboard with Collapse Risk and Supply Alerts
  - [x] 1.1 Create CollapseRiskWatch component
    - Create `src/components/CollapseRiskWatch.tsx` with TypeScript interface
    - Call `predictHealthcareCollapse()` backend function using `useMemo`
    - Render top 4 districts with city, state, ICU load %, risk level, and risk score
    - Implement color mapping: Critical → red, High → orange, Moderate → blue, Low → green
    - Add link to Intelligence Hub for full table
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 1.2 Integrate CollapseRiskWatch into Dashboard
    - Import and render CollapseRiskWatch component in `src/routes/_app/dashboard.tsx`
    - Position in existing grid layout below forecast chart
    - _Requirements: 1.1_
  
  - [x] 1.3 Add Critical Supply Alerts to Dashboard
    - Filter `medicineDemand` array for medicines with `stockDays <= 5`
    - Render inline within National Resource Status panel
    - Display medicine name and stock days with color coding (≤3 days: red, 4-5 days: orange)
    - Show up to 3 critical medicines
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Checkpoint - Verify Dashboard enhancements
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Enhance Map Page with Intervention Controls and SEIR Parameters
  - [x] 3.1 Create InterventionPanel component
    - Create `src/components/InterventionPanel.tsx` with TypeScript props interface
    - Accept interventions array, onToggle callback, effectiveR0, and reductionPct as props
    - Render each intervention with checkbox, label, and impact percentage
    - Display calculated case reduction percentage below intervention list
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 3.2 Integrate intervention controls into Map Page
    - Add state management for interventions array in `src/routes/_app/map.tsx`
    - Add "Interventions" toggle button in control panel
    - Implement expand/collapse behavior for intervention panel
    - Wire up `analyzeInterventions()` backend function with `useMemo` for reactive computation
    - Update SEIR projection chart when interventions change
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 3.3 Add SEIR model parameter controls to Map Page
    - Add "Disease Model" dropdown with options: COVID-19, Influenza H1N1, Dengue, Custom
    - Add "Base Spread Rate" slider (range 1-10) representing R₀ values
    - Display current R₀ value next to slider in teal color
    - Recalculate simulation using new R₀ via `analyzeInterventions()` on slider change
    - Update SEIR projection chart within 100ms of parameter change
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [x] 3.4 Implement simulation playback controls
    - Add "Simulation Day" slider (range 0-30) to Map Page
    - Add "Run Simulation" button that starts automatic playback
    - Implement auto-increment of simDay every 600ms when running
    - Change button to "Pause" with pause icon when simulation is running
    - Stop playback when user manually adjusts slider or when simDay reaches 30
    - Display current simulation day as "D+{simDay}" next to slider
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [x] 4. Checkpoint - Verify Map Page enhancements
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add Vaccine Distribution Optimizer to Resources Page
  - [x] 5.1 Create VaccineOptimizer component
    - Create `src/components/VaccineOptimizer.tsx` with TypeScript interface
    - Add state for total doses with initial value 2,400,000
    - Call `optimizeVaccineDistribution()` backend function with `useMemo`
    - Render table showing city, state, priority level, recommended doses, and coverage gap for top 10 cities
    - Implement priority badge colors: P1 → red, P2 → orange, P3 → green
    - Add slider control for total available doses (range: 1M - 5M doses, step: 100K)
    - Create bar chart showing total dose allocation by priority level using Recharts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [x] 5.2 Integrate VaccineOptimizer into Resources Page
    - Import and render VaccineOptimizer component in `src/routes/_app/resources.tsx`
    - Position above hospital resource table in grid layout
    - _Requirements: 4.1_

- [x] 6. Enhance Resources Page with Hospital Filtering
  - [x] 6.1 Add hospital status filtering controls
    - Add "Critical only" checkbox filter above hospital table in `src/routes/_app/resources.tsx`
    - Add state dropdown filter with "All India" and individual state options
    - Implement filter logic: critical filter checks `icuUsed / icuCapacity >= 0.85`
    - Update hospital table immediately when filters change
    - Maintain filter state during user session
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [x] 7. Checkpoint - Verify Resources Page enhancements
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Enhance Intelligence Hub with Impact Analysis
  - [x] 8.1 Add Intervention Impact Summary to Intelligence Hub
    - In `src/routes/_app/intelligence.tsx` Interventions tab, create "Impact Analysis — 30 Days" panel
    - Display four metrics: Effective R₀, Case Reduction %, Baseline Infections, With Interventions
    - Implement color coding: Effective R₀ → teal, Case Reduction % → green, Baseline → red, With Interventions → blue
    - Display hospitalization delta (difference in hospital beds needed) below metrics
    - Color hospitalization delta: negative → green, positive → red
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_

- [x] 9. Add Outbreak Cluster Detection to Symptoms Page
  - [x] 9.1 Create OutbreakClusterDetection component
    - Create `src/components/OutbreakClusterDetection.tsx` with TypeScript interface
    - Implement cluster detection logic: identify districts with symptom report spikes > 200% vs 24h baseline
    - Render each cluster with district name, spike percentage, and severity indicator
    - Implement color coding: spike > 300% → red, spike 200-300% → orange
    - Display "EMERGING CLUSTER" badge for all detected clusters
    - Show at least 3 clusters sorted by spike percentage descending
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 9.2 Integrate OutbreakClusterDetection into Symptoms Page
    - Import and render OutbreakClusterDetection component in `src/routes/_app/symptoms.tsx`
    - Position below symptom reporting form
    - _Requirements: 6.1_

- [ ] 10. Add Emergency Scenario Action Tracking to Planning Page
  - [ ] 10.1 Create ActionTracker component
    - Create `src/components/ActionTracker.tsx` with TypeScript props interface
    - Accept scenario and onToggleAction callback as props
    - Render action checklist with checkbox, task description, owner, and ETA for each action
    - Implement checkbox toggle behavior for action completion
    - Display completed actions with strikethrough text and green checkmark icon
    - Display incomplete actions with normal text and empty circle icon
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [ ] 10.2 Integrate ActionTracker into Planning Page
    - Import ActionTracker component in `src/routes/_app/planning.tsx`
    - Display all emergency scenarios from `emergencyScenarios` backend function
    - Render each scenario with name, severity, status, zones covered, and lead agency
    - Add scenario selection state management
    - Show ActionTracker when a scenario is selected
    - Persist action completion state in component state during session
    - _Requirements: 7.1, 7.2, 7.3, 7.8_

- [ ] 11. Checkpoint - Verify Symptoms and Planning Page enhancements
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Enhance Passport Page with Vaccination Records and Health Tracking
  - [ ] 12.1 Add vaccination record verification to Passport Page
    - In `src/routes/_app/passport.tsx`, create "Vaccination Record" section
    - Render each dose from `myPassport.doses` with dose number, vaccine name, date, site, and batch number
    - Display "COWIN VERIFIED" badge with green checkmark for verified doses
    - Display "PENDING VERIFICATION" badge with yellow warning icon for unverified doses
    - Add "Sync with CoWIN" button that triggers toast notification
    - Use card layout with consistent spacing and typography
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 12.2 Create DailySymptomHistory component
    - Create `src/components/DailySymptomHistory.tsx` with TypeScript interface
    - Implement 7-day calendar grid showing check-in status for each day
    - Implement color coding: ok → green, mild → orange, bad → red, none → gray with dashed border
    - Add "Check In Today" button that opens symptom reporting modal
    - Update current day's status based on temperature and symptoms when user submits check-in
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [ ] 12.3 Integrate DailySymptomHistory into Passport Page
    - Import and render DailySymptomHistory component in `src/routes/_app/passport.tsx`
    - Position below vaccination record section
    - _Requirements: 9.1_
  
  - [ ] 12.4 Add pandemic readiness score to Passport Page
    - Implement `computeScore()` function in `src/routes/_app/passport.tsx`
    - Award points: 20 for blood type, 15 for allergies, 25 for 2+ doses, 20 for 2+ emergency contacts, 20 for conditions/medications
    - Display score as percentage (0-100%) in large teal text
    - Render progress bar showing score visually
    - Add description text explaining score calculation
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_
  
  - [ ] 12.5 Add emergency contact quick actions to Passport Page
    - Create "Emergency Contacts" panel in `src/routes/_app/passport.tsx`
    - Render each contact from `myPassport.emergencyContacts` with name and phone number
    - Make each contact a clickable card with hover effect
    - Implement tel: protocol for phone calls when contact card is clicked
    - Display phone icon on right side of each contact card
    - Render phone numbers in teal color using monospace font
    - Add visual feedback (background color change) on hover
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

- [ ] 13. Checkpoint - Verify Passport Page enhancements
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Add Offline Facility Caching to Offline Page
  - [ ] 14.1 Implement offline facility caching
    - In `src/routes/_app/offline.tsx`, add "Save My Area" button
    - Implement `saveOfflineData()` function that stores facilities in localStorage
    - Save current timestamp as "sentinel.offlineSavedAt" in localStorage
    - Save facilities array as "sentinel.facilities" in localStorage
    - Display "CACHE READY" confirmation with timestamp when save completes
    - Show number of cached facilities and district contacts in confirmation
    - Add "Test Offline Mode" button that renders offline interface using cached data
    - Display emergency contact buttons (112, 108, 1298) with tel: links in offline mode
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [ ] 14.2 Add facility type filtering to Offline Page
    - Add filter state with options: 'all', 'hospital', '24hr', 'oxygen'
    - Render filter buttons above facility list in offline mode
    - Implement filter logic: hospital → type includes "Hospital", 24hr → open24hr is true, oxygen → hasOxygen is true
    - Highlight active filter button with teal background
    - Update facility list immediately when filter changes
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [ ] 15. Add State-Level Vaccination Breakdown to Vaccination Page
  - [ ] 15.1 Create state vaccination breakdown chart
    - In `src/routes/_app/vaccination.tsx`, create "State Coverage Breakdown" panel
    - Render stacked bar chart using `stateVaccination` data from mockData
    - Display three segments per state: fully vaccinated (green), partial (orange), unvaccinated (red)
    - Show state codes on X-axis using JetBrains Mono font
    - Show percentage values on Y-axis (0-100%)
    - Add legend identifying "Fully", "Partial", and "Unvax" segments
    - Use consistent colors: green (#10b981), orange (#f59e0b), red (#ef4444)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 16. Enhance Dashboard with Real-Time Alert Streaming
  - [ ] 16.1 Add live alert indicators to Dashboard
    - In `src/routes/_app/dashboard.tsx`, enhance "Live Alerts" panel
    - Display top 5 alerts from alerts array in mockData
    - Render each alert with severity indicator, message, district, and timestamp
    - Implement severity color coding: RED → red, AMBER → orange, GREEN → green
    - Add "AUTO-REFRESH 30s" indicator in panel header
    - Add pulsing "LIVE" indicator with animation in panel header
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_

- [ ] 17. Final checkpoint - Integration and verification
  - [ ] 17.1 Verify all components render correctly
    - Test Dashboard with CollapseRiskWatch, CriticalSupplyAlerts, and LiveAlerts
    - Test Map Page with InterventionPanel, SEIR controls, and simulation playback
    - Test Resources Page with VaccineOptimizer and hospital filters
    - Test Intelligence Hub with Impact Analysis
    - Test Planning Page with ActionTracker
    - Test Passport Page with vaccination records, symptom history, readiness score, and emergency contacts
    - Test Symptoms Page with OutbreakClusterDetection
    - Test Offline Page with facility caching and filters
    - Test Vaccination Page with state breakdown chart
    - _Requirements: All requirements 1-20_
  
  - [ ] 17.2 Verify consistent styling and UX patterns
    - Confirm all components use "panel" class styling
    - Verify color scheme consistency (CSS variables: --teal, --severe, --moderate, --mild, --blue, --purple)
    - Check typography: JetBrains Mono for monospace, font-display for headings
    - Test responsive layout on mobile and desktop
    - Verify hover effects and transitions
    - _Requirements: All requirements 1-20_
  
  - [ ] 17.3 Verify backend integration
    - Confirm all components call correct backend functions from simulation.ts and mockData.ts
    - Verify useMemo hooks prevent unnecessary recalculations
    - Test reactive updates when user changes inputs (sliders, checkboxes, filters)
    - Verify localStorage persistence for offline caching
    - _Requirements: All requirements 1-20_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All backend functions already exist in `simulation.ts` and `mockData.ts` - no backend changes needed
- Components use existing shadcn/ui library and Recharts for consistency
- State management uses React hooks (useState, useMemo, useEffect) - no global state needed
- All components follow existing design patterns from dashboard.tsx, intelligence.tsx, and map.tsx
- TypeScript interfaces ensure type safety throughout implementation
- Testing focuses on unit tests for helper functions and integration tests for component rendering
- Property-based testing is not applicable for this UI-focused feature (see design document rationale)
