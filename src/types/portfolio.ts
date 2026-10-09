export type PortfolioCategoryId = 'all' | 'websites' | 'web-apps' | 'branding' | 'ads' | 'thumbnails';

export interface PortfolioItem {
  id: string;
  title: string;
  categories: Exclude<PortfolioCategoryId, 'all'>[];
  tags?: string[];
  classification: 'Verified Client Work' | 'Portfolio Work' | 'Creative Portfolio' | 'Concept Project' | 'Personal Project';
  clientStatus: 'verified' | 'unverified';
  image: string;
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
  mediaAspect?: '16:9';
  alt: string;
  shortDescription: string;
  imageNote?: string;
  technologies?: string[];
  externalUrl?: string;
  artworkHref?: string;
  detailHref?: string;
  actionLabel?: string;
}

export interface PortfolioData {
  seo: { title: string; description: string };
  intro: { eyebrow: string; heading: string; description: string };
  categories: { id: PortfolioCategoryId; label: string; cardLabel?: string }[];
  creativeCategoryIds: Exclude<PortfolioCategoryId, 'all'>[];
  browsing: { initialCount: number; increment: number };
  labels: {
    filters: string;
    creative: string;
    projectSingular: string;
    projectPlural: string;
    empty: string;
    tags: string;
    viewDetail: string;
    viewLive: string;
    viewArtwork: string;
    showMore: string;
    showing: string;
    of: string;
  };
  contact: { heading: string; description: string; label: string; href: string };
  items: PortfolioItem[];
}
