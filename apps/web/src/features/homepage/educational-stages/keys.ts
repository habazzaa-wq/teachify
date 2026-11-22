export const stagesKeys = {
  public: ["stages", "public"] as const,
  settings: ["stages", "settings"] as const,
  list: ["stages", "list"] as const,
  detail: (id: number) => ["stages", "detail", id] as const,
  stats: (id: number) => ["stages", "stats", id] as const,
  statsAll: ["stages", "stats", "all"] as const,
};
