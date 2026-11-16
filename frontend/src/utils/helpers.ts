import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateStr;
  }
};

export const timeAgo = (dateStr: string) => {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

export const getRiskColor = (risk: string) => {
  switch (risk?.toLowerCase()) {
    case 'critical': return '#EF4444';
    case 'high': return '#F97316';
    case 'moderate': return '#EAB308';
    case 'low': return '#22C55E';
    default: return '#6B7280';
  }
};

export const getRiskBgColor = (risk: string) => {
  switch (risk?.toLowerCase()) {
    case 'critical': return 'rgba(239,68,68,0.15)';
    case 'high': return 'rgba(249,115,22,0.15)';
    case 'moderate': return 'rgba(234,179,8,0.15)';
    case 'low': return 'rgba(34,197,94,0.15)';
    default: return 'rgba(107,114,128,0.15)';
  }
};

export const getEmotionColor = (emotion: string): string => {
  const map: Record<string, string> = {
    joy: '#22C55E', happiness: '#22C55E', happy: '#22C55E',
    love: '#EC4899', admiration: '#F472B6',
    gratitude: '#10B981', relief: '#34D399', calm: '#6EE7B7',
    sadness: '#3B82F6', sad: '#3B82F6', grief: '#1D4ED8',
    fear: '#8B5CF6', fearful: '#7C3AED',
    anger: '#EF4444', disgust: '#DC2626',
    surprise: '#F59E0B', curiosity: '#FBBF24',
    neutral: '#6B7280', confusion: '#9CA3AF',
    anxiety: '#F97316', nervousness: '#FB923C',
  };
  return map[emotion?.toLowerCase()] || '#00BCD4';
};

export const truncate = (str: string, len = 120) =>
  str && str.length > len ? str.slice(0, len) + '…' : str;

export const capitalizeFirst = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
