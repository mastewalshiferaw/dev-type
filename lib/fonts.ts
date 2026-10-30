import { Geist } from 'next/font/google';

/**
 * Sans-serif body copy for the landing and legal pages. Headings and code stay monospace.
 * Loaded here rather than in the root layout so the typing app does not download it.
 */
export const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });
