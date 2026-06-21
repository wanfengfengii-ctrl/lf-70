import type { LineType } from '@/types';

export const lineColors: Record<LineType, string> = {
  mountain: '#C0392B',
  valley: '#2980B9',
  cut: '#555555',
  axis: '#8E44AD',
  support: '#2C3E50',
};

export const lineWidths: Record<LineType, number> = {
  mountain: 2,
  valley: 2,
  cut: 1.5,
  axis: 2.5,
  support: 1,
};

export const lineDashArrays: Record<LineType, string> = {
  mountain: '8,4',
  valley: '4,4',
  cut: '0',
  axis: '12,4,4,4',
  support: '2,4',
};

export const lineTypeLabels: Record<LineType, string> = {
  mountain: '山折线',
  valley: '谷折线',
  cut: '剪口',
  axis: '对称轴',
  support: '支撑线',
};
