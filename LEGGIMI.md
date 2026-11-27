# Sito di Simone Gatti

Sito personale di Simone Gatti, chinesiologo a Libra, Pietrasanta. Fase 1: home in stile "vetro" (adattato da Glassy UI), testi veri e foto di Libra. Nessun login.

## File

- `index.html`: la pagina, con le tappe (Chi sono, Il metodo, I gesti, Libra, Storie, Domande, Prenota).
- `assets/css/sito.css`: colori del brand (verde foresta, crema, oro) e impaginazione.

- `assets/js/sito.js`: comparsa delle sezioni e link WhatsApp. **Il numero della segreteria va inserito qui** (`NUMERO`).
- `assets/img/`: foto di Libra (dal sito di Libra, da usare con l'accordo di Silvia).
- `assets/video/`: il video dell'apertura (corsa che diventa squat), fatto con l'AI: `apertura-16x9.mp4` per il computer, `apertura-9x16.mp4` per il telefono. I testi compaiono al secondo scritto in `data-pronto` (in `index.html`). Si rigenera con `tools/genera_video.py` (Gemini Omni Flash, si paga a secondo di video) partendo dalle immagini di `tools/immagini.json`, poi si comprime con ffmpeg.

## Segnaposto da completare

- Due righe sulla storia di Simone (sezione Chi sono).
- Numero WhatsApp della segreteria (`assets/js/sito.js`).
- Storie dei clienti, quando ci sono, con il consenso.

## Prossime fasi

2. Registrazione e pacchetti protetti con Supabase. 3. Richieste di appuntamento e pannello di Simone. 4. I gesti della longevità. 5. Dominio e privacy.
