import apiClient from "./api";

// ── Guide Payment ──────────────────────────────────────────

export async function initiateGuidePayment(bookingId, paymentPhase, userInfo = {}) {
  const response = await apiClient.post("/api/v1/payments/guide/initiate", {
    bookingId,
    bookingType: "GUIDE",
    paymentPhase,          // "ADVANCE" or "FINAL"
    firstName:  userInfo.firstName  || null,
    lastName:   userInfo.lastName   || null,
    email:      userInfo.email      || null,
    phone:      userInfo.phone      || null,
    address:    userInfo.address    || null,
    city:       userInfo.city       || null,
    country:    userInfo.country    || "Sri Lanka",
  });
  return response.data;   // PayHereInitResponse
}

export async function getGuidePaymentsForBooking(bookingId) {
  const response = await apiClient.get(
    `/api/v1/payments/guide/booking/${bookingId}`
  );
  return response.data;   // PaymentResponse[]
}

export async function getMyGuidePayments() {
  const response = await apiClient.get("/api/v1/payments/guide/my");
  return response.data;
}

// Fallback confirmation for local/sandbox setups where PayHere's IPN
// can't reach a non-public notify_url (e.g. localhost). Idempotent.
export async function confirmGuidePayment(orderId) {
  const response = await apiClient.post(`/api/v1/payments/guide/confirm/${orderId}`);
  return response.data;
}

// ── Vehicle Payment ────────────────────────────────────────

export async function initiateVehiclePayment(bookingId, paymentPhase, userInfo = {}) {
  const response = await apiClient.post("/api/v1/payments/vehicle/initiate", {
    bookingId,
    bookingType: "VEHICLE",
    paymentPhase,
    firstName:  userInfo.firstName  || null,
    lastName:   userInfo.lastName   || null,
    email:      userInfo.email      || null,
    phone:      userInfo.phone      || null,
    address:    userInfo.address    || null,
    city:       userInfo.city       || null,
    country:    userInfo.country    || "Sri Lanka",
  });
  return response.data;
}

export async function getVehiclePaymentsForBooking(bookingId) {
  const response = await apiClient.get(
    `/api/v1/payments/vehicle/booking/${bookingId}`
  );
  return response.data;
}

export async function getMyVehiclePayments() {
  const response = await apiClient.get("/api/v1/payments/vehicle/my");
  return response.data;
}

// Fallback confirmation for local/sandbox setups where PayHere's IPN
// can't reach a non-public notify_url (e.g. localhost). Idempotent.
export async function confirmVehiclePayment(orderId) {
  const response = await apiClient.post(`/api/v1/payments/vehicle/confirm/${orderId}`);
  return response.data;
}

// ── PayHere Form Submit ────────────────────────────────────
// Backend eken form data ලැබුණාට පස්සේ
// PayHere page ට redirect කරන්නේ hidden form submit ෙකෙන්

export function submitToPayHere(formData) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = formData.action;  // sandbox.payhere.lk/pay/checkout
  form.style.display = "none";

  const fieldMap = {
    merchant_id:    formData.merchantId,
    return_url:     formData.returnUrl,
    cancel_url:     formData.cancelUrl,
    notify_url:     formData.notifyUrl,
    order_id:       formData.orderId,
    items:          formData.itemsName,
    currency:       formData.currency,
    amount:         formData.amount?.toFixed(2),
    first_name:     formData.firstName,
    last_name:      formData.lastName,
    email:          formData.email,
    phone:          formData.phone,
    address:        formData.address    || "N/A",
    city:           formData.city       || "Colombo",
    country:        formData.country    || "Sri Lanka",
    hash:           formData.hash,
  };

  Object.entries(fieldMap).forEach(([key, value]) => {
    if (value == null) return;
    const input = document.createElement("input");
    input.type  = "hidden";
    input.name  = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();  // → PayHere payment page
}

// ── Combined helper: initiate + auto submit ────────────────
// Usage:
//   await payGuide(bookingId, "ADVANCE", user)
//   await payVehicle(bookingId, "FINAL", user)

export async function payGuide(bookingId, phase, user) {
  const userInfo = buildUserInfo(user);
  const formData = await initiateGuidePayment(bookingId, phase, userInfo);
  submitToPayHere(formData);
}

export async function payVehicle(bookingId, phase, user) {
  const userInfo = buildUserInfo(user);
  const formData = await initiateVehiclePayment(bookingId, phase, userInfo);
  submitToPayHere(formData);
}

// ── Helpers ────────────────────────────────────────────────

function buildUserInfo(user) {
  if (!user) return {};
  const nameParts = (user.name || "").split(" ");
  return {
    firstName: nameParts[0]                        || "",
    lastName:  nameParts.slice(1).join(" ")        || "-",
    email:     user.email                          || "",
    phone:     user.phone                          || "N/A",
    country:   user.nationality === "Sri Lankan"
                 ? "Sri Lanka" : (user.nationality || "Sri Lanka"),
  };
}

export function calcAdvanceAmount(totalCost) {
  return parseFloat((totalCost * 0.20).toFixed(2));
}

export function calcFinalAmount(totalCost) {
  return parseFloat((totalCost * 0.80).toFixed(2));
}

export function calcCommission(amount) {
  return parseFloat((amount * 0.15).toFixed(2));
}

export function calcPayout(amount) {
  return parseFloat((amount * 0.85).toFixed(2));
}

// ── Payment status helpers ────────────────────────────────

export const PAYMENT_STATUS = {
  PENDING:   { label: "Pending",   color: "bg-gray-100 text-gray-600"   },
  COMPLETED: { label: "Paid",      color: "bg-green-100 text-green-700" },
  FAILED:    { label: "Failed",    color: "bg-red-100 text-red-600"     },
  REFUNDED:  { label: "Refunded",  color: "bg-blue-100 text-blue-700"   },
};

export const BOOKING_STATUS = {
  PENDING_PAYMENT: { label: "Awaiting Payment", color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED:       { label: "Confirmed",        color: "bg-blue-100 text-blue-700"     },
  COMPLETED:       { label: "Completed",        color: "bg-green-100 text-green-700"   },
  CANCELLED:       { label: "Cancelled",        color: "bg-red-100 text-red-600"       },
};

// ── Parse order_id from PayHere return_url ────────────────
// /payment/success?order=GBK-5-ADV-ABC123
export function parseOrderId(searchParams) {
  return new URLSearchParams(searchParams).get("order") || null;
}

// ── Booking type from order_id ─────────────────────────────
// GBK-5-ADV-ABC123 → "GUIDE"
// VBK-5-ADV-ABC123 → "VEHICLE"
export function getBookingTypeFromOrderId(orderId) {
  if (!orderId) return null;
  if (orderId.startsWith("GBK")) return "GUIDE";
  if (orderId.startsWith("VBK")) return "VEHICLE";
  return null;
}

// ── Phase from order_id ────────────────────────────────────
// GBK-5-ADV-ABC123 → "ADVANCE"
// GBK-5-FIN-ABC123 → "FINAL"
export function getPhaseFromOrderId(orderId) {
  if (!orderId) return null;
  if (orderId.includes("-ADV-")) return "ADVANCE";
  if (orderId.includes("-FIN-")) return "FINAL";
  return null;
}