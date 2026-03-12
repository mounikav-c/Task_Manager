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
];

export function getProjectById(projectId?: string) {
  return PROJECTS.find((project) => project.id === projectId);
}
