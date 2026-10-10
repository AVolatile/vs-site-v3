import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import Layout from './Layout.astro';
import seo from '@data/global/seo.json';
// Router execution is outside this server-rendered metadata contract.
vi.mock("astro:transitions",()=>({ClientRouter:undefined}));
vi.mock("astro:assets",()=>({Image:undefined,Picture:undefined}));
let container: AstroContainer;
beforeAll(async()=>{container=await AstroContainer.create();});
beforeEach(()=>{vi.stubEnv('PUBLIC_SITE_URL','');vi.stubEnv('PUBLIC_BASE_PATH','');});
afterEach(()=>vi.unstubAllEnvs());
const render=async(props:Record<string,unknown>={})=>cheerio.load(await container.renderToString(Layout,{props:{showShell:false,clientRuntime:false,enableLenis:false,...props},request:new Request('https://request-host.example.test/portfolio/')}));
const meta=($:cheerio.CheerioAPI,key:string)=>$('head meta[property="'+key+'"],head meta[name="'+key+'"]').attr('content');
describe('shared social metadata',()=>{
 it('publishes only approved Organization and WebSite facts with current brand assets',async()=>{
  const $=await render();
  const schemas=$('script[type="application/ld+json"]').map((_,node)=>JSON.parse($(node).text())).get();
  expect(schemas.map(s=>s['@type'])).toEqual(['Organization','WebSite']);
  const organization=schemas[0];
  expect(organization).toMatchObject({name:'Volatile Solutions',telephone:'+14015456860',email:'volatile-solutions@outlook.com',url:'https://volatile-solutions.net',image:'https://volatile-solutions.net/volatile-solutions-og.png',logo:'https://volatile-solutions.net/assets/images/t001-nova/t001-nova-navbar-logo.png'});
  for(const field of ['address','geo','openingHoursSpecification','priceRange','taxID'])expect(organization).not.toHaveProperty(field);
  expect(organization.sameAs).toHaveLength(4);
 });
 it('keeps schema and social images on the same staging origin',async()=>{
  vi.stubEnv('PUBLIC_SITE_URL','https://vs-site-v3.netlify.app/');
  const $=await render();const organization=JSON.parse($('script[type="application/ld+json"]').first().text());
  expect(organization.image).toBe(meta($,'og:image'));
  expect(organization.logo).toBe('https://vs-site-v3.netlify.app/assets/images/t001-nova/t001-nova-navbar-logo.png');
  expect(organization.url).toBe('https://vs-site-v3.netlify.app');
 });
 it('keeps previews noindex after the production indexing switch is enabled',async()=>{
  const original=seo.index;seo.index=true;
  try{
   vi.stubEnv('PUBLIC_SITE_URL','https://vs-site-v3.netlify.app/');expect(meta(await render(),'robots')).toBe('noindex, follow');
   vi.stubEnv('PUBLIC_SITE_URL','https://volatile-solutions.net/');vi.stubEnv('CONTEXT','deploy-preview');expect(meta(await render(),'robots')).toBe('noindex, follow');
   vi.stubEnv('CONTEXT','production');vi.stubEnv('NETLIFY','true');expect(meta(await render(),'robots')).toBe('index, follow');
   expect(meta(await render({noIndex:true}),'robots')).toBe('noindex, follow');
  }finally{seo.index=original;}
 });
 it('provides one authoritative value for every required OG and Twitter tag',async()=>{
  const $=await render();
  for(const key of ['og:type','og:site_name','og:url','og:title','og:description','og:image','og:image:width','og:image:height','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt'])expect($('head meta[property="'+key+'"],head meta[name="'+key+'"]').length,key).toBe(1);
  expect(meta($,'og:type')).toBe('website');expect(meta($,'og:site_name')).toBe('Volatile Solutions');expect(meta($,'og:title')).toBe('Volatile Solutions');expect(meta($,'og:description')).toBe(seo.defaultDescription);
  expect(meta($,'og:image')).toBe('https://volatile-solutions.net/volatile-solutions-og.png');expect(meta($,'og:image:width')).toBe('1200');expect(meta($,'og:image:height')).toBe('630');expect(meta($,'og:image:alt')).toBe(seo.defaultOgImageAlt);
  expect(meta($,'twitter:card')).toBe('summary_large_image');expect(meta($,'twitter:title')).toBe(meta($,'og:title'));expect(meta($,'twitter:description')).toBe(meta($,'og:description'));expect(meta($,'twitter:image')).toBe(meta($,'og:image'));expect(meta($,'twitter:image:alt')).toBe(meta($,'og:image:alt'));
  expect($('meta[name="twitter:site"],meta[name="twitter:creator"]').length).toBe(0);
 });
 it('preserves page title/description, noindex, canonical and schema',async()=>{
  const $=await render({title:'Portfolio | Volatile Solutions',description:'An approved page description.'});
  expect($('head title').text()).toBe('Portfolio | Volatile Solutions');expect(meta($,'description')).toBe('An approved page description.');expect(meta($,'og:description')).toBe('An approved page description.');expect(meta($,'robots')).toBe('noindex, follow');
  expect($('head link[rel="canonical"]').length).toBe(1);expect($('head link[rel="canonical"]').attr('href')).toBe('https://volatile-solutions.net/portfolio/');expect(meta($,'og:url')).toBe($('head link[rel="canonical"]').attr('href'));expect($('script[type="application/ld+json"]').length).toBeGreaterThan(0);
  expect($('body img[src="'+seo.defaultOgImage+'"]').length).toBe(0);
 });
 it('uses the existing staging build origin override for canonical and image URLs',async()=>{
  vi.stubEnv('PUBLIC_SITE_URL','https://vs-site-v3.netlify.app/');
  const $=await render();expect(meta($,'og:image')).toBe('https://vs-site-v3.netlify.app/volatile-solutions-og.png');expect(meta($,'og:url')).toBe('https://vs-site-v3.netlify.app/portfolio/');expect(meta($,'robots')).toBe('noindex, follow');
 });
 it('preserves the existing preview base-path behavior',async()=>{
  vi.stubEnv('PUBLIC_SITE_URL','https://preview.example.test/preview/nova/');vi.stubEnv('PUBLIC_BASE_PATH','/preview/nova/');
  const $=await render();expect(meta($,'og:image')).toBe('https://preview.example.test/preview/nova/volatile-solutions-og.png');expect(meta($,'og:url')).toBe('https://preview.example.test/preview/nova/portfolio/');
 });
 it('retains intentional absolute page-image overrides and their metadata',async()=>{
  const $=await render({ogImage:'https://cdn.example.test/project.jpg',ogImageAlt:'Project artwork',ogImageWidth:1600,ogImageHeight:900,ogTitle:'A specific project',ogDescription:'Specific social description'});
  expect(meta($,'og:image')).toBe('https://cdn.example.test/project.jpg');expect(meta($,'twitter:image')).toBe('https://cdn.example.test/project.jpg');expect(meta($,'og:image:alt')).toBe('Project artwork');expect(meta($,'og:image:width')).toBe('1600');expect(meta($,'og:image:height')).toBe('900');expect(meta($,'og:title')).toBe('A specific project');expect(meta($,'twitter:description')).toBe('Specific social description');
 });
 it('retains intentional local page-image overrides',async()=>{
  const $=await render({ogImage:'/assets/images/project.png',title:'A project page'});expect(meta($,'og:image')).toBe('https://volatile-solutions.net/assets/images/project.png');expect(meta($,'og:image:alt')).toBe('A project page');
 });
 it('ships a real 1200 × 630 PNG with the unchanged complete source composition',async()=>{
  const output=await sharp('public/volatile-solutions-og.png').metadata();expect(output.width).toBe(1200);expect(output.height).toBe(630);expect(output.format).toBe('png');
  const expected=await sharp('legacy-assets/Logos/Volatile-Solutions-Agency-Banner.png').resize({width:1200,withoutEnlargement:true}).raw().toBuffer();const actual=await sharp('public/volatile-solutions-og.png').raw().toBuffer();expect(actual.equals(expected)).toBe(true);
  expect(readFileSync('public/volatile-solutions-og.png').length).toBeLessThan(readFileSync('legacy-assets/Logos/Volatile-Solutions-Agency-Banner.png').length);
 });
});
