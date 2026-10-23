"""Prépare les images des fiches exercices du site (WebP, 480 px de large au plus), à partir des fichiers de l'app.

Appelé par outils/generer.mjs avec un fichier JSON : [[source, destination, ratio], ...] ; ratio 1 pour un carré,
1,5 pour les variantes au sol (personne allongée).
- Vidéo (.mp4) : image prise à 40 % de la durée, cadre centré sur la personne (les vidéos sont en 21:9, personne au
  centre), réduit à 480 px de large.
- Image : cadre centré, gardé à sa taille si elle est plus petite (pas d'agrandissement flou).
"""
import json
import pathlib
import subprocess
import sys
import tempfile

from PIL import Image


def image_de_video(source):
    duree = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", source],
                                 capture_output=True, text=True, check=True).stdout.strip())
    with tempfile.TemporaryDirectory() as dossier:
        sortie = pathlib.Path(dossier) / "image.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{duree * 0.4:.2f}", "-i", source, "-frames:v", "1", str(sortie)], check=True)
        return Image.open(sortie).convert("RGB")


for source, destination, ratio in json.load(open(sys.argv[1], encoding="utf-8")):
    image = image_de_video(source) if source.lower().endswith(".mp4") else Image.open(source).convert("RGB")
    hauteur = min(image.height, round(image.width / ratio))
    largeur = round(hauteur * ratio)
    x, y = (image.width - largeur) // 2, (image.height - hauteur) // 2
    image = image.crop((x, y, x + largeur, y + hauteur))
    if largeur > 480:
        image = image.resize((480, round(480 / ratio)), Image.LANCZOS)
    pathlib.Path(destination).parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=80, method=6)
print("images des fiches prêtes")
