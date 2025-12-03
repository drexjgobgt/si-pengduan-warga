export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: "Clock",
  },
  diproses: {
    label: "Diproses",
    color: "bg-blue-100 text-blue-800",
    icon: "TrendingUp",
  },
  selesai: {
    label: "Selesai",
    color: "bg-green-100 text-green-800",
    icon: "CheckCircle",
  },
  ditolak: {
    label: "Ditolak",
    color: "bg-red-100 text-red-800",
    icon: "XCircle",
  },
};

export const PRIORITY_CONFIG = {
  rendah: { label: "Rendah", color: "text-gray-600", bg: "bg-gray-100" },
  normal: { label: "Normal", color: "text-blue-600", bg: "bg-blue-100" },
  tinggi: { label: "Tinggi", color: "text-orange-600", bg: "bg-orange-100" },
  darurat: { label: "Darurat", color: "text-red-600", bg: "bg-red-100" },
};

export const CATEGORY_ICONS = {
  sampah: "Trash2",
  jalan_rusak: "AlertTriangle",
  banjir: "Droplet",
  listrik: "Zap",
  air_bersih: "Droplet",
  keamanan: "Shield",
  kesehatan: "Heart",
  pendidikan: "Book",
  lainnya: "MoreHorizontal",
};
