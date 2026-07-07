export function ModuleLoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border bg-card animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border bg-card animate-pulse" />
    </div>
  );
}
