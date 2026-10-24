export const site = {
  phone: "528135731273",
  corporate: "https://www.hesedcore.com/",
  name: "TrimmOS",
} as const;
export function whatsapp(
  action: "trial" | "essential" | "pro" | "contact" = "trial",
): string {
  const messages = {
    trial:
      "Hola, quiero comenzar mis 30 días gratis de TrimmOS para mi negocio.",
    essential:
      "Hola, me interesa activar Essential de TrimmOS por $399 MXN al mes.",
    pro: "Hola, me interesa activar Pro de TrimmOS por $599 MXN al mes para Barber y Beauty.",
    contact: "Hola, quiero conocer TrimmOS y sus opciones para mi negocio.",
  };
  return `https://wa.me/${site.phone}?text=${encodeURIComponent(messages[action])}`;
}
