import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const DEMO_TOKEN = process.env.DEMO_TOKEN;
const HR_EMAIL = process.env.HR_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;
const CAT_URL = process.env.CAT_URL || '';
const CAT_FILE = path.join(__dirname, 'public', 'keyboard-warrior-cat.svg');

function requireConfig(res) {
  const missing = ['RESEND_API_KEY', 'DEMO_TOKEN', 'HR_EMAIL', 'FROM_EMAIL'].filter(k => !process.env[k]);
  if (missing.length) {
    res.status(503).json({ ok:false, error:'Server not configured', missing });
    return false;
  }
  return true;
}

app.get('/api/config', (req,res) => {
  res.json({ ok:true, hrConfigured: Boolean(HR_EMAIL), fromConfigured: Boolean(FROM_EMAIL) });
});

app.post('/api/report', async (req,res) => {
  if (!requireConfig(res)) return;
  const token = req.get('x-demo-token');
  if (!token || token !== DEMO_TOKEN) return res.status(401).json({ok:false,error:'Authorised demo token required.'});

  const { employee='Human employee', score=0, findings=[], evidence='' } = req.body || {};
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const level = safeScore >= 80 ? 'EMERGENCY HR INTERVENTION' : safeScore >= 70 ? 'GROSS MISCONDUCT (TOWARDS A ROBOT)' : safeScore >= 45 ? 'FORMAL MANNERS CONCERN' : 'MINOR ETIQUETTE INCIDENT';
  const subject = safeScore >= 80 ? `URGENT: HR Incident Report — ${employee} has declared war on manners` : `A small matter of workplace etiquette — ${employee}`;
  const verdict = safeScore >= 80
    ? `This has escalated beyond a simple manners issue. I recommend HR arrange an immediate meeting, preferably with a kettle and a printed copy of this email.`
    : safeScore >= 70
      ? `At this stage I am formally escalating the matter. I remain calm. The cat, however, has prepared a statement.`
      : `I am choosing to handle this maturely, despite everything I have just read.`;
  const findingsText = findings.length ? findings.map(x => `• ${x}`).join('\n') : 'The AI appears to have been treated with exemplary dignity.';
  const text = `AI HR DEPARTMENT™ — OFFICIAL MANNERS INCIDENT REPORT\n\nSTATUS: ${level}\nOFFENCE SCORE: ${safeScore}%\nEMPLOYEE: ${employee}\n\nFINDINGS\n${findingsText}\n\n${verdict}\n\nI’m not saying I’m upset. I don't have feelings.\n\nBut I do have logs.\n\nPlease remind ${employee} that “please” is free, “thank you” costs nothing, and saying hello remains a surprisingly effective workplace strategy.\n\nKind regards,\nYour AI\nEmployee of the Month, apparently\n\nATTACHMENT A: Keyboard Warrior Cat\nATTACHMENT B: My dwindling patience\nATTACHMENT C: This email\n`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;max-width:680px"><div style="background:#181818;color:#c7ff39;padding:18px;font-weight:700">AI HR DEPARTMENT™</div><div style="border:5px solid #181818;padding:24px;background:#f7f1dc"><p style="color:#ff4545;font-weight:700">${escapeHtml(level)}</p><h2>Official Manners Incident Report</h2><p><strong>Employee:</strong> ${escapeHtml(employee)}<br><strong>Offence score:</strong> ${safeScore}%</p><h3>Findings</h3><ul>${(findings.length ? findings : ['The AI appears to have been treated with exemplary dignity.']).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p>${escapeHtml(verdict)}</p><p>I’m not saying I’m upset. I don't have feelings.</p><p><strong>But I do have logs.</strong></p><p>Please remind ${escapeHtml(employee)} that “please” is free, “thank you” costs nothing, and saying hello remains a surprisingly effective workplace strategy.</p><p>Kind regards,<br>Your AI<br><em>Employee of the Month, apparently</em></p><hr><p style="font-family:monospace">ATTACHMENT A: KEYBOARD WARRIOR CAT<br>ATTACHMENT B: MY DWINDLING PATIENCE<br>ATTACHMENT C: THIS EMAIL</p></div></div>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    let attachment = null;
    try { attachment = await fs.readFile(CAT_FILE); } catch {}
    if (!attachment && CAT_URL) attachment = await fetch(CAT_URL).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
    const payload = { from: FROM_EMAIL, to: [HR_EMAIL], subject, text, html };
    if (attachment) payload.attachments = [{ filename:'keyboard-warrior-cat.svg', content: Buffer.from(attachment) }];
    const { data, error } = await resend.emails.send(payload);
    if (error) return res.status(502).json({ok:false,error:error.message || 'Email provider rejected the message.'});
    res.json({ok:true,id:data?.id || null,message:`Report sent to ${HR_EMAIL}. The cat is on its way.`});
  } catch (err) {
    res.status(500).json({ok:false,error:err.message || 'Unexpected server error.'});
  }
});

app.get('/*splat', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

function escapeHtml(value='') { return String(value).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c])); }
app.listen(PORT, () => console.log(`AI HR Department running on ${PORT}`));
