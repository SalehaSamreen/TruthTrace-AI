declare module 'piexifjs' {
  export function load(hexStringData: string): Record<string, any>;
  export const ImageIFD: Record<string, number>;
  export const GPSIFD: Record<string, number>;
}
