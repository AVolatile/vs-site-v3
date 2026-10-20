import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import adminEndpoint from './functions/admin-inquiries.mts';
import { createInquiry, getInquiry, updateInquiry, updateFollowUp, listInquiries, getInquiryPipeline } from './lib/inquiry-store';
import { browseDefaults } from '../src/lib/inquiries/admin-browse';

const mocks = vi.hoisted(() => ({ query: vi.fn(), user: vi.fn() }));
vi.mock('@neondatabase/serverless', () => ({ neon: () => ({ query: mocks.query }) }));
vi.mock('@netlify/identity', () => ({ getUser: mocks.user }));
let db: PGlite;
const input = { name: 'Delete Test', email: 'test@example.test', company: '', website: '', projectType: 'website', projectStage: 'new', projectSummary: 'A synthetic request for deletion tests.', helpNeeded: '', budgetRange: 'unsure', timeline: 'flexible' };
const request = (id: string, body: unknown, origin = 'https://example.test', method = 'DELETE') => new Request('https://example.test/api/admin/inquiries' + (id ? '?id=' + id : ''), {
  method, headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const call = (id: string, body: unknown, origin?: string, method?: string) => adminEndpoint(request(id, body, origin, method), { params: {} } as never);
async function inquiry() { return getInquiry(await createInquiry(input, randomUUID())); }
async function remove(id: string) { return call(id, { updatedAt: (await getInquiry(id)).updatedAt }); }
async function proposal(id: string) {
  const row = (await db.query<{id:string}>("INSERT INTO proposals(inquiry_id,title) VALUES($1,'Test proposal') RETURNING id", [id])).rows[0];
  await db.query("INSERT INTO proposal_items(proposal_id,position,description,quantity,unit_price_cents) VALUES($1,0,'Design',1,100)", [row.id]);
  return row.id;
}
async function message(id: string, status = 'failed', proposalId: string | null = null) {
  return (await db.query<{id:string}>(`INSERT INTO inquiry_messages(inquiry_id,from_email,reply_to_email,to_email,subject,message_text,body_text,body_html,template_key,request_key,payload_fingerprint,status,error_code,proposal_id,provider_message_id,sent_at)
    VALUES($1,'sender@example.test','sender@example.test','test@example.test','Test','Test','Test','Test','personal',$2,'test',$3,CASE WHEN $3='failed' THEN 'provider_rejected' END,$4,CASE WHEN $3='sent' THEN 'provider-test' END,CASE WHEN $3='sent' THEN clock_timestamp() END) RETURNING id`, [id,randomUUID(),status,proposalId])).rows[0].id;
}
async function link(id: string) {
  return (await db.query<{id:string}>("INSERT INTO booking_links(inquiry_id,token_hash,token_nonce,token_last_four) VALUES($1,$2,$3,'test') RETURNING id", [id,randomBytes(32).toString('hex'),randomBytes(32).toString('hex')])).rows[0].id;
}
async function counts() {
  const tables=['inquiries','inquiry_activity','inquiry_messages','proposals','proposal_items','booking_links','bookings','invoices','invoice_items'];
  return Object.fromEntries(await Promise.all(tables.map(async t=>[t,(await db.query<{count:number}>(`SELECT count(*)::int AS count FROM ${t}`)).rows[0].count])));
}
beforeAll(async () => {
  db = new PGlite();
  for (const file of readdirSync('database/migrations').filter(n=>n.endsWith('.sql')).sort()) await db.exec(readFileSync('database/migrations/'+file,'utf8'));
  await db.exec('CREATE TABLE deletion_guard_test(message_id uuid REFERENCES inquiry_messages(id) ON DELETE RESTRICT)');
},30_000);
afterAll(()=>db?.close());
afterEach(()=>vi.unstubAllEnvs());
beforeEach(async () => {
  await db.exec('TRUNCATE leads,deletion_guard_test,invoice_items,invoices,bookings,booking_links,inquiry_messages,proposal_items,proposals,inquiry_activity,inquiries');
  vi.resetAllMocks();vi.stubEnv('DATABASE_URL','postgresql://isolated-test-placeholder');
  mocks.user.mockResolvedValue({roles:['admin']});
  mocks.query.mockImplementation(async(sql:string,params:unknown[]=[]) => (await db.query(sql,params)).rows);
});

describe('permanent inquiry deletion',()=>{
  it('deletes a simple request and creation history; refreshed active/archive/search/counts exclude it',async()=>{
    const target=await inquiry(),other=await inquiry();
    const response=await remove(target.id);expect(response.status).toBe(200);expect(await response.json()).toEqual({deleted:true});
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(getInquiry(target.id)).rejects.toMatchObject({status:404});
    expect((await getInquiry(other.id)).email).toBe(target.email);
    for(const status of ['all','new','archived']) {
      const list=await listInquiries(status,'newest',1,{...browseDefaults(),search:'Delete Test'});
      expect(list.items.some(i=>i.id===target.id)).toBe(false);expect(list.metrics.total).toBe(1);
    }
    expect((await getInquiryPipeline()).items.map(i=>i.id)).toEqual([other.id]);
    expect((await db.query('SELECT * FROM inquiry_activity WHERE inquiry_id=$1',[target.id])).rows).toHaveLength(0);
  });
  it('deletes archived requests as well as their private notes and follow-ups',async()=>{
    const target=await inquiry();const noted=await updateInquiry(target.id,'archived','Private test notes',target.updatedAt);
    await updateFollowUp(target.id,new Date(Date.now()+86400000).toISOString(),'Test follow-up',noted.updatedAt);
    expect((await remove(target.id)).status).toBe(200);
    expect((await counts()).inquiries).toBe(0);expect((await counts()).inquiry_activity).toBe(0);
  });
  it('atomically deletes owned proposals/items, email history/activity, and unused booking links',async()=>{
    const target=await inquiry();const p=await proposal(target.id);const m=await message(target.id,'failed',p);
    await message(target.id,'sent',p);await link(target.id);
    await db.query("INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,message_id,note) VALUES($1,'email_failed','admin',$2,'Delivery failed')",[target.id,m]);
    expect((await remove(target.id)).status).toBe(200);
    expect(Object.values(await counts()).every(n=>n===0)).toBe(true);
  });
  it('preserves all related rows of another inquiry from the same email address',async()=>{
    const target=await inquiry(),other=await inquiry();await proposal(target.id);const p=await proposal(other.id);await message(other.id,'sent',p);await link(other.id);
    expect((await remove(target.id)).status).toBe(200);
    expect(await counts()).toMatchObject({inquiries:1,proposals:1,proposal_items:1,inquiry_messages:1,booking_links:1,inquiry_activity:1});
    expect((await getInquiry(other.id)).email).toBe(target.email);
  });
  it('rolls back earlier child deletes when an unexpected foreign-key relationship prevents cleanup',async()=>{
    const target=await inquiry(),p=await proposal(target.id),m=await message(target.id,'failed',p);await link(target.id);
    await db.query('INSERT INTO deletion_guard_test VALUES($1)',[m]);const before=await counts();
    const response=await remove(target.id);expect(response.status).toBe(409);expect(await counts()).toEqual(before);
    expect(await response.text()).not.toMatch(/deletion_guard_test|23503|postgres|DELETE FROM/);
  });
  it('preserves cross-request references instead of deleting another request’s communication',async()=>{
    const target=await inquiry(),other=await inquiry(),p=await proposal(target.id);
    await message(other.id,'sent',p);const before=await counts();
    expect((await remove(target.id)).status).toBe(409);expect(await counts()).toEqual(before);
  });
  it('rejects stale deletion without losing newly saved notes',async()=>{
    const target=await inquiry();await updateInquiry(target.id,'qualified','New notes',target.updatedAt);
    const response=await call(target.id,{updatedAt:target.updatedAt});expect(response.status).toBe(409);
    expect((await getInquiry(target.id)).adminNotes).toBe('New notes');
  });
  it('returns a safe not-found result for a deleted request and repeated submissions',async()=>{
    const target=await inquiry();const results=await Promise.all([call(target.id,{updatedAt:target.updatedAt}),call(target.id,{updatedAt:target.updatedAt})]);
    expect(results.map(r=>r.status).sort()).toEqual([200,404]);
    expect((await call(randomUUID(),{updatedAt:target.updatedAt})).status).toBe(404);
  });
  it('blocks in-flight email without deleting any related data',async()=>{
    const target=await inquiry();await message(target.id,'sending');const before=await counts();
    const response=await remove(target.id);expect(response.status).toBe(409);expect(await response.text()).toContain('still sending');expect(await counts()).toEqual(before);
  });
  it.each(['scheduled','cancelled','completed'])('preserves %s bookings and their parent request',async status=>{
    const target=await inquiry(),l=await link(target.id);
    await db.query(`INSERT INTO bookings(inquiry_id,link_id,booking_token_hash,status,meeting_type,start_at,end_at,busy_until,buffer_minutes,timezone,client_name,client_email,client_phone,request_key,payload_fingerprint,cancelled_at,completed_at)
      VALUES($1,$2,'test',$3,'phone','2030-01-01 15:00Z','2030-01-01 15:30Z','2030-01-01 15:30Z',0,'America/New_York','Test','test@example.test','5551234567',$4,'test',CASE WHEN $3='cancelled' THEN clock_timestamp() END,CASE WHEN $3='completed' THEN clock_timestamp() END)`,[target.id,l,status,randomUUID()]);
    const before=await counts(),response=await remove(target.id);expect(response.status).toBe(409);expect(await response.text()).toContain('booking');expect(await counts()).toEqual(before);
  });
  it('preserves invoices and invoice items with all related inquiry data',async()=>{
    const target=await inquiry(),p=await proposal(target.id);
    const inv=(await db.query<{id:string}>(`INSERT INTO invoices(inquiry_id,proposal_id,title,business_timezone,issue_date,client_name,client_email,sender_name,sender_email,sender_phone,sender_website,subtotal_cents,discount_cents,tax_rate_basis_points,tax_cents,total_cents)
      VALUES($1,$2,'Test invoice','America/New_York',CURRENT_DATE,'Test','test@example.test','Volatile Solutions','sender@example.test','5551234567','https://example.test',100,0,0,0,100) RETURNING id`,[target.id,p])).rows[0].id;
    await db.query("INSERT INTO invoice_items(invoice_id,position,description,quantity,unit_price_cents) VALUES($1,0,'Design',1,100)",[inv]);
    const before=await counts(),response=await remove(target.id);expect(response.status).toBe(409);expect(await response.text()).toContain('invoice');expect(await counts()).toEqual(before);
  });
  it.each([null,{roles:['client']}])('rejects unauthorized calls before SQL',async user=>{
    mocks.user.mockResolvedValue(user);
    const response=await call(randomUUID(),{updatedAt:new Date().toISOString()});expect(response.status).toBe(user?403:401);expect(mocks.query).not.toHaveBeenCalled();
  });
  it.each(['','invalid-id'])('rejects an invalid/missing request ID before SQL (%s)',async id=>{
    expect((await call(id,{updatedAt:new Date().toISOString()})).status).toBe(400);expect(mocks.query).not.toHaveBeenCalled();
  });
  it.each([{}, {updatedAt:'invalid'}, {updatedAt:new Date().toISOString(),cascade:true}])('rejects malformed or extra deletion parameters',async body=>{
    expect((await call(randomUUID(),body)).status).toBe(422);expect(mocks.query).not.toHaveBeenCalled();
  });
  it('rejects cross-origin deletion before SQL',async()=>{
    expect((await call(randomUUID(),{updatedAt:new Date().toISOString()},'https://attacker.test')).status).toBe(403);expect(mocks.query).not.toHaveBeenCalled();
  });
  it('returns a safe error for database failure, without fake success or raw errors',async()=>{
    const target=await inquiry();mocks.query.mockRejectedValueOnce(new Error('postgresql://secret/database'));
    const response=await call(target.id,{updatedAt:target.updatedAt});expect(response.status).toBe(503);expect(await response.text()).not.toMatch(/secret|deleted|postgresql/);
    expect((await getInquiry(target.id)).id).toBe(target.id);
  });
  it('leaves Archive as the existing status change with retained history and restore support',async()=>{
    const target=await inquiry();const response=await call(target.id,{status:'archived',adminNotes:'Keep this request',updatedAt:target.updatedAt},undefined,'PATCH');
    expect(response.status).toBe(200);const archived=await getInquiry(target.id);expect(archived.status).toBe('archived');
    expect((await listInquiries('archived','newest',1)).items.map(i=>i.id)).toContain(target.id);
    await updateInquiry(target.id,'new',archived.adminNotes,archived.updatedAt);expect((await getInquiry(target.id)).status).toBe('new');
  });
});
