import { isValidEmail, isValidInputLength, sanitizeInput } from "@/lib/security";

export type DeviceQuoteCondition = "new" | "open_box" | "used";
export type DeviceQuoteFulfillment = "pickup" | "shipping";
export type DeviceQuoteLocale = "de" | "en";

export type DeviceQuoteRequest = {
  brand: string;
  model: string;
  condition: DeviceQuoteCondition;
  storage: string;
  color: string;
  budget: string;
  fulfillment: DeviceQuoteFulfillment;
  customerName: string;
  email: string;
  phone: string;
  consent: true;
  locale: DeviceQuoteLocale;
  recaptchaToken: string;
};

export type DeviceQuoteParseResult =
  | { success: true; data: DeviceQuoteRequest }
  | { success: false; error: string };

const conditions = new Set<DeviceQuoteCondition>(["new", "open_box", "used"]);
const fulfillmentOptions = new Set<DeviceQuoteFulfillment>(["pickup", "shipping"]);
const isValidPhone = (phone: string): boolean =>
  /^[+()\d\s./-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 7;

export const parseDeviceQuoteRequest = (payload: Record<string, unknown>): DeviceQuoteParseResult => {
  const brand = sanitizeInput(payload.brand);
  const model = sanitizeInput(payload.model);
  const customerName = sanitizeInput(payload.customerName);
  const email = sanitizeInput(payload.email);
  const phone = sanitizeInput(payload.phone).replace(/\s+/g, " ");
  const condition = sanitizeInput(payload.condition) as DeviceQuoteCondition;
  const fulfillment = sanitizeInput(payload.fulfillment) as DeviceQuoteFulfillment;
  const storage = sanitizeInput(payload.storage);
  const color = sanitizeInput(payload.color);
  const budget = sanitizeInput(payload.budget);
  const recaptchaToken = sanitizeInput(payload.recaptchaToken);

  if (
    !brand ||
    !model ||
    !customerName ||
    !conditions.has(condition) ||
    !fulfillmentOptions.has(fulfillment) ||
    payload.consent !== true
  ) {
    return { success: false, error: "invalid_fields" };
  }

  if (
    (email && !isValidEmail(email)) ||
    (phone && !isValidPhone(phone)) ||
    (!email && !phone)
  ) {
    return { success: false, error: "invalid_contact" };
  }

  if (
    ![brand, model, customerName, storage, color, budget].every((value) => isValidInputLength(value, 120)) ||
    !isValidInputLength(email, 254) ||
    !isValidInputLength(phone, 40) ||
    !isValidInputLength(recaptchaToken, 4096)
  ) {
    return { success: false, error: "too_long" };
  }

  return {
    success: true,
    data: {
      brand,
      model,
      condition,
      storage,
      color,
      budget,
      fulfillment,
      customerName,
      email,
      phone,
      consent: true,
      locale: payload.locale === "en" ? "en" : "de",
      recaptchaToken,
    },
  };
};
