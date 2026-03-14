# QMS Role-Based Department Workflow System — Claude Code Execution Plan

**Platform:** SankalpHub.in  
**Module:** Product Workflow & Order Progression Engine  
**Prepared for:** Claude Code (VS Code Remote)  
**Purpose:** Full build plan for a gated, role-based, department-wise workflow with progress visualization, approval gates, notifications, and order status integration.

---

## 0. CONTEXT & OBJECTIVE

Build a workflow engine inside the SankalpHub QMS platform that:

- Assigns each workflow **stage** to a **department** and a **responsible role/approver**
- Enforces **sequential gate logic** — no stage proceeds until the previous is approved
- Captures **mandatory reasons, comments, feedback, and challenges** at every stage transition
- Displays a **color-coded progress slider** on every workflow/order page
- Propagates workflow stage status into the **master Order Status** in real time
- Sends **delay notifications** to brand contacts or internal stakeholders when deadlines are missed
- Supports all product categories: Garments, Gloves, Footwear, Headwear, Accessories, Bags

---

## 1. DATABASE SCHEMA

### 1.1 Core Tables

```sql
-- Departments
CREATE TABLE departments (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,    -- e.g. "Quality", "Production"
  code          VARCHAR(20) UNIQUE NOT NULL,
  head_user_id  INTEGER REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Roles (within departments)
CREATE TABLE roles (
  id             SERIAL PRIMARY KEY,
  department_id  INTEGER REFERENCES departments(id),
  name           VARCHAR(100) NOT NULL,  -- e.g. "QC Inspector", "Department Head"
  is_approver    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  role_id       INTEGER REFERENCES roles(id),
  department_id INTEGER REFERENCES departments(id),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Product Categories
CREATE TABLE product_categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL  -- Garments, Gloves, Footwear, Headwear, Accessories, Bags
);

-- Workflow Templates (master stage definitions per product category)
CREATE TABLE workflow_templates (
  id                  SERIAL PRIMARY KEY,
  product_category_id INTEGER REFERENCES product_categories(id),
  stage_name          VARCHAR(150) NOT NULL,
  stage_code          VARCHAR(50) NOT NULL,
  sequence_number     INTEGER NOT NULL,
  department_id       INTEGER REFERENCES departments(id),
  approver_role_id    INTEGER REFERENCES roles(id),
  is_required         BOOLEAN DEFAULT TRUE,
  typical_duration_days INTEGER,
  description         TEXT,
  on_fail_go_to_seq   INTEGER,   -- if rejected, loop back to this sequence number
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Workflow Template Tasks
CREATE TABLE workflow_template_tasks (
  id                   SERIAL PRIMARY KEY,
  workflow_template_id INTEGER REFERENCES workflow_templates(id),
  task_name            VARCHAR(200) NOT NULL,
  output_type          VARCHAR(50),  -- 'document', 'report', 'approval', 'none'
  is_required          BOOLEAN DEFAULT TRUE,
  sequence_number      INTEGER NOT NULL
);

-- Orders
CREATE TABLE orders (
  id                  SERIAL PRIMARY KEY,
  order_number        VARCHAR(100) UNIQUE NOT NULL,
  product_category_id INTEGER REFERENCES product_categories(id),
  brand_name          VARCHAR(150),
  brand_contact_email VARCHAR(200),
  brand_contact_name  VARCHAR(150),
  po_number           VARCHAR(100),
  order_quantity      INTEGER,
  target_ship_date    DATE NOT NULL,
  current_status      VARCHAR(50) DEFAULT 'in_progress',
    -- Enum: in_progress | delayed | on_hold | completed | cancelled
  overall_progress_pct INTEGER DEFAULT 0,  -- 0–100
  assigned_merchandiser_id INTEGER REFERENCES users(id),
  created_by          INTEGER REFERENCES users(id),
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Order Workflow Instances (one row per stage per order)
CREATE TABLE order_workflow_stages (
  id                   SERIAL PRIMARY KEY,
  order_id             INTEGER REFERENCES orders(id),
  workflow_template_id INTEGER REFERENCES workflow_templates(id),
  sequence_number      INTEGER NOT NULL,
  stage_name           VARCHAR(150) NOT NULL,
  department_id        INTEGER REFERENCES departments(id),
  assigned_to_user_id  INTEGER REFERENCES users(id),
  approver_user_id     INTEGER REFERENCES users(id),
  status               VARCHAR(30) DEFAULT 'pending',
    -- Enum: pending | in_progress | submitted | approved | rejected | skipped
  planned_start_date   DATE,
  planned_end_date     DATE,
  actual_start_date    DATE,
  actual_end_date      DATE,
  is_delayed           BOOLEAN DEFAULT FALSE,
  delay_days           INTEGER DEFAULT 0,
  submitted_at         TIMESTAMP,
  approved_at          TIMESTAMP,
  rejected_at          TIMESTAMP,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

-- Stage Comments / Feedback / Challenges (mandatory on submit/approve/reject)
CREATE TABLE stage_comments (
  id                       SERIAL PRIMARY KEY,
  order_workflow_stage_id  INTEGER REFERENCES order_workflow_stages(id),
  order_id                 INTEGER REFERENCES orders(id),
  user_id                  INTEGER REFERENCES users(id),
  comment_type             VARCHAR(30) NOT NULL,
    -- Enum: submission_note | approval_note | rejection_reason | challenge | feedback | delay_reason
  comment_text             TEXT NOT NULL,
  is_mandatory_fulfilled   BOOLEAN DEFAULT TRUE,
  created_at               TIMESTAMP DEFAULT NOW()
);

-- Stage Task Completion (per order stage)
CREATE TABLE order_stage_tasks (
  id                       SERIAL PRIMARY KEY,
  order_workflow_stage_id  INTEGER REFERENCES order_workflow_stages(id),
  workflow_template_task_id INTEGER REFERENCES workflow_template_tasks(id),
  task_name                VARCHAR(200) NOT NULL,
  is_completed             BOOLEAN DEFAULT FALSE,
  completed_by_user_id     INTEGER REFERENCES users(id),
  completed_at             TIMESTAMP,
  notes                    TEXT
);

-- Notifications Log
CREATE TABLE notifications (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER REFERENCES orders(id),
  stage_id      INTEGER REFERENCES order_workflow_stages(id),
  recipient_id  INTEGER REFERENCES users(id),  -- NULL if external
  recipient_email VARCHAR(200),
  notification_type VARCHAR(50),
    -- Enum: stage_submitted | stage_approved | stage_rejected | delay_alert | approval_reminder | order_complete
  subject       TEXT,
  message       TEXT,
  is_sent       BOOLEAN DEFAULT FALSE,
  sent_at       TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### 1.2 Key Indexes

```sql
CREATE INDEX idx_order_workflow_stages_order   ON order_workflow_stages(order_id);
CREATE INDEX idx_order_workflow_stages_status  ON order_workflow_stages(status);
CREATE INDEX idx_stage_comments_stage          ON stage_comments(order_workflow_stage_id);
CREATE INDEX idx_notifications_order           ON notifications(order_id);
CREATE INDEX idx_notifications_unsent          ON notifications(is_sent) WHERE is_sent = FALSE;
```

---

## 2. WORKFLOW STAGE MASTER DATA

### 2.1 Complete 26-Stage Sequence (all categories default)

| Seq | Stage Code               | Stage Name                   | Department      | Approver Role           | Fail → Back to |
|-----|--------------------------|------------------------------|-----------------|-------------------------|----------------|
| 1   | DESIGN                   | Design                       | Design          | Design Head             | —              |
| 2   | DEVELOPMENT              | Development                  | Development     | Dev Manager             | 1              |
| 3   | SAMPLE_MATERIAL_SOURCING | Sample Material Sourcing     | Sourcing        | Sourcing Manager        | 2              |
| 4   | PROTOTYPE_SAMPLE         | Prototype Sample             | Sampling        | Sampling Head           | 3              |
| 5   | COSTING_INITIAL          | Initial Costing              | Costing         | Costing Manager         | 4              |
| 6   | MATERIAL_TESTING         | Material Testing             | Quality         | QC Manager              | 3              |
| 7   | FINAL_SAMPLE             | Final Sample Approval        | Development     | Dev Manager             | 4              |
| 8   | COSTING_FINAL            | Final Costing                | Costing         | Costing Manager         | 7              |
| 9   | PURCHASE_ORDER           | Purchase Order               | Sales           | Sales Head              | —              |
| 10  | MERCHANDISING            | Merchandising                | Merchandising   | Merchandiser            | —              |
| 11  | BULK_MATERIAL_ORDER      | Bulk Material Ordering       | Procurement     | Procurement Head        | 10             |
| 12  | TOOLING_PREP             | Tooling Preparation          | Production      | Production Manager      | 11             |
| 13  | SOP_CREATION             | SOP Creation                 | Quality         | QC Manager              | 12             |
| 14  | IQC                      | Incoming Material Inspection | Quality         | QC Inspector            | 11             |
| 15  | PRODUCTION_PLANNING      | Production Planning          | Production      | Production Manager      | 14             |
| 16  | CUTTING                  | Cutting                      | Production      | Cutting Supervisor      | 15             |
| 17  | STITCHING                | Stitching / Sewing           | Production      | Line Supervisor         | 16             |
| 18  | ASSEMBLY                 | Assembly / Finishing         | Production      | Production Manager      | 17             |
| 19  | INLINE_INSPECTION        | Inline Inspection            | Quality         | QC Inspector            | 17             |
| 20  | PACKING                  | Packing                      | Packing         | Packing Supervisor      | 19             |
| 21  | FINAL_INSPECTION         | Final Inspection (AQL)       | Quality         | QC Manager              | 18             |
| 22  | DISPATCH                 | Dispatch                     | Logistics       | Logistics Head          | 21             |
| 23  | CONTAINER_LOADING        | Container Loading            | Logistics       | Logistics Head          | 22             |
| 24  | SHIPMENT                 | Shipment / Handover to Port  | Logistics       | Logistics Head          | —              |
| 25  | WAREHOUSING              | Warehousing                  | Warehouse       | Warehouse Manager       | —              |
| 26  | DISTRIBUTION             | Distribution                 | Warehouse       | Warehouse Manager       | —              |

### 2.2 Category-Specific Overrides

```json
{
  "category_overrides": {
    "Footwear": {
      "rename": { "STITCHING": "Lasting & Stitching" },
      "add_after_ASSEMBLY": { "stage_code": "SOLE_ATTACHING", "stage_name": "Sole Attaching", "department": "Production" }
    },
    "Gloves": {
      "rename": { "STITCHING": "Glove Stitching / Dipping" }
    },
    "Accessories": {
      "skip_stages": ["PROTOTYPE_SAMPLE", "FINAL_SAMPLE", "TOOLING_PREP"]
    }
  }
}
```

---

## 3. WORKFLOW ENGINE LOGIC

### 3.1 Gate Enforcement Rules

```
RULE 1 — Sequential Lock
  A stage with status != 'approved' MUST block all stages with higher sequence_number.
  Frontend must disable / grey-out future stages visually.

RULE 2 — Mandatory Comment on Every Transition
  On SUBMIT:   comment_type = 'submission_note'   → required, min 10 chars
  On APPROVE:  comment_type = 'approval_note'     → required, min 10 chars  
  On REJECT:   comment_type = 'rejection_reason'  → required, min 20 chars
  Challenges can be added at any time by any department member on that stage.
  Feedback can be added by approver or management.

RULE 3 — Rejection Routing
  If a stage is rejected:
    1. Set current stage status = 'rejected'
    2. Look up on_fail_go_to_seq from workflow_templates
    3. Set that earlier stage status back to 'in_progress'
    4. Reset all intermediate stages to 'pending'
    5. Recalculate progress percentage
    6. Notify assigned user of the reverted stage + rejection_reason

RULE 4 — Final Approval = Management Sign-off
  Stage 26 (Distribution) or the last stage requires:
    - Department Head approval AND
    - Management / MD approval (role: 'Management Approver')
  Only after both approvals does order_status → 'completed'
```

### 3.2 Progress Calculation Algorithm

```javascript
function calculateProgress(orderWorkflowStages) {
  const total = orderWorkflowStages.filter(s => s.status !== 'skipped').length;
  const approved = orderWorkflowStages.filter(s => s.status === 'approved').length;
  const inProgress = orderWorkflowStages.filter(s => s.status === 'in_progress').length;

  // Approved stages count fully; in-progress counts as 50%
  const progressPct = Math.round(((approved + inProgress * 0.5) / total) * 100);
  return Math.min(progressPct, 99); // Only 100% when all stages approved
}

function getProgressColor(pct) {
  if (pct === 0)          return '#EF4444'; // Red     — not started
  if (pct <= 20)          return '#F97316'; // Orange  — early stages
  if (pct <= 40)          return '#EAB308'; // Yellow  — development phase
  if (pct <= 60)          return '#3B82F6'; // Blue    — production phase
  if (pct <= 80)          return '#8B5CF6'; // Purple  — QC/logistics phase
  if (pct < 100)          return '#22C55E'; // Light Green — nearly done
  return '#16A34A';                          // Deep Green  — completed & verified
}
```

### 3.3 Order Status Mapping

```
Workflow State                         →  Order Status
─────────────────────────────────────────────────────────
All stages pending                     →  "Not Started"
Stage 1–8 in progress/approved         →  "In Development"
Stage 9 (PO) approved                  →  "Order Confirmed"
Stage 11–15 in progress/approved       →  "Pre-Production"
Stage 16–18 in progress                →  "In Production"
Stage 19–21 in progress                →  "Quality Control"
Stage 22–24 approved                   →  "Shipped"
Stage 25–26 approved                   →  "Delivered"
Any stage rejected AND delay_days > 0  →  "Delayed"
Manual hold (admin action)             →  "On Hold"
All 26 stages approved                 →  "Completed"
```

---

## 4. API ENDPOINTS

### 4.1 Workflow Template APIs

```
GET    /api/workflow-templates                          List all templates
GET    /api/workflow-templates/:product_category_id    Template for category
POST   /api/workflow-templates                         Create template stage
PUT    /api/workflow-templates/:id                     Update stage
```

### 4.2 Order Workflow APIs

```
POST   /api/orders/:orderId/workflow/initialize        Instantiate stages from template
GET    /api/orders/:orderId/workflow                   Get all stages + statuses + comments
GET    /api/orders/:orderId/workflow/:stageId          Get single stage detail
PATCH  /api/orders/:orderId/workflow/:stageId/start    Mark stage as in_progress
POST   /api/orders/:orderId/workflow/:stageId/submit   Submit for approval (+ mandatory comment)
POST   /api/orders/:orderId/workflow/:stageId/approve  Approve stage (+ approval note)
POST   /api/orders/:orderId/workflow/:stageId/reject   Reject stage (+ mandatory rejection reason)
POST   /api/orders/:orderId/workflow/:stageId/comment  Add challenge/feedback anytime
GET    /api/orders/:orderId/workflow/:stageId/comments All comments for a stage
GET    /api/orders/:orderId/progress                   Progress % + color + order status
```

### 4.3 Notification APIs

```
GET    /api/notifications                              My notifications (auth user)
PATCH  /api/notifications/:id/read                    Mark read
GET    /api/orders/:orderId/notifications              All notifications for an order
POST   /api/notifications/send-delay-alert            Trigger delay alert (cron or manual)
```

### 4.4 Permissions Middleware

```javascript
// Attach to every workflow mutation endpoint
function requireStagePermission(action) {
  return (req, res, next) => {
    const user = req.user;
    const stage = req.stage; // preloaded by middleware

    const rules = {
      start:   () => user.department_id === stage.department_id,
      submit:  () => user.id === stage.assigned_to_user_id,
      approve: () => user.id === stage.approver_user_id || user.role.is_approver,
      reject:  () => user.id === stage.approver_user_id || user.role.is_approver,
      comment: () => user.department_id === stage.department_id || user.role.name === 'Management Approver'
    };

    if (!rules[action]?.()) {
      return res.status(403).json({ error: 'Insufficient permissions for this action.' });
    }
    next();
  };
}
```

---

## 5. FRONTEND COMPONENTS

### 5.1 Progress Slider Component

```jsx
// File: components/WorkflowProgressBar.jsx
// Props: stages[] (order_workflow_stages rows), progressPct (integer 0-100)

/*
Visual layout:
─────────────────────────────────────────────────────────────────
  [Stage dot] ── [Stage dot] ── [Stage dot] ── ... ── [Stage dot]
  ▲ Approved     ▲ In Progress  ○ Pending              ○ Pending

Below all dots: gradient fill bar from left to current position
Color: Red → Orange → Yellow → Blue → Purple → Green (per pct)

Stage dots:
  ✓ Green fill  = approved
  ● Blue pulse  = in_progress
  ✕ Red fill    = rejected
  ○ Grey        = pending
  – Light grey  = skipped
*/
```

**Required behaviors:**
- Hover on any dot → tooltip shows: Stage Name, Department, Status, Approver, Planned Date
- Click on approved stage → opens read-only stage detail drawer
- Click on current in_progress stage → opens action drawer (submit/comment)
- Future stages → cursor: not-allowed, no click
- Below the bar: show `{approved_count} of {total_stages} stages approved | {progress_pct}% complete`

### 5.2 Stage Action Drawer / Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Stage: Inline Inspection               [Department: Quality]│
│  Assigned To: [Name]   Approver: [Name]                     │
│  Planned: 12 Jan → 14 Jan    Actual: 13 Jan → ?             │
├─────────────────────────────────────────────────────────────┤
│  TASKS                                                       │
│  ☑ Workmanship check                                        │
│  ☑ Measurement check                                        │
│  ☐ Defect tagging                                           │
├─────────────────────────────────────────────────────────────┤
│  COMMENTS / FEEDBACK / CHALLENGES                            │
│  [All previous comments shown with type badge + timestamp]   │
│                                                              │
│  Add Comment:  [Type ▼]  [Text area — min chars enforced]   │
│  Types: Submission Note | Challenge | Feedback | Delay Reason│
├─────────────────────────────────────────────────────────────┤
│  [Submit for Approval]  [Add Challenge]       [Close]        │
│  — Approver sees: [Approve ✓]  [Reject ✗]                   │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Order Status Badge (top of every order page)

```jsx
// Driven by orders.current_status
// Shows: status label + color + progress % + days to ship date
// e.g.:  🟡 In Production  |  54% complete  |  ⚠ 12 days to ship
// If delayed: 🔴 DELAYED — 3 days behind schedule
```

### 5.4 Workflow Timeline Page (per order)

- Full vertical timeline of all 26 stages
- Each stage card shows: department badge, assignee avatar, approver, dates, status chip, comment count
- Filter by: Department / Status / Date range
- Export to PDF button (inspection summary report)

---

## 6. DELAY DETECTION & NOTIFICATION SYSTEM

### 6.1 Delay Detection (Cron Job — run daily)

```javascript
// File: jobs/delayDetectionJob.js
async function runDelayCheck() {
  const today = new Date();

  // Find all in_progress or pending stages past their planned_end_date
  const delayedStages = await db.query(`
    SELECT ows.*, o.target_ship_date, o.brand_contact_email, o.brand_contact_name,
           o.order_number, u.email as assignee_email, u.name as assignee_name
    FROM order_workflow_stages ows
    JOIN orders o ON ows.order_id = o.id
    JOIN users u ON ows.assigned_to_user_id = u.id
    WHERE ows.status IN ('pending', 'in_progress')
      AND ows.planned_end_date < $1
      AND ows.is_delayed = FALSE
  `, [today]);

  for (const stage of delayedStages) {
    const delayDays = Math.ceil((today - stage.planned_end_date) / 86400000);

    // Update delay flag
    await db.query(
      'UPDATE order_workflow_stages SET is_delayed=TRUE, delay_days=$1 WHERE id=$2',
      [delayDays, stage.id]
    );

    // Update order status
    await db.query(
      "UPDATE orders SET current_status='delayed' WHERE id=$1",
      [stage.order_id]
    );

    // Queue notifications
    await queueNotification({
      order_id: stage.order_id,
      stage_id: stage.id,
      notification_type: 'delay_alert',
      recipients: [
        { email: stage.assignee_email, name: stage.assignee_name, type: 'internal' },
        { email: stage.brand_contact_email, name: stage.brand_contact_name, type: 'external' }
      ],
      subject: `⚠ Delay Alert: ${stage.stage_name} — Order ${stage.order_number}`,
      message: `Stage "${stage.stage_name}" is ${delayDays} day(s) overdue for Order ${stage.order_number}. 
                Target Ship Date: ${stage.target_ship_date}. Immediate action required.`
    });
  }
}
```

### 6.2 Notification Triggers Summary

| Event                        | Who Gets Notified                              | Channel         |
|------------------------------|------------------------------------------------|-----------------|
| Stage submitted for approval | Assigned Approver + Department Head            | Email + In-app  |
| Stage approved               | Next stage assignee + Merchandiser             | Email + In-app  |
| Stage rejected               | Submitting user + their Department Head        | Email + In-app  |
| Stage delayed (cron)         | Assignee + Department Head + Brand Contact     | Email + In-app  |
| Final inspection failed      | QC Manager + Production Manager + Merchandiser | Email + In-app  |
| Order completed              | Brand Contact + MD / Management Approver       | Email + In-app  |
| Approval pending > 48 hrs    | Approver + Management                          | Email reminder  |

---

## 7. PERMISSIONS & ROLES MATRIX

| Role                  | Start Stage | Submit Stage | Approve | Reject | Add Comment | View All Orders | Manage Templates |
|-----------------------|-------------|--------------|---------|--------|-------------|-----------------|------------------|
| Department Member     | ✓ (own dept)| ✓ (assigned) | ✗       | ✗      | ✓ (own)     | ✗               | ✗                |
| Department Head       | ✓           | ✓            | ✓       | ✓      | ✓           | Own dept        | ✗                |
| QC Inspector          | ✓           | ✓            | ✗       | ✗      | ✓           | QC stages only  | ✗                |
| QC Manager            | ✓           | ✓            | ✓       | ✓      | ✓           | All QC orders   | ✗                |
| Merchandiser          | ✗           | ✗            | ✗       | ✗      | ✓ (all)     | Assigned orders | ✗                |
| Management Approver   | ✗           | ✗            | ✓ (final)| ✓     | ✓ (all)     | All             | ✗                |
| Admin / MD            | ✓           | ✓            | ✓       | ✓      | ✓           | All             | ✓                |

---

## 8. BUILD EXECUTION ORDER (for Claude Code)

Execute in this strict sequence. Do not move to next step without testing current step.

```
STEP 1 — Database
  1a. Run migrations for all tables in Section 1
  1b. Seed departments, roles, product_categories
  1c. Seed workflow_templates (26 stages) + workflow_template_tasks
  1d. Verify foreign keys + indexes

STEP 2 — Workflow Initialization Service
  2a. Build initializeOrderWorkflow(orderId, productCategoryId)
      → Creates 26 order_workflow_stages rows from template
      → Sets sequence, planned dates (auto-calculated from typical_duration_days)
      → Sets first stage to 'in_progress', all others 'pending'
  2b. Unit test: create test order → verify 26 stage rows created correctly

STEP 3 — Gate Logic Service
  3a. Build canAdvanceToStage(orderId, targetSeq) → boolean
  3b. Build submitStage(stageId, userId, commentText)
      → Validates comment presence and length
      → Sets status = 'submitted'
      → Queues notification to approver
  3c. Build approveStage(stageId, approverId, commentText)
      → Validates approver permission
      → Sets status = 'approved', actual_end_date = NOW()
      → Unlocks next stage (sets to 'in_progress')
      → Recalculates order progress %
      → Queues notification to next assignee
  3d. Build rejectStage(stageId, approverId, rejectionReason)
      → Sets current = 'rejected'
      → Resets to on_fail_go_to_seq stage = 'in_progress'
      → Resets all intermediate stages = 'pending'
      → Recalculates progress %
      → Queues notifications

STEP 4 — Comment Service
  4a. Build addComment(stageId, userId, type, text) with validation
  4b. Build getStageComments(stageId) with user details joined
  4c. Ensure comment_type enum is enforced server-side

STEP 5 — Progress & Status Service
  5a. Build calculateOrderProgress(orderId) → { pct, color, status_label }
  5b. Build syncOrderStatus(orderId) → updates orders.current_status
  5c. Hook both into approveStage and rejectStage

STEP 6 — API Layer
  6a. Build all endpoints from Section 4
  6b. Attach requireStagePermission middleware
  6c. Validate all inputs (express-validator or zod)
  6d. Return consistent error format: { error, field?, code }
  6e. Test all endpoints with Postman / REST client

STEP 7 — Delay Detection Job
  7a. Build delayDetectionJob.js (Section 6.1)
  7b. Integrate with node-cron (run at 08:00 daily)
  7c. Build notification queue + email sender (nodemailer or SendGrid)
  7d. Test: manually set a planned_end_date to yesterday → verify alert fires

STEP 8 — Frontend: Progress Bar
  8a. Build WorkflowProgressBar component
  8b. Implement color gradient per Section 3.2
  8c. Implement stage dots with status icons
  8d. Implement hover tooltips
  8e. Connect to GET /api/orders/:orderId/progress

STEP 9 — Frontend: Stage Action Drawer
  9a. Build StageDrawer component (Section 5.2)
  9b. Task checklist sub-component
  9c. Comment thread sub-component with type badges
  9d. Submit / Approve / Reject buttons with permission guards
  9e. Mandatory comment validation (disable button until min chars met)

STEP 10 — Frontend: Order Status Badge
  10a. Build OrderStatusBadge component
  10b. Show: status, color, %, days-to-ship, delay warning
  10c. Place at top of every order detail page

STEP 11 — Frontend: Workflow Timeline Page
  11a. Full vertical timeline (all stages)
  11b. Stage cards with all metadata
  11c. Filter panel
  11d. PDF export of workflow summary

STEP 12 — Integration & End-to-End Test
  12a. Create a full test order (Garment)
  12b. Walk through all 26 stages: start → submit → approve × 26
  12c. Test rejection path: reject stage 19 → verify stages 17,18,19 reset
  12d. Test delay detection: set past date → run job → verify email + status
  12e. Test permission blocks: wrong-role user tries to approve → 403
  12f. Verify order status transitions match Section 3.3 table exactly

STEP 13 — Production Readiness
  13a. Add database transactions to approveStage / rejectStage (atomic updates)
  13b. Add rate limiting to comment endpoints
  13c. Add audit log table for all workflow mutations
  13d. Nginx config: ensure /api/workflow/* routes are proxied correctly
  13e. Final smoke test on VPS
```

---

## 9. INTEGRATION WITH EXISTING QMS ORDER MODULE

```
When workflow is initialized (Step 2):
  → Set orders.current_status = 'in_progress'
  → Set orders.overall_progress_pct = 0

After every approveStage():
  → Recalculate and update orders.overall_progress_pct
  → Sync orders.current_status via syncOrderStatus()
  → If final stage approved: set current_status = 'completed'

After every rejectStage():
  → Recalculate and update orders.overall_progress_pct
  → If delay_days > 0: set current_status = 'delayed'

Dashboard KPIs affected by workflow:
  → OQR% = (orders completed without final rejection / total orders) × 100
  → First-Pass AQL Rate = (orders where FINAL_INSPECTION approved on first submission / total)
  → On-Time Delivery Rate = (completed orders where actual_end_date ≤ target_ship_date / total)
  → Stage Cycle Time = average days between stage start and approval per stage_code
```

---

## 10. FILES TO CREATE

```
server/
  migrations/
    001_departments_roles_users.sql
    002_workflow_templates.sql
    003_orders_workflow_stages.sql
    004_stage_comments_notifications.sql
  seeds/
    departments.seed.js
    roles.seed.js
    workflow_templates.seed.js       ← All 26 stages + tasks
  services/
    workflowInitService.js
    workflowGateService.js
    commentService.js
    progressService.js
    notificationService.js
    delayDetectionJob.js
  routes/
    workflowRoutes.js
    notificationRoutes.js
  middleware/
    stagePermission.js

client/
  components/
    WorkflowProgressBar.jsx
    StageActionDrawer.jsx
    OrderStatusBadge.jsx
    StageCommentThread.jsx
    StageTaskChecklist.jsx
  pages/
    WorkflowTimelinePage.jsx
  hooks/
    useWorkflowProgress.js
    useStageActions.js
```

---

## 11. NOTES FOR CLAUDE CODE

- Always wrap `approveStage` and `rejectStage` in a **database transaction** — multiple rows change atomically
- The `on_fail_go_to_seq` column is critical — never hardcode rejection routing in the service layer
- All mandatory comment fields must be validated **server-side**, not just client-side
- External brand notifications (email) should use a queue (even a simple DB-backed queue table) — never block the HTTP response
- Progress bar must re-render in real time on the order page — use polling or WebSocket depending on current setup
- The `Management Approver` role must be involved at **Stage 26 only** unless configured otherwise — do not require them at every stage
- For Accessories category, skip-stage rows should still be created in `order_workflow_stages` with `status = 'skipped'` so sequence integrity is maintained

---

*End of Blueprint — SankalpHub.in Workflow System v1.0*
