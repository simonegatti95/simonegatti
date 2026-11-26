"""Genera le immagini realistiche del sito di Simone con Gemini (stessa chiave dei render di Libra).

Uso (dalla cartella sito-simone):
  zsh -ic 'python3 -I tools/genera_immagini.py --solo corpo,g1 --n 2'
Le immagini finiscono in tools/generate/<id>/vN.jpg; quelle scelte si copiano in assets/img/.
Un'immagine può usarne un'altra come riferimento (campo "rif"), per tenere la stessa persona.
"""
import argparse, base64, concurrent.futures, json, os, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), 'libra-render', 'tools'))
import genera_render as G  # chiave(), chiama(), modelli_immagine(), scegli_modello(), parte_img()


def genera(job, comune, modello, key, i):
    testo = job["prompt"] if job.get("senza_comune") else comune + "\n\n" + job["prompt"]
    parts = [{"text": testo}]
    for r in job.get("rif", []):
        parts.append({"text": "REFERENCE IMAGE: same person, same clothes, same light and setting. Keep the face, hair and outfit identical."})
        parts.append(G.parte_img(os.path.join(ROOT, r)))
    cfg = {"responseModalities": ["TEXT", "IMAGE"], "imageConfig": {"aspectRatio": job.get("aspect", "4:3")}}
    if "pro" in modello or "3" in modello:
        cfg["imageConfig"]["imageSize"] = "2K"
    body = {"contents": [{"role": "user", "parts": parts}], "generationConfig": cfg}
    for t in range(3):
        try:
            d = G.chiama(f"{G.API}/models/{modello}:generateContent", key, body); break
        except RuntimeError as e:
            if "imageSize" in str(e) and "imageSize" in cfg["imageConfig"]:
                cfg["imageConfig"].pop("imageSize"); continue
            if t == 2 or not any(c in str(e) for c in ("429", "500", "503", "504")): raise
            time.sleep(20 * (t + 1))
    dest = os.path.join(ROOT, "tools", "generate", job["id"]); os.makedirs(dest, exist_ok=True)
    out = []
    for c in d.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            b = p.get("inlineData") or p.get("inline_data")
            if b:
                f = os.path.join(dest, f"v{i}.jpg" if "jp" in b.get("mimeType", "") else f"v{i}.png")
                open(f, "wb").write(base64.b64decode(b["data"])); out.append(f)
    open(os.path.join(dest, f"v{i}.txt"), "w").write(f"modello: {modello}\n\n{testo}\n")
    if not out: raise RuntimeError(f"nessuna immagine: {d.get('promptFeedback') or [c.get('finishReason') for c in d.get('candidates', [])]}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo", default=""); ap.add_argument("--n", type=int, default=1); ap.add_argument("--da", type=int, default=0)
    a = ap.parse_args()
    key = G.chiave(); modello = G.scegli_modello(G.modelli_immagine(key))
    cfg = json.load(open(os.path.join(ROOT, "tools", "immagini.json"), encoding="utf-8"))
    jobs = [j for j in cfg["immagini"] if not a.solo or j["id"] in a.solo.split(",")]
    print("modello:", modello, "| immagini:", len(jobs), "x", a.n, flush=True)
    lav = [(j, a.da + k) for j in jobs for k in range(a.n)]
    with concurrent.futures.ThreadPoolExecutor(4) as ex:
        fut = {ex.submit(genera, j, cfg["comune"], modello, key, k): (j["id"], k) for j, k in lav}
        for f in concurrent.futures.as_completed(fut):
            try: print("ok", fut[f], f.result(), flush=True)
            except Exception as e: print("ERRORE", fut[f], str(e)[:300], flush=True)


if __name__ == "__main__":
    main()
