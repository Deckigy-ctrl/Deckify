export interface ImageProviderDef {
  id: string
  label: string
}

// Server-side generator function — never imported by client components.
// Token is passed in from the API route so the provider files stay stateless.
export type ImageGeneratorFn = (prompt: string, apiKey: string) => Promise<string>
