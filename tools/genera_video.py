"""Genera il video dell'apertura con Gemini Omni Flash (stessa chiave delle immagini).

Uso (dalla cartella sito-simone):
  zsh -ic 'python3 -I tools/genera_video.py --solo ap_video_uomo --n 2'
Ogni video parte dalla prima immagine e finisce sulla seconda (campi "inizio" e "fine" in
tools/video.json). I video finiscono in tools/generate/<id>/vN.mp4, con il testo usato in vN.txt.
Omni si paga a secondo di video: controllare il listino prima di lanciare più tentativi.
"""
import argparse, base64, concurrent.futures, json, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), 'libra-render', 'tools'))
import genera_render as G  # chiave(), chiama()

MODELLO = "gemini-omni-1.2-flash"


def immagine(path):
    return {"type": "image", "mime_type": "image/jpeg",
            "data": base64.b64encode(open(os.path.join(ROOT, path), "rb").read()).decode()}


def trova_video(d):
    for s in d.get("steps", []):
        if s.get("type") != "model_output":
            continue
        for c in s.get("content", []):
            if c.get("type") == "video":
                return c
    return None


def scarica(uri, key, dest):
    file_id = uri.split("/files/", 1)[1].split(":", 1)[0]
    for _ in range(60):
        stato = G.chiama(f"{G.API}/files/{file_id}", key).get("state")
        if stato == "ACTIVE":
            break
        if stato == "FAILED":
            raise RuntimeError("il file del video è FAILED")
        time.sleep(5)
    req = urllib.request.Request(f"{G.API}/files/{file_id}:download?alt=media", headers={"x-goog-api-key": key})
    with urllib.request.urlopen(req, timeout=300) as r:
        open(dest, "wb").write(r.read())


def genera(job, key, i):
    body = {"model": MODELLO,
            "input": [immagine(job["inizio"]), immagine(job["fine"]), {"type": "text", "text": job["prompt"]}],
            "response_format": {"type": "video", "aspect_ratio": job.get("aspect", "16:9"),
                                "duration": job.get("durata", "8s"), "resolution": job.get("risoluzione", "1080p"),
                                "delivery": "uri"}}
    d = G.chiama(f"{G.API}/interactions", key, body, timeout=900)
    v = trova_video(d)
    if not v:
        raise RuntimeError(f"nessun video: {json.dumps({k: d.get(k) for k in ('status', 'id')})} {str(d)[:400]}")
    dest_dir = os.path.join(ROOT, "tools", "generate", job["id"]); os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, f"v{i}.mp4")
    if v.get("data"):
        open(dest, "wb").write(base64.b64decode(v["data"]))
    else:
        scarica(v["uri"], key, dest)
    open(os.path.join(dest_dir, f"v{i}.txt"), "w").write(
        f"modello: {MODELLO}\ninizio: {job['inizio']}\nfine: {job['fine']}\n\n{job['prompt']}\n")
    return dest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo", default=""); ap.add_argument("--n", type=int, default=1); ap.add_argument("--da", type=int, default=0)
    a = ap.parse_args()
    key = G.chiave()
    cfg = json.load(open(os.path.join(ROOT, "tools", "video.json"), encoding="utf-8"))
    jobs = [j for j in cfg["video"] if not a.solo or j["id"] in a.solo.split(",")]
    for j in jobs:
        j["prompt"] = cfg["comune"] + "\n\n" + j.get("prompt", "")
    print("modello:", MODELLO, "| video:", len(jobs), "x", a.n, flush=True)
    lav = [(j, a.da + k) for j in jobs for k in range(a.n)]
    with concurrent.futures.ThreadPoolExecutor(2) as ex:
        fut = {ex.submit(genera, j, key, k): (j["id"], k) for j, k in lav}
        for f in concurrent.futures.as_completed(fut):
            try: print("ok", fut[f], f.result(), flush=True)
            except Exception as e: print("ERRORE", fut[f], str(e)[:600], flush=True)


if __name__ == "__main__":
    main()
