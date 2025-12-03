export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    tahun: 31536000,
    bulan: 2592000,
    minggu: 604800,
    hari: 86400,
    jam: 3600,
    menit: 60,
  };

  for (const [name, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `${interval} ${name} yang lalu`;
    }
  }

  return "Baru saja";
};

export const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return "text-green-600";
  if (confidence >= 60) return "text-blue-600";
  if (confidence >= 40) return "text-yellow-600";
  return "text-red-600";
};

export const getConfidenceBg = (confidence) => {
  if (confidence >= 80) return "bg-green-100";
  if (confidence >= 60) return "bg-blue-100";
  if (confidence >= 40) return "bg-yellow-100";
  return "bg-red-100";
};
