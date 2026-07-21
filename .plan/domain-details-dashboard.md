# Domain Details Dashboard - Implementation Plan

## Overview

Replace the existing basic Domain Details page (`[domain]/page.tsx`) with a production-grade dashboard inspired by Vercel/Cloudflare/Coolify. Two-column layout with hero, tabs (Overview, DNS, SSL, Health, Timeline, Logs), right sidebar, alert banners, and professional empty/loading states.

**Route:** `/superadmin/dashboard/domains/[domain]`

---

## Architecture Decisions

### Data Strategy
- **No backend changes** - All data comes from existing APIs
- **Timeline**: Derived from `domain` fields (createdAt, verifiedAt, ssl.issuedAt) + `verificationLogs` returned by the API `show()` endpoint
- **Logs**: Use existing `auditService.entityHistory({ entity_type: 'TenantDomain', entity_id: id })` 
- **Health Checks**: Present `domain.health` data as structured individual checks (DNS, SSL, HTTP, Latency, Availability)
- **DNS Records**: For custom domains, generate expected records from domain config + server IP from mock/service. For platform domains, show the subdomain CNAME.
- **SSL**: Already fully available in `domain.ssl`
- **Placeholder adapters** for any missing data fields (e.g., algorithm, key size not in API)

### Component Organization
- New detail components go in `features/domains/components/detail/` subdirectory
- Existing components (`DomainHealthWidget`, `DomainDNSTab`, etc.) remain untouched
- Existing barrel exports remain untouched (new barrel added in `detail/index.ts`)

### Reused UI Components
- `AppCard`, `AppCardHeader`, `AppCardTitle`, `AppCardContent`
- `AppBadge`, `AppButton`, `AppTabs`, `AppTabsList`, `AppTabsTrigger`
- `AppTable`, `AppTableHeader`, `AppTableBody`, `AppTableRow`, `AppTableHead`, `AppTableCell`
- `AppBanner`, `AppProgress`, `AppSection`, `AppDivider`, `AppPage`, `AppPageHeader`
- `AppEmptyState`, `AppErrorState`, `AppPagination`, `AppWidget`
- `AppDropdownMenu`, `AppDropdownMenuItem`, `AppDropdownMenuTrigger`, `AppDropdownMenuContent`
- `AppTooltip`, `AppTooltipTrigger`, `AppTooltipContent`, `AppTooltipProvider`
- `Skeleton`, `AppSearchInput`
- `DomainStatusBadge` (existing, reused as-is)
- `ActivityTimeline` (existing, adapted for domain events)

---

## File Plan

### 1. NEW: `features/domains/types/detail.ts`

Extended types for the detail dashboard.

```typescript
export interface DomainTimelineEvent {
  id: string;
  type: "created" | "dns_verified" | "ssl_requested" | "ssl_issued" | "activated" | "renewed" | "suspended" | "failed" | "updated";
  title: string;
  description?: string;
  timestamp: string;
  actor: "system" | "admin";
  actorName?: string;
}

export interface DomainHealthCheck {
  id: string;
  name: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  message: string;
  lastChecked: string | null;
  value?: string;
}

export interface DomainLogEntry {
  id: string;
  time: string;
  source: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DomainLogsResponse {
  data: DomainLogEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DomainDetailAlert {
  id: string;
  variant: "warning" | "destructive" | "info";
  title: string;
  description: string;
}
```

### 2. NEW: `features/domains/services/domainDetail.ts`

Adapter services that transform existing API data into detail page shapes.

```typescript
export const domainDetailService = {
  // Transform domain data into timeline events
  getTimelineEvents(domain: PlatformDomain, verificationLogs?: any[]): DomainTimelineEvent[]
  
  // Generate DNS records for display (from domain config)
  getDnsRecords(domain: PlatformDomain): DnsRecord[]
  
  // Transform domain health into structured checks
  getHealthChecks(domain: PlatformDomain): DomainHealthCheck[]
  
  // Derive alert banners from domain state
  getAlerts(domain: PlatformDomain): DomainDetailAlert[]
  
  // Fetch domain logs via audit service (entity history)
  getLogs(domainId: string, params?: { page?: number; level?: string; search?: string }): Promise<DomainLogsResponse>
}
```

### 3. NEW: `features/domains/hooks/useDomainDetail.ts`

Detail-specific hooks.

```typescript
export function useDomainTimeline(domain: PlatformDomain | null): DomainTimelineEvent[]
export function useDomainHealthChecks(domain: PlatformDomain | null): DomainHealthCheck[]
export function useDomainAlerts(domain: PlatformDomain | null): DomainDetailAlert[]
export function useDomainLogs(domainId: string, params?: DomainLogsParams): UseQueryResult<DomainLogsResponse>
```

### 4. NEW: `features/domains/components/detail/DomainHero.tsx`

**Props:** `{ domain: PlatformDomain; onRefresh: () => void; onRenewSsl: () => void; isRefreshing: boolean; isRenewing: boolean }`

**Layout:**
- Breadcrumb: النطاقات > [domain]
- Domain name (large heading)
- Status badges row: Domain Status, SSL Status, DNS Status
- Meta row: Tenant Name, Type badge, Primary indicator, Created At, Last Checked
- Quick Actions bar: Open Website, Copy Domain, Copy DNS Records, Check DNS Now, Retry SSL, View Logs

### 5. NEW: `features/domains/components/detail/DomainOverviewCard.tsx`

**Props:** `{ domain: PlatformDomain }`

**Layout:** Three AppCard sections in a grid:

1. **General Card** - Key-value rows: Domain, Tenant, Status, Type, Primary, Created, Updated
2. **Connectivity Card** - Key-value rows: DNS Status, SSL Status, Health, Last DNS Check, Last SSL Check
3. **Performance Card** - Key-value rows: Last Response Time, HTTPS (enabled/disabled), Tenant Resolution

Each card uses consistent label/value styling with AppBadge for status values.

### 6. NEW: `features/domains/components/detail/DomainDnsCard.tsx`

**Props:** `{ domain: PlatformDomain; onRefresh: () => void; isRefreshing: boolean }`

**Layout:**
- Header with title + Refresh DNS button
- If no records: AppEmptyState with DNS icon
- If records: AppTable with columns: Type, Host, Value, Status, TTL, Actions
- Each row: Copy Value button, Copy Record button
- If DNS status is "failed" or "pending": Warning AppBanner explaining what needs to change
- DNS instructions panel (existing from DomainDNSTab pattern)

### 7. NEW: `features/domains/components/detail/DomainSslCard.tsx`

**Props:** `{ domain: PlatformDomain; onRetrySsl: () => void; isRetrying: boolean }`

**Layout:**
- Header with title + Retry SSL + Refresh Certificate buttons
- Certificate details grid: Provider, Status, Issued At, Expires At, Auto Renewal, Issuer, Algorithm (placeholder), Key Size (placeholder)
- Certificate timeline: Progress bar showing days remaining
- Warning AppBanner if expiry < 30 days
- Empty state if no SSL info

### 8. NEW: `features/domains/components/detail/DomainHealthCard.tsx`

**Props:** `{ domain: PlatformDomain }`

**Layout:**
- Overall health score with progress bar and status badge
- Grid of health check cards (6 checks):
  - DNS (status, last checked)
  - HTTPS (status, last checked)
  - Tenant Resolution (status)
  - Certificate (status)
  - Scheduler (derived from domain status)
  - Queue (placeholder/unknown)
- Each check: colored dot (green/yellow/red/gray), name, status label, timestamp

### 9. NEW: `features/domains/components/detail/DomainTimelineCard.tsx`

**Props:** `{ events: DomainTimelineEvent[]; loading: boolean }`

**Layout:**
- Vertical timeline (adapt existing `ActivityTimeline` pattern)
- Each event: colored dot, title, description, timestamp, actor badge
- Empty state if no events
- Loading skeleton

### 10. NEW: `features/domains/components/detail/DomainLogsCard.tsx`

**Props:** `{ logs: DomainLogsResponse | undefined; loading: boolean; onPageChange: (page: number) => void; onLevelFilter: (level: string) => void; onSearch: (search: string) => void; filters: { level: string; search: string; page: number } }`

**Layout:**
- Toolbar: Search input, Level filter dropdown, Date range (placeholder)
- AppTable: Time, Source, Level (colored badge), Message
- AppPagination at bottom
- Empty state if no logs
- Loading skeleton

### 11. NEW: `features/domains/components/detail/DomainSidebar.tsx`

**Props:** `{ domain: PlatformDomain }`

**Layout:** Sticky sidebar card (320px on desktop)

1. **Status Summary Card:**
   - Current Status (badge)
   - Health (score + badge)
   - SSL (badge)
   - DNS (badge)
   - Last Activity (relative time)

2. **Quick Links Card:**
   - Open Website
   - View Tenant
   - DNS Records (scroll to DNS tab)
   - SSL Certificate (scroll to SSL tab)
   - Health Checks (scroll to Health tab)

### 12. NEW: `features/domains/components/detail/DomainAlerts.tsx`

**Props:** `{ alerts: DomainDetailAlert[] }`

**Layout:**
- Stack of `AppBanner` components for each alert
- Only renders if alerts exist
- Each banner: variant (warning/destructive/info), title, description

### 13. NEW: `features/domains/components/detail/DomainDetailSkeleton.tsx`

**Props:** none (pure skeleton)

**Layout:**
- Hero skeleton: heading, badges, meta row, action buttons
- Tab skeleton: tab bar
- Two-column skeleton: main content (cards) + sidebar
- Professional shimmer effect using existing `Skeleton` component

### 14. NEW: `features/domains/components/detail/index.ts`

Barrel export for all detail components.

---

### 15. MODIFY: `features/domains/types/index.ts`

Add re-export:
```typescript
export * from "./detail";
```

### 16. MODIFY: `features/domains/hooks/index.ts`

Add re-export:
```typescript
export * from "./useDomainDetail";
```

### 17. MODIFY: `features/domains/services/index.ts`

Add re-export:
```typescript
export * from "./domainDetail";
```

### 18. MODIFY: `features/domains/index.ts`

Add re-exports for new detail components:
```typescript
export * from "./components/detail";
```

### 19. REWRITE: `app/(superadmin)/superadmin/dashboard/domains/[domain]/page.tsx`

Complete rewrite. Structure:

```tsx
"use client";

function DomainDetailPage({ params }) {
  const { domain: domainId } = use(params);
  const { data: domain, isLoading, isError } = useDomain(domainId);
  const refreshStatus = useRefreshStatus();
  const renewSsl = useRenewSsl();
  
  // Detail-specific hooks
  const timeline = useDomainTimeline(domain);
  const healthChecks = useDomainHealthChecks(domain);
  const alerts = useDomainAlerts(domain);
  const [logParams, setLogParams] = useState({ page: 1, level: "all", search: "" });
  const logsQuery = useDomainLogs(domainId, logParams);
  
  const [activeTab, setActiveTab] = useState("overview");
  
  // ... loading, error, not-found states
  
  return (
    <SuperAdminGuard>
      <AppPage maxWidth="full">
        <DomainAlerts alerts={alerts} />
        <DomainHero domain={domain} ... />
        
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            <AppTabs value={activeTab} onValueChange={setActiveTab}>
              {/* Tab bar */}
            </AppTabs>
            
            {/* Tab content */}
            {activeTab === "overview" && <DomainOverviewCard domain={domain} />}
            {activeTab === "dns" && <DomainDnsCard domain={domain} ... />}
            {activeTab === "ssl" && <DomainSslCard domain={domain} ... />}
            {activeTab === "health" && <DomainHealthCard domain={domain} />}
            {activeTab === "timeline" && <DomainTimelineCard events={timeline} ... />}
            {activeTab === "logs" && <DomainLogsCard logs={logsQuery.data} ... />}
          </div>
          
          <DomainSidebar domain={domain} />
        </div>
      </AppPage>
    </SuperAdminGuard>
  );
}
```

---

## Responsive Behavior

- **Desktop (lg+):** Two-column layout: main content + 320px sidebar
- **Tablet (< lg):** Single column, sidebar moves below content
- **Mobile (< md):** Stacked cards, full-width tabs, simplified hero

Implementation via Tailwind's responsive classes: `lg:grid-cols-[1fr_320px]`, `grid-cols-1`

---

## RTL Support

- Use logical CSS properties: `ms-*`, `ps-*`, `border-s-*`, `start-*`, `end-*`
- Breadcrumb arrows use RTL-aware icons from `@/components/ui/icons`
- Timeline connector adapts to RTL direction
- Tables use standard layout (no directional issues)

---

## Empty States

Each tab has its own empty state:
- **DNS:** "لا توجد سجلات DNS مهيأة بعد" with setup instructions
- **SSL:** "لا توجد معلومات SSL" with retry action
- **Health:** "لم تتم فحوصات الصحة بعد"
- **Timeline:** "لا توجد أحداث بعد" with icon
- **Logs:** "لا توجد سجلات" with icon

---

## Implementation Order

1. Types (`types/detail.ts`)
2. Services (`services/domainDetail.ts`)
3. Hooks (`hooks/useDomainDetail.ts`)
4. Skeleton (`detail/DomainDetailSkeleton.tsx`)
5. Alerts (`detail/DomainAlerts.tsx`)
6. Hero (`detail/DomainHero.tsx`)
7. Overview Card (`detail/DomainOverviewCard.tsx`)
8. DNS Card (`detail/DomainDnsCard.tsx`)
9. SSL Card (`detail/DomainSslCard.tsx`)
10. Health Card (`detail/DomainHealthCard.tsx`)
11. Timeline Card (`detail/DomainTimelineCard.tsx`)
12. Logs Card (`detail/DomainLogsCard.tsx`)
13. Sidebar (`detail/DomainSidebar.tsx`)
14. Barrel export (`detail/index.ts`)
15. Update feature barrel exports (types, hooks, services, index)
16. Rewrite page (`[domain]/page.tsx`)
17. Verify with `npm run lint` and `npm run typecheck`
