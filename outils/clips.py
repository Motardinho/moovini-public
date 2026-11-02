"""Prépare les clips animés des exercices du site (MP4 muets), à partir des vidéos de l'app.

Appelé par outils/generer.mjs avec un fichier JSON : [[source, destination, cadre, largeur de sortie], ...]. Le cadre est
un ratio (image centrée, comme outils/vignettes.py) ou [x, y, largeur, hauteur] en part de la source, de 0 à 1.
Le clip garde toute la vidéo, qui boucle, et commence à l'instant de l'image fixe qu'il remplace
(contenu/vignettes-instants.json, sinon 40 % de la durée) : le passage de l'image à la vidéo ne se voit pas. Après un
changement d'instant, supprimer le clip pour que le générateur le refasse.
"""
import json
import pathlib
import subprocess
import sys


INSTANTS = json.load(open(pathlib.Path(__file__).resolve().parents[1] / "contenu" / "vignettes-instants.json", encoding="utf-8"))


def pair(valeur):
    return int(round(valeur / 2)) * 2


for source, destination, cadre, largeur in json.load(open(sys.argv[1], encoding="utf-8")):
    sonde = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", source],
                           capture_output=True, text=True, check=True)
    infos = json.loads(sonde.stdout)
    W, H = infos["streams"][0]["width"], infos["streams"][0]["height"]
    duree = float(infos["format"]["duration"])
    instant = INSTANTS.get(pathlib.Path(source).name, duree * 0.4)
    if isinstance(cadre, list):
        cl, ch = min(pair(cadre[2] * W), W), min(pair(cadre[3] * H), H)
        cx, cy = min(pair(cadre[0] * W), W - cl), min(pair(cadre[1] * H), H - ch)
    else:
        # Mêmes arrondis que outils/vignettes.py, pour que le clip tombe sur l'image fixe.
        ch = min(H, round(W / cadre))
        cl = round(ch * cadre)
        cx, cy = (W - cl) // 2, (H - ch) // 2
    # La fin de la vidéo d'abord, puis son début : même boucle, mais la première image est celle de la photo.
    filtre = (f"[0:v]crop={cl}:{ch}:{cx}:{cy},split[a][b];[a]trim=start={instant:.3f},setpts=PTS-STARTPTS[fin];[b]trim=end={instant:.3f},setpts=PTS-STARTPTS[debut];"
              f"[fin][debut]concat=n=2:v=1,scale={pair(largeur)}:-2:flags=lanczos,format=yuv420p[v]")
    pathlib.Path(destination).parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", source, "-filter_complex", filtre, "-map", "[v]", "-an", "-c:v", "libx264", "-profile:v", "main",
                    "-preset", "veryslow", "-crf", "30", "-movflags", "+faststart", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", destination], check=True)
print("clips prêts")
