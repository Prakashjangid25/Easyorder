export function isValidUpiId(upiId) {
  if (!upiId || typeof upiId !== "string") return false;
  return /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim());
}

export function buildUpiPaymentUri({ upiId, payeeName, amount, note, orderId }) {
  const params = new URLSearchParams();
  params.set("pa", String(upiId || "").trim());
  if (payeeName) params.set("pn", String(payeeName).trim());
  params.set("am", Number(amount || 0).toFixed(2));
  params.set("cu", "INR");

  const cleanNote = String(note || "EasyOrder").trim();
  const shortOrderId = orderId ? String(orderId).slice(-6).toUpperCase() : "";
  params.set("tn", shortOrderId ? `${cleanNote} #${shortOrderId}` : cleanNote);

  return `upi://pay?${params.toString()}`;
}
