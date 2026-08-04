export type AdminProductLocale = "de" | "en";

export type AdminProductConditionValidationInput = {
  condition: string;
  conditionNote: string;
  hasRealProductPhotos: boolean;
  imageCount: number;
  batteryHealth: string;
  title: string;
  brand: string;
  model: string;
  locale: AdminProductLocale;
};

export const isIphoneProduct = ({ title, brand, model }: Pick<AdminProductConditionValidationInput, "title" | "brand" | "model">) =>
  /iphone/i.test(`${brand} ${model} ${title}`);

export const validateAdminProductCondition = (input: AdminProductConditionValidationInput): string | null => {
  if (input.condition === "new") return null;

  const messages = {
    conditionDetailsRequired:
      input.locale === "de"
        ? "Für Open-Box- und Gebrauchtprodukte sind ein Zustandshinweis, mindestens ein Bild und die Bestätigung echter Produktfotos erforderlich."
        : "Open-box and used products require a condition note, at least one image, and confirmation that the photos show the exact product.",
    batteryHealthRequired:
      input.locale === "de"
        ? "Für gebrauchte iPhones ist die Batteriekapazität erforderlich."
        : "Used iPhones require battery health.",
    batteryHealthInvalid:
      input.locale === "de"
        ? "Die Batteriekapazität muss eine ganze Zahl von 1 bis 100 sein."
        : "Battery health must be a whole number from 1 to 100.",
  };

  if (!input.hasRealProductPhotos || input.imageCount < 1 || !input.conditionNote.trim()) {
    return messages.conditionDetailsRequired;
  }

  const batteryHealth = input.batteryHealth.trim();
  if (batteryHealth) {
    const value = Number(batteryHealth);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      return messages.batteryHealthInvalid;
    }
  }

  if (input.condition === "used" && isIphoneProduct(input) && !batteryHealth) {
    return messages.batteryHealthRequired;
  }

  return null;
};
