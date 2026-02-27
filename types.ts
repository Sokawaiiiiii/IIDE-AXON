export interface Source {
  title: string;
  uri: string;
}

export interface ResearchResult {
  answer: string;
  sources: Source[];
}

export interface Audience {
  id: string;
  name: string;
  demographics: string;
  interests: string;
  behaviors: string;
  createdAt: string;
  updatedAt: string;
  owner: string; // For now, will just be "Me"
}

export interface ChartDataItem {
  label: string;
  value: string;
}

export interface ComparisonChartDataItem {
  label: string;
  audienceA_value: string;
  audienceB_value: string;
}

export interface DiscoveredAudience {
  audienceName: string;
  description: string;
}