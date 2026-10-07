# AI HR Department™ — Live Demo V3

A deliberately silly authorised workplace experiment that monitors an approved AI interaction stream for basic manners and can escalate serious offences to HR.

## What is new
- Live-looking authorised AI feed with connect/disconnect state.
- Simulated message stream that triggers the manners engine in real time.
- Escalation states: reminder → HR draft → Level 5 cat + HR.
- Clear workplace-authorisation statement explaining that production monitoring requires organisational approval.
- Real backend HR email endpoint remains protected by `DEMO_TOKEN` and server-side email credentials.

## Deploy
Use the included `render.yaml` with a connected Git repository on Render, or deploy the Node web service manually.

Required environment variables:
- `RESEND_API_KEY`
- `DEMO_TOKEN`
- `HR_EMAIL`
- `FROM_EMAIL`

Optional:
- `CAT_URL`

Never put the Resend API key or demo token in the frontend.
