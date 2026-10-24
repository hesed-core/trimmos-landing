import assets from "./assets.generated.json";
export type Category =
  | "Barber"
  | "Beauty"
  | "Agenda"
  | "Reservaciones"
  | "Personalización"
  | "Reportes";
export interface Screen {
  id: string;
  image: string;
  thumbnail: string;
  category: Category;
  title: string;
  description: string;
  alt: string;
  order: number;
  available: boolean;
  width: number;
  height: number;
}
const content: [string, Category, string, string][] = [
  [
    "01-dashboard-barber-playa",
    "Barber",
    "Controla tu barbería desde un solo lugar.",
    "Visualiza la operación diaria, servicios, personal y actividad de tu negocio.",
  ],
  [
    "02-dashboard-beauty-esencia",
    "Beauty",
    "Tu salón, organizado a tu manera.",
    "Supervisa servicios, equipo y operaciones desde una experiencia adaptada a Beauty.",
  ],
  [
    "03-reserva-publica-barber",
    "Reservaciones",
    "Tus clientes pueden reservar sus citas.",
    "Permite elegir servicio, profesional, fecha y horario desde una interfaz de reservación.",
  ],
  [
    "04-compartir-agenda-qr",
    "Reservaciones",
    "Comparte tu agenda en segundos.",
    "Comparte el enlace de reservaciones de tu establecimiento mediante un código QR.",
  ],
  [
    "05-dashboard-barber-navegacion-agenda",
    "Barber",
    "Todo conectado con tu operación.",
    "Accede fácilmente a los módulos administrativos de tu barbería.",
  ],
  [
    "06-configuracion-marca-barber",
    "Personalización",
    "Tu negocio, tu identidad.",
    "Personaliza los colores y la información visual de tu establecimiento.",
  ],
  [
    "07-dashboard-barber-bikingos",
    "Personalización",
    "Cada barbería tiene su propio estilo.",
    "Observa cómo una identidad visual diferente transforma la presentación del panel.",
  ],
  [
    "08-reportes-barber",
    "Reportes",
    "Convierte tu operación en información útil.",
    "Consulta estados de citas, comportamiento operativo y servicios registrados.",
  ],
  [
    "09-reserva-confirmada",
    "Reservaciones",
    "Una experiencia clara para tus clientes.",
    "Muestra la confirmación de una cita y las opciones disponibles después de reservar. El registro posterior está sujeto a disponibilidad.",
  ],
  [
    "10-dashboard-beauty-king",
    "Beauty",
    "Belleza con personalidad propia.",
    "Presenta una experiencia Beauty con colores e identidad propios.",
  ],
  [
    "11-agenda-operativa-barber",
    "Agenda",
    "La agenda que acompaña tu operación.",
    "Consulta disponibilidad y gestiona citas con selección de cliente, servicio y profesional.",
  ],
];
export const screens: Screen[] = content
  .map(([id, category, title, description], index) => {
    const asset = (assets as Record<string, { width: number; height: number }>)[
      id
    ];
    return {
      id,
      category,
      title,
      description,
      alt: `Captura real de TrimmOS: ${title} Datos identificativos ocultos.`,
      order: index + 1,
      available: !!asset,
      width: asset?.width ?? 1,
      height: asset?.height ?? 1,
      image: `/showcase/${id}.webp`,
      thumbnail: `/showcase/${id}-thumb.webp`,
    };
  })
  .filter((screen) => screen.available);
export const categories = [
  "Vista general",
  ...new Set(screens.map((s) => s.category)),
];
