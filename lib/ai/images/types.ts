export interface ImageProviderDef {
  id: string
  label: string
}

// Aspect ratios supported by Flux on Replicate. Panels in the slide layouts are
// portrait (386x562 → closest is 3:4); full-bleed backgrounds are 16:9.
export type ImageAspect = '16:9' | '3:4' | '9:16' | '1:1' | '4:3'

export interface ImageGenOptions {
  aspectRatio?: ImageAspect
}

// Server-side generator function — never imported by client components.
// Token is passed in from the API route so the provider files stay stateless.
export type ImageGeneratorFn = (prompt: string, apiKey: string, opts?: ImageGenOptions) => Promise<string>
