export const newsKeys = {
  public: ["news", "public"] as const,
  list: ["news", "list"] as const,
  detail: (id: number) => ["news", "detail", id] as const,
  ticker: ["news", "ticker"] as const,
};
