import type { Ionicons } from "@expo/vector-icons";

export interface AppFeature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}

/** Shared feature list shown on first launch (Onboarding) and in "Über Foodicted". */
export const APP_FEATURES: AppFeature[] = [
  {
    icon: "camera",
    title: "Vorrat erfassen",
    text: "Fotografiere Kühlschrank, Vorratskammer oder Schrank, oder trag Zutaten manuell ein - die KI erkennt automatisch, was du zuhause hast, und merkt sich deinen Vorrat dauerhaft.",
  },
  {
    icon: "restaurant",
    title: "Passende Rezepte",
    text: "KI-Vorschläge abgestimmt auf deine Präferenzen (Ziel, Diät, Allergien, Zeit) - zuerst alles sofort Machbare, danach weitere Ideen mit ein paar zusätzlichen Zutaten.",
  },
  {
    icon: "heart",
    title: "Lieblingsrezepte",
    text: "Rezepte speichern, nach Kategorie und eigenen Tags organisieren, oder eigene Rezepte eintragen und von der KI vervollständigen lassen.",
  },
  {
    icon: "checkmark-circle",
    title: "Live-Zutaten-Check",
    text: "Jede Rezeptseite zeigt live, welche Zutaten laut deinem Vorrat schon vorhanden sind - mit optionalem Foto-Abgleich direkt für ein bestimmtes Rezept.",
  },
  {
    icon: "cart",
    title: "Einkaufsliste",
    text: "Fehlende Zutaten landen mit einem Tipp auf der Einkaufsliste - inklusive Hinweis, aus welchem Rezept sie stammen.",
  },
  {
    icon: "people",
    title: "Gemeinsam als Haushalt",
    text: "Mit Google anmelden und per Einladungscode Favoriten & Einkaufsliste live mit der Familie teilen.",
  },
  {
    icon: "time",
    title: "Verlauf",
    text: "Die letzten 20 angesehenen Rezepte findest du jederzeit unter „Zuletzt angesehen\" wieder.",
  },
];
