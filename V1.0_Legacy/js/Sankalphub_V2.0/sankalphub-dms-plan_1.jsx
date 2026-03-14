import { useState } from "react";

const GOLD = "#C9A96E";
const NAVY = "#0D1420";
const GOLD_LIGHT = "#FDF8EE";
const GREEN = "#10B981";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const PURPLE = "#7C3AED";
const ORANGE = "#F59E0B";

// ── DATA ──────────────────────────────────────────────────────────────────

const fileTypes = [
  { ext: "XLSX", icon: "📊", label: "Excel", color: "#217346", bg: "#F0FDF4", use: "AQL reports, DPR, defect logs, production tracking" },
  { ext: "DOCX", icon: "📄", label: "Word Doc", color: "#1B4F8A", bg: "#EFF6FF", use: "Inspection reports, CAPA letters, SOPs, approvals" },
  { ext: "PPT", icon: "📋", label: "PowerPoint", color: "#C43E1C", bg: "#FFF7ED", use: "Audit presentations, QC reviews, brand reports" },
  { ext: "PDF", icon: "📕", label: "PDF", color: "#DC2626", bg: "#FEF2F2", use: "Signed reports, certificates, test results, invoices" },
  { ext: "IMG", icon: "🖼️", label: "Images", color: PURPLE, bg: "#F5F3FF", use: "Defect photos, fabric swatches, label checks, packing shots" },
  { ext: "ZIP", icon: "🗜️", label: "Archive", color: "#78350F", bg: "#FFFBEB", use: "Batch export of all docs for an order or audit" },
];

const roles = [
  {
    role: "SUPER ADMIN",
    icon: "👑",
    color: "#DC2626",
    upload: true, view: true, download: true, share: true, delete: true, watermark: false, expiry: false,
    note: "Full control. Can override any permission.",
  },
  {
    role: "QC MANAGER",
    icon: "🔬",
    color: PURPLE,
    upload: true, view: true, download: true, share: true, delete: false, watermark: true, expiry: false,
    note: "Can share externally but files are watermarked with their name.",
  },
  {
    role: "QC INSPECTOR",
    icon: "🔍",
    color: BLUE,
    upload: true, view: true, download: false, share: false, delete: false, watermark: true, expiry: false,
    note: "Can upload defect photos & reports. Cannot download or share — view only.",
  },
  {
    role: "FACTORY MANAGER",
    icon: "🏭",
    color: ORANGE,
    upload: true, view: true, download: true, share: false, delete: false, watermark: true, expiry: true,
    note: "Can download their own factory docs only. Links expire in 24 hrs.",
  },
  {
    role: "FACTORY QC",
    icon: "✅",
    color: "#16A34A",
    upload: true, view: true, download: false, share: false, delete: false, watermark: true, expiry: false,
    note: "Upload inline inspection photos. View only — no download.",
  },
  {
    role: "BRAND REVIEWER",
    icon: "🏷️",
    color: GOLD,
    upload: false, view: true, download: true, share: false, delete: false, watermark: true, expiry: true,
    note: "Brand gets watermarked PDFs with their logo + expiry link (48 hrs).",
  },
  {
    role: "3RD PARTY",
    icon: "🔭",
    color: "#64748B",
    upload: true, view: false, download: false, share: false, delete: false, watermark: false, expiry: false,
    note: "External auditors can ONLY upload their report. Cannot see other docs.",
  },
  {
    role: "MERCHANDISER",
    icon: "🧵",
    color: "#EC4899",
    upload: false, view: true, download: false, share: false, delete: false, watermark: false, expiry: false,
    note: "View-only access to docs within their assigned orders.",
  },
];

const privacyControls = [
  {
    title: "Scoped Access",
    icon: "🔒",
    color: BLUE,
    desc: "Every file is tagged to an Order ID, Factory ID, and Department. A factory user can NEVER see files from another factory — even if they share the same brand.",
    technical: "File model has FK to order, factory, brand. Query always filters by user's allowed factory IDs.",
  },
  {
    title: "Watermarking",
    icon: "💧",
    color: PURPLE,
    desc: "Any PDF or image downloaded by QC Manager / Brand Reviewer is automatically stamped with: User Name + Role + Timestamp + 'CONFIDENTIAL — SankalpHub'.",
    technical: "Django generates watermarked PDF on-the-fly using reportlab or weasyprint before serving the download URL.",
  },
  {
    title: "Expiring Share Links",
    icon: "⏱️",
    color: ORANGE,
    desc: "When a file is shared externally (brand, 3rd party), a signed URL is generated with 24–48 hour expiry. After that, the link is dead.",
    technical: "Use AWS S3 pre-signed URLs (boto3) with expiry. Or generate a token-based URL in Django that checks expiry before serving file.",
  },
  {
    title: "Download Audit Log",
    icon: "📋",
    color: GREEN,
    desc: "Every single download, view, share, or delete is logged: Who, What file, When, From which IP/device. Admin can see full history.",
    technical: "FileAccessLog model: user, file, action (VIEW/DOWNLOAD/SHARE/DELETE), timestamp, ip_address, user_agent.",
  },
  {
    title: "Bulk Export Controls",
    icon: "🗜️",
    color: RED,
    desc: "No user can bulk-download more than 10 files at once without Admin approval. Prevents mass data extraction.",
    technical: "Rate limit bulk downloads per user per hour. Bulk requests above threshold create a pending admin approval task.",
  },
  {
    title: "Virus Scan on Upload",
    icon: "🛡️",
    color: NAVY,
    desc: "Every uploaded file is scanned before storage. Malicious files are rejected and the upload attempt is flagged to the admin.",
    technical: "Use ClamAV (free, self-hosted) or VirusTotal API on file upload. Reject and log if infected.",
  },
];

const storageOptions = [
  {
    name: "Cloudflare R2",
    icon: "☁️",
    color: "#F6821F",
    recommended: true,
    cost: "FREE up to 10 GB · $0.015/GB after",
    pros: ["No egress fees (huge saving)", "S3-compatible API — works with boto3", "CDN built-in = fast downloads globally", "Easy to set up with Django"],
    cons: ["Newer product — less legacy docs"],
    bestFor: "Startups & new SaaS — best price-performance",
  },
  {
    name: "AWS S3",
    icon: "🟡",
    color: "#FF9900",
    recommended: false,
    cost: "~$0.023/GB + egress fees",
    pros: ["Industry standard", "Pre-signed URLs built-in", "Mature — tons of documentation"],
    cons: ["Egress costs add up fast", "More complex IAM setup"],
    bestFor: "If you're already on AWS ecosystem",
  },
  {
    name: "Your VPS (Hostinger)",
    icon: "🖥️",
    color: "#7C3AED",
    recommended: false,
    cost: "Already paying — no extra",
    pros: ["Already have it", "No external dependency"],
    cons: ["No redundancy — disk fails = data lost", "No CDN", "Disk fills up fast", "NOT suitable for production"],
    bestFor: "Development / testing only",
  },
];

const djangoModels = `# models.py — Document Management

class Document(models.Model):
    # Core identity
    id = models.UUIDField(default=uuid.uuid4)
    name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)  # xlsx, pdf, docx...
    file_size = models.BigIntegerField()  # bytes
    storage_key = models.CharField(max_length=500)  # S3/R2 key
    
    # Scope — every file locked to these
    order = models.ForeignKey(Order, null=True)
    factory = models.ForeignKey(Factory, null=True)
    department = models.CharField(max_length=50)
    uploaded_by = models.ForeignKey(User)
    
    # Access control
    visibility = models.CharField(choices=[
        ('PRIVATE', 'Only uploader'),
        ('TEAM',    'Same org'),
        ('BRAND',   'Brand can see'),
        ('SHARED',  'Via link'),
    ])
    
    # Watermark
    is_watermarked = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)  # soft delete only

class DocumentAccessLog(models.Model):
    document = models.ForeignKey(Document)
    user = models.ForeignKey(User, null=True)  # null if link-based
    action = models.CharField(choices=[
        ('VIEW', 'Viewed'),
        ('DOWNLOAD', 'Downloaded'),
        ('SHARE', 'Shared link created'),
        ('DELETE', 'Deleted'),
        ('UPLOAD', 'Uploaded'),
    ])
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()

class ShareLink(models.Model):
    document = models.ForeignKey(Document)
    token = models.UUIDField(default=uuid.uuid4)
    created_by = models.ForeignKey(User)
    expires_at = models.DateTimeField()
    recipient_email = models.EmailField(null=True)
    is_revoked = models.BooleanField(default=False)
    access_count = models.IntegerField(default=0)
    max_access = models.IntegerField(default=3)  # revoke after 3 opens`;

const apiEndpoints = [
  { method: "POST", path: "/api/documents/upload/", desc: "Upload file — checks role permission, virus scan, then stores to R2", auth: "All roles (per permission)" },
  { method: "GET", path: "/api/documents/?order={id}", desc: "List docs for an order — filtered by caller's role & factory scope", auth: "Scoped" },
  { method: "GET", path: "/api/documents/{id}/download/", desc: "Returns pre-signed R2 URL (expires 15 min) — logs access", auth: "Download permission only" },
  { method: "POST", path: "/api/documents/{id}/share/", desc: "Creates ShareLink with expiry — sends email with link", auth: "QC Manager, Admin" },
  { method: "GET", path: "/api/share/{token}/", desc: "Public endpoint — validates token, checks expiry, serves file", auth: "Token-based, no login" },
  { method: "GET", path: "/api/documents/{id}/audit/", desc: "Full access log for a document — who viewed/downloaded/when", auth: "Admin, QC Manager" },
  { method: "DELETE", path: "/api/documents/{id}/", desc: "Soft delete only — file stays in R2 for 90 days recovery", auth: "Admin only" },
  { method: "POST", path: "/api/documents/bulk-export/", desc: "Creates ZIP of multiple files — requires Admin approval if >10 files", auth: "Admin approval needed" },
];

const wrongUseProtections = [
  { threat: "Factory sees another factory's docs", protection: "All queries enforce factory_id filter based on logged-in user's factory assignment. Cross-factory access = 403.", severity: "CRITICAL" },
  { threat: "Inspector bulk-downloads all QC photos", protection: "Download permission disabled for Inspector role. Even if they hack the URL, they get 403.", severity: "HIGH" },
  { threat: "Expired share link still opens", protection: "Token endpoint checks expires_at on every request. Expired = 410 Gone response.", severity: "HIGH" },
  { threat: "Someone screenshots & leaks watermarked PDF", protection: "Watermark has user name + timestamp + IP. You know exactly who leaked it.", severity: "MEDIUM" },
  { threat: "Factory manager deletes inspection evidence", protection: "Soft delete only — file stays recoverable for 90 days. Delete is admin-only anyway.", severity: "HIGH" },
  { threat: "Malware uploaded as a .docx file", protection: "ClamAV scans every upload. Infected files rejected before storage.", severity: "HIGH" },
  { threat: "Brand downloads competitor's factory reports", protection: "Brands are scoped to their own brand_id. They literally cannot query another brand's data.", severity: "CRITICAL" },
  { threat: "Share link forwarded to 100 people", protection: "max_access limit (default 3 opens). After that, link auto-revokes.", severity: "MEDIUM" },
];

const departmentDocs = [
  { dept: "Design", docs: ["Tech pack PDF", "Sketch images", "Color card scan"], icon: "🎨" },
  { dept: "Sampling", docs: ["Sample approval form PDF", "Measurement sheet XLSX", "Sample photos"], icon: "✂️" },
  { dept: "Costing", docs: ["Cost sheet XLSX", "BOM Excel", "Price approval PDF"], icon: "💰" },
  { dept: "Production", docs: ["DPR Excel", "Line balancing sheet", "Production photos"], icon: "⚙️" },
  { dept: "Quality", docs: ["Inspection report PDF", "AQL result XLSX", "Defect photos", "CAPA doc"], icon: "🔬" },
  { dept: "Packing", docs: ["Packing list XLSX", "Carton label images", "Packing photos"], icon: "📦" },
  { dept: "Lab Testing", docs: ["Test certificate PDF", "Lab report PDF", "Compliance docs"], icon: "🧪" },
  { dept: "Logistics", docs: ["Shipping docs PDF", "BL / AWB copy", "Invoice XLSX"], icon: "🚢" },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────

export default function DocManagementPlan() {
  const [tab, setTab] = useState("overview");
  const [selectedRole, setSelectedRole] = useState(0);
  const [selectedPrivacy, setSelectedPrivacy] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);
  const [showCode, setShowCode] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: "🗂️" },
    { id: "permissions", label: "Permissions", icon: "🔐" },
    { id: "privacy", label: "Privacy", icon: "🛡️" },
    { id: "storage", label: "Storage", icon: "☁️" },
    { id: "threats", label: "Threat Guard", icon: "⚠️" },
    { id: "depts", label: "By Dept", icon: "🏢" },
    { id: "api", label: "API Plan", icon: "⚡" },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F7F8FA", minHeight: "100vh", paddingBottom: 60 }}>

      {/* ── HEADER ── */}
      <div style={{ background: NAVY, padding: "28px 18px 20px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.3)", borderRadius: 8, padding: "3px 12px", marginBottom: 12 }}>
          <span style={{ fontSize: 12 }}>📁</span>
          <span style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>SankalpHub · DMS</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 5px", lineHeight: 1.3 }}>
          Document Management<br />System — Master Plan
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "0 0 18px" }}>
          Excel · Docs · PDF · PPT · Images · Privacy · Permissions · Audit
        </p>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "6", l: "File types" },
            { v: "8", l: "Role levels" },
            { v: "6", l: "Privacy controls" },
            { v: "8", l: "Threat guards" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: GOLD, margin: 0, lineHeight: 1 }}>{s.v}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ display: "flex", overflowX: "auto", background: "#fff", borderBottom: "1px solid #EBEBEB", position: "sticky", top: 0, zIndex: 40 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flexShrink: 0, height: 44, padding: "0 14px", border: "none", cursor: "pointer", background: "transparent",
            fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", position: "relative",
            color: tab === t.id ? GOLD : "#999",
          }}>
            {t.icon} {t.label}
            {tab === t.id && <span style={{ position: "absolute", bottom: 0, left: 8, right: 8, height: 2, background: GOLD, borderRadius: "2px 2px 0 0" }} />}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px" }}>

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <div>
            {/* What files */}
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Supported File Types</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {fileTypes.map((f, i) => (
                <div key={i} style={{ background: f.bg, borderRadius: 12, padding: "12px", border: `1px solid ${f.color}22` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>{f.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: f.color }}>.{f.ext}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.4 }}>{f.use}</p>
                </div>
              ))}
            </div>

            {/* Architecture Overview */}
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>System Architecture</p>
            <div style={{ background: NAVY, borderRadius: 14, padding: "16px", marginBottom: 16 }}>
              {[
                { step: "1", label: "User uploads file", detail: "From mobile/desktop browser — any department", icon: "📤", color: BLUE },
                { step: "2", label: "Permission check", detail: "Can this role upload this file type in this dept?", icon: "🔐", color: PURPLE },
                { step: "3", label: "Virus scan", detail: "ClamAV scans file before touching storage", icon: "🛡️", color: GREEN },
                { step: "4", label: "Store to Cloudflare R2", detail: "File saved with UUID key + metadata in DB", icon: "☁️", color: ORANGE },
                { step: "5", label: "Access log created", detail: "Upload event logged with user, time, IP", icon: "📋", color: GOLD },
                { step: "6", label: "Download / Share", detail: "Pre-signed URL (15 min) or expiring share link", icon: "🔗", color: RED },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: i < 5 ? 12 : 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{s.label}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "2px 0 0" }}>{s.detail}</p>
                  </div>
                  {i < 5 && <div style={{ position: "absolute", left: 28, width: 2, height: 12, background: "rgba(255,255,255,0.1)" }} />}
                </div>
              ))}
            </div>

            {/* 3 Golden Rules */}
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>3 Golden Rules</p>
            {[
              { n: "1", rule: "Every file has a scope", detail: "Locked to Order + Factory + Department. No orphan files.", color: BLUE },
              { n: "2", rule: "No permanent deletes", detail: "Soft delete only. Files recoverable for 90 days. Evidence can never be destroyed.", color: RED },
              { n: "3", rule: "Every action is logged", detail: "View, download, share, delete — all recorded with user + timestamp + IP.", color: GREEN },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 12, padding: "13px", marginBottom: 8, border: "1px solid #EBEBEB" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: r.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{r.n}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: "0 0 2px" }}>{r.rule}</p>
                  <p style={{ fontSize: 11, color: "#777", margin: 0 }}>{r.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ PERMISSIONS ══ */}
        {tab === "permissions" && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Permission Matrix — Select a Role</p>

            {/* Role selector */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {roles.map((r, i) => (
                <button key={i} onClick={() => setSelectedRole(i)} style={{
                  padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: selectedRole === i ? r.color : "#fff",
                  color: selectedRole === i ? "#fff" : "#666",
                  border: selectedRole === i ? "none" : "1px solid #E5E5E5",
                }}>
                  {r.icon} {r.role}
                </button>
              ))}
            </div>

            {/* Selected role detail */}
            {(() => {
              const r = roles[selectedRole];
              const perms = [
                { label: "Upload", key: "upload", yesColor: GREEN, noColor: "#DDD" },
                { label: "View", key: "view", yesColor: BLUE, noColor: "#DDD" },
                { label: "Download", key: "download", yesColor: PURPLE, noColor: "#DDD" },
                { label: "Share", key: "share", yesColor: ORANGE, noColor: "#DDD" },
                { label: "Delete", key: "delete", yesColor: RED, noColor: "#DDD" },
                { label: "Watermark Applied", key: "watermark", yesColor: "#EC4899", noColor: "#DDD" },
                { label: "Links Expire", key: "expiry", yesColor: "#14B8A6", noColor: "#DDD" },
              ];
              return (
                <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #EBEBEB" }}>
                  <div style={{ background: r.color, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 28 }}>{r.icon}</span>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>{r.role}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "2px 0 0" }}>{r.note}</p>
                      </div>
                    </div>
                  </div>
                  {perms.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: i < perms.length - 1 ? "1px solid #F8F8F8" : "none" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#444" }}>{p.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: r[p.key] ? p.yesColor : "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                          {r[p.key] ? "✓" : "✗"}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: r[p.key] ? p.yesColor : "#CCC" }}>
                          {r[p.key] ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Full matrix table */}
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "16px 0 10px" }}>Full Permission Matrix</p>
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #EBEBEB" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", background: NAVY, padding: "8px 12px", gap: 4 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>ROLE</span>
                {["UP", "VIEW", "DL", "SHARE", "DEL"].map(h => (
                  <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, textAlign: "center" }}>{h}</span>
                ))}
              </div>
              {roles.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 12px", gap: 4, borderBottom: i < roles.length - 1 ? "1px solid #F8F8F8" : "none", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{r.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>{r.role.split(" ")[0]}</span>
                  </div>
                  {[r.upload, r.view, r.download, r.share, r.delete].map((val, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "center" }}>
                      <span style={{ fontSize: 14, color: val ? GREEN : "#DDD" }}>{val ? "✓" : "✗"}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ PRIVACY ══ */}
        {tab === "privacy" && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>6 Privacy Control Layers</p>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 12 }}>
              {privacyControls.map((p, i) => (
                <button key={i} onClick={() => setSelectedPrivacy(i)} style={{
                  flexShrink: 0, padding: "7px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: selectedPrivacy === i ? p.color : "#fff",
                  color: selectedPrivacy === i ? "#fff" : "#666",
                  fontSize: 11, fontWeight: 600,
                  border: selectedPrivacy === i ? "none" : "1px solid #E5E5E5",
                }}>
                  {p.icon} {p.title}
                </button>
              ))}
            </div>

            {(() => {
              const p = privacyControls[selectedPrivacy];
              return (
                <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #EBEBEB", marginBottom: 14 }}>
                  <div style={{ background: p.color, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 28 }}>{p.icon}</span>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>{p.title}</p>
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: 13, color: "#444", lineHeight: 1.65, margin: "0 0 14px" }}>{p.desc}</p>
                    <div style={{ background: "#F8F8F8", borderRadius: 10, padding: "12px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>Technical Implementation</p>
                      <p style={{ fontSize: 12, color: "#555", margin: 0, fontFamily: "monospace", lineHeight: 1.6 }}>{p.technical}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Watermark preview */}
            <div style={{ background: NAVY, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Watermark Preview</p>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "16px", border: "1px dashed rgba(255,255,255,0.15)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-35deg)", fontSize: 13, fontWeight: 800, color: "rgba(201,169,110,0.18)", whiteSpace: "nowrap", letterSpacing: 2, textTransform: "uppercase", pointerEvents: "none", zIndex: 1 }}>
                  CONFIDENTIAL — SANKALPHUB
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "0 0 4px", fontFamily: "monospace" }}>QC Inspection Report — Order PO_TSHIRT_001</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "0 0 4px", fontFamily: "monospace" }}>Downloaded by: Naveen Sharma (QC MANAGER)</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "0 0 4px", fontFamily: "monospace" }}>Timestamp: 09 Mar 2026 · 14:32:05 IST</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0, fontFamily: "monospace" }}>IP: 103.xx.xx.xx · Powered by SankalpHub.in</p>
              </div>
            </div>

            {/* Share link flow */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px", border: "1px solid #EBEBEB" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: "0 0 12px" }}>🔗 Expiring Share Link Flow</p>
              {[
                { step: "QC Manager clicks 'Share'", detail: "Selects recipient email + expiry (24 or 48 hrs)" },
                { step: "System generates token URL", detail: "sankalphub.in/share/abc123xyz — unique, one-time" },
                { step: "Email sent to recipient", detail: "With link + expiry warning + 'Do not forward'" },
                { step: "Recipient opens link", detail: "System checks: not expired? not revoked? access count < max?" },
                { step: "File served — watermarked", detail: "PDF stamp with recipient email + timestamp applied on-the-fly" },
                { step: "Access logged + counter incremented", detail: "After 3 opens or expiry — link goes dead automatically" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: BLUE, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: NAVY, margin: 0 }}>{s.step}</p>
                    <p style={{ fontSize: 11, color: "#888", margin: "1px 0 0" }}>{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ STORAGE ══ */}
        {tab === "storage" && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Storage Options</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {storageOptions.map((s, i) => (
                <button key={i} onClick={() => setSelectedStorage(i)} style={{
                  flex: 1, padding: "8px 6px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: selectedStorage === i ? NAVY : "#fff",
                  color: selectedStorage === i ? GOLD : "#666",
                  fontSize: 11, fontWeight: 600,
                  border: selectedStorage === i ? "none" : "1px solid #E5E5E5",
                }}>
                  {s.icon}<br />{s.name}
                  {s.recommended && <span style={{ display: "block", fontSize: 9, color: GREEN, marginTop: 2 }}>★ BEST</span>}
                </button>
              ))}
            </div>

            {(() => {
              const s = storageOptions[selectedStorage];
              return (
                <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #EBEBEB", marginBottom: 14 }}>
                  <div style={{ background: s.color, padding: "14px 16px" }}>
                    <div style={{ display: "flex", items: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 28 }}>{s.icon}</span>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>{s.name}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "2px 0 0" }}>{s.cost}</p>
                        </div>
                      </div>
                      {s.recommended && <span style={{ background: GREEN, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10 }}>RECOMMENDED</span>}
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>✓ Pros</p>
                    {s.pros.map((p, i) => <p key={i} style={{ fontSize: 12, color: "#444", margin: "0 0 5px", paddingLeft: 12, borderLeft: `3px solid ${GREEN}` }}>{p}</p>)}
                    <p style={{ fontSize: 11, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 1, margin: "12px 0 6px" }}>✗ Cons</p>
                    {s.cons.map((c, i) => <p key={i} style={{ fontSize: 12, color: "#444", margin: "0 0 5px", paddingLeft: 12, borderLeft: `3px solid ${RED}` }}>{c}</p>)}
                    <div style={{ marginTop: 12, background: "#F8F8F8", borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ fontSize: 12, color: "#555", margin: 0 }}>💡 Best for: <strong>{s.bestFor}</strong></p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* File size limits */}
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Recommended File Size Limits</p>
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #EBEBEB" }}>
              {[
                { type: "Images (JPG/PNG)", limit: "10 MB max", reason: "Defect photos don't need to be full RAW", color: PURPLE },
                { type: "Excel / XLSX", limit: "5 MB max", reason: "QC data sheets are rarely larger than 1 MB", color: "#217346" },
                { type: "PDF Reports", limit: "25 MB max", reason: "Lab certs can be multi-page with images", color: RED },
                { type: "Word / DOCX", limit: "10 MB max", reason: "Text documents with embedded images", color: BLUE },
                { type: "PowerPoint", limit: "25 MB max", reason: "Presentations with photos and charts", color: "#C43E1C" },
                { type: "ZIP Archives", limit: "100 MB max", reason: "Batch of multiple files for handover", color: "#78350F" },
              ].map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: i < 5 ? "1px solid #F8F8F8" : "none" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: "0 0 2px" }}>{l.type}</p>
                    <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{l.reason}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: l.color, background: l.color + "15", padding: "4px 10px", borderRadius: 8 }}>{l.limit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ THREAT GUARD ══ */}
        {tab === "threats" && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>8 Threat Protection Guards</p>
            {wrongUseProtections.map((t, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px", marginBottom: 8, border: "1px solid #EBEBEB" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, flex: 1 }}>🚨 {t.threat}</p>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", padding: "2px 8px", borderRadius: 10, flexShrink: 0,
                    background: t.severity === "CRITICAL" ? RED : t.severity === "HIGH" ? ORANGE : "#6366F1"
                  }}>{t.severity}</span>
                </div>
                <p style={{ fontSize: 12, color: "#444", margin: 0, paddingLeft: 12, borderLeft: `3px solid ${GREEN}`, lineHeight: 1.5 }}>
                  ✅ {t.protection}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ══ BY DEPT ══ */}
        {tab === "depts" && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Documents by Department</p>
            {departmentDocs.map((d, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, marginBottom: 8, overflow: "hidden", border: "1px solid #EBEBEB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: "1px solid #F5F5F5", background: GOLD_LIGHT }}>
                  <span style={{ fontSize: 20 }}>{d.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{d.dept}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: GOLD, background: "#FFF0CC", padding: "2px 8px", borderRadius: 10 }}>
                    {d.docs.length} doc types
                  </span>
                </div>
                {d.docs.map((doc, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: j < d.docs.length - 1 ? "1px solid #F8F8F8" : "none" }}>
                    <span style={{ fontSize: 14 }}>
                      {doc.includes("XLSX") || doc.includes("Excel") ? "📊" :
                       doc.includes("PDF") || doc.includes("certificate") || doc.includes("report") || doc.includes("Invoice") ? "📕" :
                       doc.includes("photo") || doc.includes("images") || doc.includes("shots") || doc.includes("scan") ? "🖼️" :
                       doc.includes("doc") || doc.includes("letter") || doc.includes("SOP") ? "📄" : "📋"}
                    </span>
                    <span style={{ fontSize: 13, color: "#444" }}>{doc}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ══ API ══ */}
        {tab === "api" && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>API Endpoints Plan</p>

            {apiEndpoints.map((ep, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "12px", marginBottom: 8, border: "1px solid #EBEBEB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", padding: "2px 8px", borderRadius: 6, background: ep.method === "GET" ? BLUE : ep.method === "POST" ? GREEN : RED }}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: 11, color: PURPLE, fontFamily: "monospace" }}>{ep.path}</code>
                </div>
                <p style={{ fontSize: 12, color: "#555", margin: "0 0 4px" }}>{ep.desc}</p>
                <span style={{ fontSize: 10, color: GOLD, fontWeight: 600 }}>Auth: {ep.auth}</span>
              </div>
            ))}

            {/* Django models */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>Django Models</p>
                <button onClick={() => setShowCode(!showCode)} style={{ fontSize: 11, fontWeight: 600, color: GOLD, background: GOLD_LIGHT, border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
                  {showCode ? "Hide" : "Show"} Code
                </button>
              </div>
              {showCode && (
                <div style={{ background: NAVY, borderRadius: 12, padding: "14px", overflow: "auto" }}>
                  <pre style={{ fontSize: 10, color: "#A5D6A7", margin: 0, lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre" }}>
                    {djangoModels}
                  </pre>
                </div>
              )}
            </div>

            {/* Claude Code prompt hint */}
            <div style={{ marginTop: 14, background: NAVY, borderRadius: 14, padding: "16px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 8px" }}>Next Step</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Ready for Claude Code Implementation</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 12px", lineHeight: 1.6 }}>
                This plan is ready to be converted into a full Claude Code prompt covering: Django models, DRF serializers, R2 integration, permission decorators, watermarking, share links, and the React file upload/preview UI.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["Django models + migrations", "DRF serializers + views", "Cloudflare R2 integration", "Watermark PDF generation", "Share link system", "React upload component"].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: GREEN, fontSize: 12 }}>✓</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
