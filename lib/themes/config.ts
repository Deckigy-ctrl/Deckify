export type ThemeKey =
  | 'clean' | 'ocean' | 'warm' | 'bold'
  | 'diagonal' | 'horizon' | 'typo' | 'stage'
  | 'card' | 'grid' | 'editorial' | 'bands'
  | 'portrait' | 'overlap';

export const TBGS: Record<ThemeKey, string> = {
  clean:'#ffffff', ocean:'#0a2540', warm:'#fdf4e8', bold:'#0f0f0f',
  diagonal:'#ffffff', horizon:'#0a2540', typo:'#fdf4e8', stage:'#0f0f12',
  card:'#e6f1fb', grid:'#0a1628', editorial:'#fafaf8', bands:'#1a0a2e',
  portrait:'#ffffff', overlap:'#2c2c2a'
};

export const TTXTS: Record<ThemeKey, string> = {
  clean:'#111111', ocean:'#e8f0fe', warm:'#3d1f0a', bold:'#e8e8e8',
  diagonal:'#111111', horizon:'#e8f0fe', typo:'#3d1f0a', stage:'#faf5ff',
  card:'#042c53', grid:'#e8f0ff', editorial:'#1a1a1a', bands:'#faf5ff',
  portrait:'#1a2e1e', overlap:'#f1efe8'
};

export const TACCS: Record<ThemeKey, string> = {
  clean:'#2a5cff', ocean:'#60a5fa', warm:'#c05621', bold:'#2a5cff',
  diagonal:'#1d9e75', horizon:'#60a5fa', typo:'#c05621', stage:'#e879f9',
  card:'#0c447c', grid:'#2a5cff', editorial:'#1a1a1a', bands:'#7f77dd',
  portrait:'#4a7c59', overlap:'#fac775'
};

export interface ThemeConfig {
  layout: string;
  toa: string;
  serif: boolean;
  dark: boolean;
}

export const THEME_CONFIGS: Record<ThemeKey, ThemeConfig> = {
  clean:     {layout:'split',    toa:'#ffffff', serif:false, dark:false},
  ocean:     {layout:'split',    toa:'#ffffff', serif:false, dark:true},
  warm:      {layout:'split',    toa:'#ffffff', serif:false, dark:false},
  bold:      {layout:'split',    toa:'#ffffff', serif:false, dark:true},
  diagonal:  {layout:'diagonal', toa:'#ffffff', serif:false, dark:false},
  horizon:   {layout:'horizon',  toa:'#ffffff', serif:false, dark:true},
  typo:      {layout:'typo',     toa:'#ffffff', serif:true,  dark:false},
  stage:     {layout:'stage',    toa:'#1a0a2e', serif:false, dark:true},
  card:      {layout:'card',     toa:'#ffffff', serif:false, dark:false},
  grid:      {layout:'grid',     toa:'#e8f0ff', serif:false, dark:true},
  editorial: {layout:'editorial',toa:'#ffffff', serif:true,  dark:false},
  bands:     {layout:'bands',    toa:'#ffffff', serif:false, dark:true},
  portrait:  {layout:'portrait', toa:'#ffffff', serif:false, dark:false},
  overlap:   {layout:'overlap',  toa:'#2c2c2a', serif:false, dark:true},
};

export interface PresThemeColors {
  bg: string; text: string; accent: string; muted: string; toa: string; layout: string;
}

export const PRES_TC: Record<ThemeKey, PresThemeColors> = {
  clean:     {bg:'#ffffff', text:'#111111', accent:'#2a5cff', muted:'#666',                  toa:'#ffffff', layout:'split'},
  ocean:     {bg:'#0a2540', text:'#e8f0fe', accent:'#60a5fa', muted:'rgba(255,255,255,.5)',   toa:'#ffffff', layout:'split'},
  warm:      {bg:'#fdf4e8', text:'#3d1f0a', accent:'#c05621', muted:'#9a7d5e',               toa:'#ffffff', layout:'split'},
  bold:      {bg:'#0f0f0f', text:'#e8e8e8', accent:'#2a5cff', muted:'#777',                  toa:'#ffffff', layout:'split'},
  diagonal:  {bg:'#ffffff', text:'#111111', accent:'#1d9e75', muted:'#666',                  toa:'#ffffff', layout:'diagonal'},
  horizon:   {bg:'#0a2540', text:'#e8f0fe', accent:'#60a5fa', muted:'rgba(255,255,255,.5)',   toa:'#ffffff', layout:'horizon'},
  typo:      {bg:'#fdf4e8', text:'#3d1f0a', accent:'#c05621', muted:'#9a7d5e',               toa:'#ffffff', layout:'typo'},
  stage:     {bg:'#0f0f12', text:'#faf5ff', accent:'#e879f9', muted:'rgba(250,245,255,.5)',   toa:'#1a0a2e', layout:'stage'},
  card:      {bg:'#e6f1fb', text:'#042c53', accent:'#0c447c', muted:'#378add',               toa:'#ffffff', layout:'card'},
  grid:      {bg:'#0a1628', text:'#e8f0ff', accent:'#2a5cff', muted:'rgba(232,240,255,.45)', toa:'#e8f0ff', layout:'grid'},
  editorial: {bg:'#fafaf8', text:'#1a1a1a', accent:'#1a1a1a', muted:'#888',                  toa:'#ffffff', layout:'editorial'},
  bands:     {bg:'#1a0a2e', text:'#faf5ff', accent:'#7f77dd', muted:'rgba(250,245,255,.5)',   toa:'#ffffff', layout:'bands'},
  portrait:  {bg:'#ffffff', text:'#1a2e1e', accent:'#4a7c59', muted:'#6b9e7a',               toa:'#ffffff', layout:'portrait'},
  overlap:   {bg:'#2c2c2a', text:'#f1efe8', accent:'#fac775', muted:'rgba(241,239,232,.45)', toa:'#2c2c2a', layout:'overlap'},
};

export const ALL_THEMES: { id: ThemeKey; name: string }[] = [
  {id:'clean',    name:'Clean'},
  {id:'ocean',    name:'Ocean'},
  {id:'warm',     name:'Warm'},
  {id:'bold',     name:'Bold'},
  {id:'diagonal', name:'Diagonal'},
  {id:'horizon',  name:'Horizon'},
  {id:'typo',     name:'Typo'},
  {id:'stage',    name:'Stage'},
  {id:'card',     name:'Card'},
  {id:'grid',     name:'Grid'},
  {id:'editorial',name:'Editorial'},
  {id:'bands',    name:'Bands'},
  {id:'portrait', name:'Portrait'},
  {id:'overlap',  name:'Overlap'},
];
