import bcrypt from 'bcryptjs'; import { pool, q } from './db.js';
const cats: [string, string[]][] = [['Healthcare', ['Dental clinics', 'General physicians']], ['Personal Care', ['Salons', 'Spa services']], ['Education', ['Tutors']],
  ['Professional Services', ['Legal consultations']], ['Vehicle Services', ['Car servicing']], ['Home Services', ['Plumbing']], ['Fitness and Wellness', ['Personal trainers']], ['Other Services', []]];
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) { console.error('Refusing to seed: this creates demo accounts with a known password. Set ALLOW_SEED=1 only if you really mean it.'); process.exit(1); }
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-');
if ((await q('SELECT 1 FROM users LIMIT 1')).length) { console.log('already seeded'); process.exit(0); }
for (const [n, kids] of cats) { const [p] = await q('INSERT INTO service_categories(name,slug) VALUES($1,$2) RETURNING id', [n, slug(n)]);
  for (const k of kids) await q('INSERT INTO service_categories(name,slug,parent_id) VALUES($1,$2,$3)', [k, slug(k), p.id]); }
const pw = await bcrypt.hash('demo1234', 10);
const mk = async (e: string, n: string, r: string) => (await q('INSERT INTO users(email,password_hash,name,role) VALUES($1,$2,$3,$4) RETURNING id', [e, pw, n, r]))[0].id;
await mk('customer@demo.test', 'Demo Customer', 'customer'); await mk('admin@demo.test', 'Demo Admin', 'admin');
const po = await mk('provider@demo.test', 'Demo Dentist', 'provider');
const [p] = await q(`INSERT INTO providers(owner_id,name,city,address,verified,lat,lng) VALUES($1,'SAMPLE Smile Dental Clinic','Bengaluru','Sample address',true,12.7094,77.6984) RETURNING id`, [po]);
const [c] = await q(`SELECT id FROM service_categories WHERE slug='dental-clinics'`);
const [s] = await q(`INSERT INTO services(provider_id,category_id,name,duration_min,buffer_min,price_cents,allow_guest) VALUES($1,$2,'Dental checkup',30,10,50000,false) RETURNING id`, [p.id, c.id]);
const [st] = await q(`INSERT INTO staff(provider_id,name) VALUES($1,'Dr. Sample') RETURNING id`, [p.id]);
await q('INSERT INTO staff_services VALUES($1,$2)', [st.id, s.id]);
for (let d = 0; d <= 6; d++) await q(`INSERT INTO availability_rules(staff_id,weekday,start_time,end_time) VALUES($1,$2,'09:00','17:00')`, [st.id, d]);
const more: [string, string, string, boolean, string, [string, number, number, number][], string[], boolean, string, number, number][] = [
  ['SAMPLE Urban Cuts Salon', 'Bengaluru', 'salons', true, 'provider2@demo.test', [['Haircut', 30, 35000, 4], ['Head spa', 60, 90000, 6]], ['Asha', 'Ravi'], true, 'Sample address', 12.7107, 77.6996],
  ['SAMPLE Bright Minds Tutors', 'Anekal', 'tutors', false, 'provider3@demo.test', [['Maths tutoring (1 hr)', 60, 60000, 12]], ['Meera'], true, 'Sample address', 12.7106, 77.7007],
  ['SAMPLE QuickFix Auto Care', 'Bengaluru', 'car-servicing', true, 'provider4@demo.test', [['Bike service', 90, 80000, 6]], ['Bay 1', 'Bay 2'], true, 'Sample address', 12.7212, 77.703],
  ['SAMPLE FitLife Trainers', 'Bengaluru', 'personal-trainers', true, 'provider5@demo.test', [['Personal training', 60, 70000, 12]], ['Kiran'], true, 'Sample address', 12.7131, 77.6993],
  ['SAMPLE Clearpath Legal', 'Bengaluru', 'legal-consultations', false, 'provider6@demo.test', [['Legal consultation', 45, 150000, 24]], ['Adv. Nair'], false, 'Sample address', 12.7105, 77.6989]];
for (const [name, city, cat, verified, email, svcs, staffNames, guest, addr, lat, lng] of more) {
  const owner = await mk(email, name.replace('SAMPLE ', '') + ' Owner', 'provider');
  const [pr] = await q('INSERT INTO providers(owner_id,name,city,address,verified,lat,lng) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id', [owner, name, city, addr, verified, lat, lng]);
  const [cc] = await q('SELECT id FROM service_categories WHERE slug=$1', [cat]);
  const sids: string[] = [];
  for (const [sn, dur, price, cancel] of svcs) sids.push((await q('INSERT INTO services(provider_id,category_id,name,duration_min,buffer_min,price_cents,cancel_hours_before,allow_guest) VALUES($1,$2,$3,$4,10,$5,$6,$7) RETURNING id', [pr.id, cc.id, sn, dur, price, cancel, guest]))[0].id);
  for (const stn of staffNames) { const [sf] = await q('INSERT INTO staff(provider_id,name) VALUES($1,$2) RETURNING id', [pr.id, stn]);
    for (const sid of sids) await q('INSERT INTO staff_services VALUES($1,$2)', [sf.id, sid]);
    for (let d = 0; d <= 6; d++) await q(`INSERT INTO availability_rules(staff_id,weekday,start_time,end_time) VALUES($1,$2,'09:00','17:00')`, [sf.id, d]); } }
console.log('seeded (sample data — not for production)'); await pool.end();
