export interface ProjectTeamMember {
  memberId: string;
  role: string;
}

export interface ProjectFile {
  title: string;
  type: string;
  updatedAt: string;
}

export interface ProjectExampleTask {
  title: string;
  description: string;
  assigneeRole: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "inprogress" | "completed";
  dueLabel: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  objective: string;
  summary: string;
  users: string;
  scope: string[];
  firstSteps: string[];
  exampleTasks: ProjectExampleTask[];
  expectedOutput: string;
  startDate: string;
  deadline: string;
  status: "Planning" | "Active" | "At Risk" | "Completed";
  ownerId: string;
  progress: number;
  team: ProjectTeamMember[];
  files: ProjectFile[];
}

export const PROJECTS: ProjectRecord[] = [
  {
    id: "72ipo",
    name: "72ipo",
    description: "A website where users can view IPO information, updates, and related landing pages.",
    objective: "Help the team publish IPO details quickly and help users understand those details clearly.",
    summary: "72ipo is a project used to show IPO-related information in one place. It helps the internal team manage content like IPO pages, updates, and campaign sections, and it helps users read that information easily. If you work on this project, you may update page content, improve layouts, connect API data, or fix issues in the dashboard and landing pages.",
    users: "Used by internal content/marketing teams to publish IPO updates and by external visitors to read IPO information and offers.",
    scope: ["IPO landing pages", "Investor updates", "Content publishing", "Dashboard widgets", "Campaign pages"],
    firstSteps: [
      "Open the project tasks and identify the ticket assigned to you.",
      "Review the design and API documentation before changing UI or content logic.",
      "Confirm page owner or reviewer before moving work to completed.",
    ],
    exampleTasks: [
      {
        title: "Update IPO landing page hero",
        description: "Refresh campaign headline, CTA, and offer copy for the latest IPO release.",
        assigneeRole: "Frontend Developer",
        priority: "high",
        status: "inprogress",
        dueLabel: "Apr 4, 2026",
      },
      {
        title: "Fix mobile layout in investor updates",
        description: "Resolve spacing and overflow issues on card sections for small screens.",
        assigneeRole: "Frontend Developer",
        priority: "medium",
        status: "todo",
        dueLabel: "Apr 7, 2026",
      },
      {
        title: "Connect new API fields to dashboard cards",
        description: "Map latest backend response fields into summary widgets and validate data states.",
        assigneeRole: "Backend Developer",
        priority: "high",
        status: "completed",
        dueLabel: "Mar 28, 2026",
      },
    ],
    expectedOutput: "Your work should keep the IPO content accurate, easy to publish, and visually consistent across landing pages and dashboards.",
    startDate: "2025-07-10",
    deadline: "2026-04-15",
    status: "Active",
    ownerId: "1",
    progress: 68,
    team: [
      { memberId: "1", role: "Project Manager" },
      { memberId: "2", role: "Frontend Developer" },
      { memberId: "3", role: "Backend Developer" },
      { memberId: "4", role: "Designer" },
    ],
    files: [
      { title: "Project Requirements", type: "PDF", updatedAt: "2026-02-18" },
      { title: "Design Files", type: "Figma", updatedAt: "2026-03-01" },
      { title: "API Documentation", type: "Docs", updatedAt: "2026-03-05" },
    ],
  },
  {
    id: "monashee-insights",
    name: "Monashee Insights",
    description: "Insight and analytics portal for dashboards, reports, and executive views.",
    objective: "Give leadership and operations teams reliable decision-making dashboards with consistent reporting.",
    summary: "Monashee Insights helps stakeholders understand business performance quickly. The team is focused on accurate metrics, faster reporting, and a dashboard experience that reduces manual effort.",
    users: "Used by management and operations teams to read KPI dashboards, reports, and performance summaries.",
    scope: ["KPI dashboards", "Filters", "Charts", "Report views", "Data summaries"],
    firstSteps: [
      "Read KPI definitions before touching charts or report labels.",
      "Verify the API/data contract if a number looks incorrect.",
      "Check with the owner before updating executive-facing metrics.",
    ],
    exampleTasks: [
      {
        title: "Add KPI card to leadership dashboard",
        description: "Introduce a new monthly performance card with tooltip and drill-down link.",
        assigneeRole: "Frontend Developer",
        priority: "high",
        status: "inprogress",
        dueLabel: "Apr 8, 2026",
      },
      {
        title: "Improve chart filter behavior",
        description: "Make date range filters sync correctly across charts and summary tables.",
        assigneeRole: "Data Engineer",
        priority: "medium",
        status: "todo",
        dueLabel: "Apr 10, 2026",
      },
      {
        title: "Fix report table mismatch",
        description: "Resolve inconsistent values between the exported report and on-screen chart totals.",
        assigneeRole: "Project Manager",
        priority: "high",
        status: "completed",
        dueLabel: "Mar 30, 2026",
      },
    ],
    expectedOutput: "Changes must keep metrics accurate, readable, and consistent across all reporting screens.",
    startDate: "2025-09-01",
    deadline: "2026-05-20",
    status: "Active",
    ownerId: "2",
    progress: 54,
    team: [
      { memberId: "2", role: "Project Manager" },
      { memberId: "3", role: "Data Engineer" },
      { memberId: "5", role: "Frontend Developer" },
    ],
    files: [
      { title: "Requirements Matrix", type: "Sheet", updatedAt: "2026-02-11" },
      { title: "Dashboard Wireframes", type: "Figma", updatedAt: "2026-02-25" },
      { title: "KPI Definitions", type: "Docs", updatedAt: "2026-03-03" },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Lead capture and property showcase platform for listings, forms, and campaign pages.",
    objective: "Increase quality lead generation while keeping listing updates and campaign publishing easy for the internal team.",
    summary: "The Real Estate project supports listing visibility, lead capture, and campaign execution. The team is trying to keep the experience conversion-friendly while making operations easier for content and sales teams.",
    users: "Used by visitors exploring properties and by internal teams managing listings, campaigns, and lead flow.",
    scope: ["Property listings", "Lead forms", "Campaign pages", "CRM sync", "Content updates"],
    firstSteps: [
      "Understand the lead form flow and where inquiries are stored.",
      "Review property card/listing structure before editing templates.",
      "Validate content changes with the project owner before publish.",
    ],
    exampleTasks: [
      {
        title: "Add featured properties section",
        description: "Create a homepage section highlighting selected listings with strong CTA placement.",
        assigneeRole: "Frontend Developer",
        priority: "medium",
        status: "inprogress",
        dueLabel: "Apr 6, 2026",
      },
      {
        title: "Fix inquiry form validation",
        description: "Correct validation rules and error messaging in the lead capture flow.",
        assigneeRole: "CRM Integrations",
        priority: "high",
        status: "todo",
        dueLabel: "Apr 5, 2026",
      },
      {
        title: "Improve property details layout",
        description: "Rework media and contact sections to improve lead conversion on listing pages.",
        assigneeRole: "Project Manager",
        priority: "medium",
        status: "completed",
        dueLabel: "Mar 27, 2026",
      },
    ],
    expectedOutput: "Your work should improve lead capture, keep listing pages stable, and avoid breaking the content workflow for operations.",
    startDate: "2025-08-14",
    deadline: "2026-06-10",
    status: "Active",
    ownerId: "4",
    progress: 47,
    team: [
      { memberId: "4", role: "Project Manager" },
      { memberId: "1", role: "Frontend Developer" },
      { memberId: "5", role: "CRM Integrations" },
    ],
    files: [
      { title: "Lead Flow Document", type: "PDF", updatedAt: "2026-02-09" },
      { title: "Campaign Design Kit", type: "Figma", updatedAt: "2026-02-20" },
      { title: "CRM Mapping", type: "Docs", updatedAt: "2026-03-04" },
    ],
  },
  {
    id: "pulse-hq",
    name: "Pulse HQ",
    description: "Internal operations workspace for approvals, team updates, and workflow visibility.",
    objective: "Reduce manual follow-ups by giving teams one place to manage approvals, updates, and operational tasks.",
    summary: "Pulse HQ supports internal operations across departments. The work includes approval flows, operational dashboards, and workspace improvements that help teams move requests faster and with fewer manual check-ins.",
    users: "Used by operations, finance, HR, and leadership teams to track requests, updates, and approvals.",
    scope: ["Approval workflows", "Operations dashboard", "Activity feeds", "Notifications", "Team reporting"],
    firstSteps: [
      "Review the active workflow that your task belongs to before making UI or logic changes.",
      "Check approval states and user roles before editing forms or status transitions.",
      "Confirm with the owner which teams are affected by the change before shipping.",
    ],
    exampleTasks: [
      {
        title: "Build approvals overview widget",
        description: "Add a dashboard widget showing pending approvals by team and urgency.",
        assigneeRole: "Frontend Developer",
        priority: "high",
        status: "inprogress",
        dueLabel: "Apr 9, 2026",
      },
      {
        title: "Add escalation state to requests",
        description: "Support escalation flags and display logic in the workflow timeline.",
        assigneeRole: "Backend Developer",
        priority: "medium",
        status: "todo",
        dueLabel: "Apr 11, 2026",
      },
      {
        title: "Refine approvals empty states",
        description: "Improve guidance copy and CTA behavior when no approvals are pending.",
        assigneeRole: "Designer",
        priority: "low",
        status: "completed",
        dueLabel: "Mar 29, 2026",
      },
    ],
    expectedOutput: "Changes should make internal workflows easier to follow, reduce approval delays, and keep team visibility high.",
    startDate: "2025-10-03",
    deadline: "2026-05-28",
    status: "Active",
    ownerId: "5",
    progress: 39,
    team: [
      { memberId: "5", role: "Project Manager" },
      { memberId: "1", role: "Frontend Developer" },
      { memberId: "3", role: "Backend Developer" },
      { memberId: "4", role: "Designer" },
    ],
    files: [
      { title: "Workflow Map", type: "Docs", updatedAt: "2026-02-14" },
      { title: "Ops Dashboard Wireframes", type: "Figma", updatedAt: "2026-02-27" },
      { title: "Permissions Matrix", type: "Sheet", updatedAt: "2026-03-06" },
    ],
  },
  {
    id: "lumen-support",
    name: "Lumen Support",
    description: "Customer support portal for ticket triage, response templates, and help content.",
    objective: "Help support teams respond faster by improving ticket workflows, self-service content, and queue visibility.",
    summary: "Lumen Support focuses on triage speed, clearer response workflows, and easier access to support knowledge. The project includes queue management, ticket details, macros, and knowledge base improvements.",
    users: "Used by support agents, team leads, and customers accessing help content.",
    scope: ["Ticket queues", "Knowledge base", "Response templates", "Agent dashboards", "SLA alerts"],
    firstSteps: [
      "Review the ticket lifecycle and SLA rules before changing queue behavior.",
      "Check support copy and macros before updating user-facing text.",
      "Validate agent workflows in both desktop and mobile layouts.",
    ],
    exampleTasks: [
      {
        title: "Create SLA alert badges",
        description: "Surface overdue and at-risk ticket states clearly in the queue list.",
        assigneeRole: "Frontend Developer",
        priority: "high",
        status: "todo",
        dueLabel: "Apr 12, 2026",
      },
      {
        title: "Add macro usage analytics",
        description: "Track template usage and response performance for team leads.",
        assigneeRole: "Data Engineer",
        priority: "medium",
        status: "inprogress",
        dueLabel: "Apr 14, 2026",
      },
      {
        title: "Refresh help article layout",
        description: "Improve content readability and related-article discovery in the knowledge base.",
        assigneeRole: "Designer",
        priority: "medium",
        status: "completed",
        dueLabel: "Mar 31, 2026",
      },
    ],
    expectedOutput: "The support experience should become faster for agents and clearer for customers looking for answers.",
    startDate: "2025-11-18",
    deadline: "2026-06-18",
    status: "Planning",
    ownerId: "3",
    progress: 24,
    team: [
      { memberId: "3", role: "Project Manager" },
      { memberId: "2", role: "Frontend Developer" },
      { memberId: "4", role: "Designer" },
      { memberId: "5", role: "Data Engineer" },
    ],
    files: [
      { title: "Support Flow Audit", type: "PDF", updatedAt: "2026-02-10" },
      { title: "Queue Redesign", type: "Figma", updatedAt: "2026-02-26" },
      { title: "SLA Rules", type: "Docs", updatedAt: "2026-03-07" },
    ],
  },
];

export function getProjectById(projectId?: string) {
  return PROJECTS.find((project) => project.id === projectId);
}
