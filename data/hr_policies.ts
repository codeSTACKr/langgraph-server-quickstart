export interface HRPolicy {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: Date;
  requiresManagerApproval: boolean;
}

export const hrPolicies: HRPolicy[] = [
  {
    id: "VAC001",
    title: "Vacation Policy",
    category: "Time Off",
    content: `
      Annual Paid Time Off (PTO) Policy:
      - Full-time employees receive 20 days of PTO annually
      - PTO accrues at 1.67 days per month
      - Maximum PTO balance: 30 days
      - Minimum 2 weeks notice required for vacation requests
      - Manager approval required for:
        * Consecutive vacation days exceeding 10 business days
        * Holiday season (December) requests
        * Multiple team members taking time off simultaneously
    `,
    lastUpdated: new Date("2024-01-01"),
    requiresManagerApproval: true,
  },
  {
    id: "SICK001",
    title: "Sick Leave Policy",
    category: "Time Off",
    content: `
      Sick Leave Policy:
      - 10 paid sick days per year
      - No accrual required; available immediately
      - Doctor's note required for absences exceeding 3 consecutive days
      - Unused sick days do not carry over to next year
      - Can be used for:
        * Personal illness or injury
        * Medical appointments
        * Care for immediate family members
    `,
    lastUpdated: new Date("2024-01-01"),
    requiresManagerApproval: false,
  },
  {
    id: "WFH001",
    title: "Work from Home Policy",
    category: "Work Arrangements",
    content: `
      Remote Work Policy:
      - Hybrid work model: 3 days in office, 2 days remote
      - Core hours: 10 AM - 4 PM local time
      - Equipment provided:
        * Laptop
        * Monitor
        * Keyboard and mouse
      - Internet stipend: $50/month
      - Remote work agreement must be signed
      - Permanent remote work requires VP approval
    `,
    lastUpdated: new Date("2024-02-15"),
    requiresManagerApproval: true,
  },
  {
    id: "BEN001",
    title: "Health Benefits",
    category: "Benefits",
    content: `
      Health Benefits Package:
      - Medical Insurance:
        * PPO and HMO options
        * 80% employer covered
        * Dental and Vision included
      - Life Insurance: 2x annual salary
      - Short-term disability
      - Long-term disability
      - FSA and HSA options available
      - Open enrollment: November 1-30
      - New employees: 30-day enrollment window
    `,
    lastUpdated: new Date("2024-01-15"),
    requiresManagerApproval: false,
  },
  {
    id: "PAR001",
    title: "Parental Leave",
    category: "Leave",
    content: `
      Parental Leave Policy:
      - Primary caregiver: 16 weeks paid leave
      - Secondary caregiver: 4 weeks paid leave
      - Additional 8 weeks unpaid leave available
      - Must be employed for 12 months to be eligible
      - Leave must be taken within 12 months of birth/adoption
      - Two weeks notice required before return
      - Flexible return-to-work arrangements available
    `,
    lastUpdated: new Date("2024-01-01"),
    requiresManagerApproval: true,
  },
];
