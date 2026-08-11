export default function DashboardLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <div
        className="skeleton"
        style={{ height: 38, width: 220, borderRadius: "var(--radius-sm)" }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        <div className="skeleton" style={{ height: 110, borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ height: 110, borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ height: 110, borderRadius: "var(--radius)" }} />
      </div>

      <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius)", marginTop: 12 }} />
    </div>
  );
}
