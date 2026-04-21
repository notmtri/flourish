import { ReviewContent } from './types';

export const brandSettingsStorageKey = 'flourish_brand_settings';

export interface BrandSettings {
  logoUrl: string;
}

export const defaultBrandSettings: BrandSettings = {
  logoUrl: 'https://69e4b9432d9a763bcd9bf255.imgix.net/flourish.png',
};

export const siteMedia = {
  products: {
    fallbackImage: 'https://69e4b9432d9a763bcd9bf255.imgix.net/fallback.png',
  },
  home: {
    heroMain: 'https://ik.imagekit.io/hxk2zr0ap/5.jpg?updatedAt=1776707885065',
    heroSecondary: 'https://ik.imagekit.io/hxk2zr0ap/21.png?updatedAt=1776707894483',
  },
  social: {
    instagram: '#',
    facebook: '#',
  },
};

export const fallbackReviews: ReviewContent[] = [
  {
    id: 'demo-1',
    customerName: 'Minh Anh',
    productName: 'Graduation Bouquet',
    rating: 5,
    feedback: 'The bouquet looked elegant in photos and still sits perfectly on my desk weeks later.',
    avatar: '',
  },
  {
    id: 'demo-2',
    customerName: 'Hoang Vy',
    productName: 'Velvet Rose Wrap',
    rating: 5,
    feedback: 'Gifted this to my best friend and she loved how thoughtful and long-lasting it felt.',
    avatar: '',
  },
  {
    id: 'demo-3',
    customerName: 'Gia Bao',
    productName: 'Celebration Bundle',
    rating: 5,
    feedback: 'Beautiful finishing, careful wrapping, and it arrived ready to gift right away.',
    avatar: '',
  },
  {
    id: 'demo-4',
    customerName: 'Thao Nhi',
    productName: 'Rose Duo',
    rating: 5,
    feedback: 'The colors were soft, the wrapping felt premium, and it made my graduation gift look so thoughtful.',
    avatar: '',
  },
  {
    id: 'demo-5',
    customerName: 'Quoc Minh',
    productName: 'Celebration Bouquet',
    rating: 5,
    feedback: 'Ordering was simple and the bouquet looked exactly like the product photos when it arrived.',
    avatar: '',
  },
  {
    id: 'demo-6',
    customerName: 'Linh Chi',
    productName: 'Velvet Tulip Wrap',
    rating: 5,
    feedback: 'I wanted something that would last longer than fresh flowers and this was the perfect choice.',
    avatar: '',
  },
  {
    id: 'demo-7',
    customerName: 'Bao Tran',
    productName: 'Teacher Thank-You Bouquet',
    rating: 5,
    feedback: 'The bouquet felt warm and polished, and the gift-ready finish saved me extra prep time.',
    avatar: '',
  },
  {
    id: 'demo-8',
    customerName: 'Kim Ngan',
    productName: 'Pastel Bloom Bundle',
    rating: 5,
    feedback: 'The bouquet photographed beautifully and still looks lovely on my shelf after the event.',
    avatar: '',
  },
  {
    id: 'demo-9',
    customerName: 'Anh Khoa',
    productName: 'Classic Rose Bunch',
    rating: 5,
    feedback: 'The site made it easy to pick a bouquet quickly, and the final product felt personal and well made.',
    avatar: '',
  },
  {
    id: 'demo-10',
    customerName: 'Tram Anh',
    productName: 'Keepsake Bouquet',
    rating: 5,
    feedback: 'Everything from the colors to the packaging felt carefully considered. It was a very easy gift to love.',
    avatar: '',
  },
];
