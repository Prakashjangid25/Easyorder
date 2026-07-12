import React from "react";

export function MenuCardSkeleton() {
  return (
    <div className="product-card skeleton-container">
      <div className="product-image-wrapper skeleton" style={{ width: "110px", height: "110px" }}></div>
      <div className="product-card-info" style={{ flex: 1, gap: "12px", display: "flex", flexDirection: "column" }}>
        <div className="skeleton" style={{ height: "20px", width: "60%", borderRadius: "4px" }}></div>
        <div className="skeleton" style={{ height: "14px", width: "90%", borderRadius: "4px" }}></div>
        <div className="skeleton" style={{ height: "14px", width: "40%", borderRadius: "4px" }}></div>
        <div className="flex justify-between align-center" style={{ marginTop: "auto" }}>
          <div className="skeleton" style={{ height: "24px", width: "80px", borderRadius: "4px" }}></div>
          <div className="skeleton" style={{ height: "32px", width: "100px", borderRadius: "20px" }}></div>
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card stat-card" style={{ gap: "16px" }}>
      <div className="skeleton" style={{ width: "56px", height: "56px", borderRadius: "8px" }}></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="skeleton" style={{ height: "14px", width: "50%", borderRadius: "4px" }}></div>
        <div className="skeleton" style={{ height: "28px", width: "70%", borderRadius: "4px" }}></div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i}>
          <div className="skeleton" style={{ height: "18px", width: i === 0 ? "80px" : i === 1 ? "120px" : "100px", borderRadius: "4px" }}></div>
        </td>
      ))}
    </tr>
  );
}
