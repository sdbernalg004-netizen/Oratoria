declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(input: { buffer?: Buffer | ArrayBuffer; path?: string }): Promise<MammothResult>;
  export function convertToHtml(input: { buffer?: Buffer | ArrayBuffer; path?: string }): Promise<MammothResult>;
}
