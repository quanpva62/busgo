// Wrapper map Material Symbols name → Lucide component.
// Dùng: <Icon name="add" className="w-4 h-4 text-primary" />
import {
  Plus,
  X,
  Download,
  Upload,
  Send,
  Trash2,
  Trash,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  GripVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  Zap,
  Image as ImageIcon,
  Flag,
  Bus,
  Ticket,
  QrCode,
  Clock,
  Ruler,
  Building2,
  Bell,
  Wallet,
  Percent,
  WalletCards,
  Users,
  ShieldCheck,
  User,
  Wifi,
  Snowflake,
  Usb,
  BedSingle,
  GlassWater,
  Star,
  Tag,
  Bot,
  Mail,
} from "lucide-react";

const MAP = {
  // Action / nav
  add: Plus,
  close: X,
  download: Download,
  upload: Upload,
  send: Send,
  delete: Trash2,
  delete_sweep: Trash,
  tune: SlidersHorizontal,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  arrow_forward: ArrowRight,
  drag_indicator: GripVertical,

  // Status / feedback
  check_circle: CheckCircle2,
  cancel: XCircle,
  error: AlertCircle,
  info: Info,
  progress_activity: Loader2,
  bolt: Zap,
  image: ImageIcon,
  flag: Flag,

  // Booking / transport
  directions_bus: Bus,
  confirmation_number: Ticket,
  qr_code_scanner: QrCode,
  schedule: Clock,
  straighten: Ruler,
  apartment: Building2,
  notifications: Bell,

  // Finance / user
  payments: Wallet,
  percent: Percent,
  account_balance_wallet: WalletCards,
  group: Users,
  admin_panel_settings: ShieldCheck,
  person: User,

  // Amenities
  wifi: Wifi,
  ac_unit: Snowflake,
  usb: Usb,
  airline_seat_flat: BedSingle,
  water_drop: GlassWater,

  // Misc
  star: Star,
  sell: Tag,
  smart_toy: Bot,
  mail: Mail,
};

export default function Icon({ name, className = "w-5 h-5", ...rest }) {
  const Cmp = MAP[name];
  if (!Cmp) {
    console.warn(`[Icon] Missing mapping for "${name}"`);
    return <span className={className} {...rest} />;
  }
  return <Cmp className={className} {...rest} />;
}
