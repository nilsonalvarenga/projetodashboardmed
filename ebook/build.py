#!/usr/bin/env python3
"""Render magnetismo-pessoal.html -> PDF via Chromium, fill TOC page numbers,
add a PDF outline (bookmarks). Usage: python3 build.py [--preview p1,p2,...]"""
import os, sys, subprocess, tempfile, re, json

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
HTML = os.path.join(HERE, "magnetismo-pessoal.html")
OUT  = os.path.join(HERE, "Como-Se-Tornar-um-Ima-David-Bayer.pdf")

# Markers: unique, single-line strings that appear on each section's opener page.
# (Chapter openers carry a unique timestamp badge; front matter is skipped.)
MARKERS = {
    "intro": "realidade é generosa",
    "cap1":  "16:30",
    "cap2":  "22:28",
    "cap3":  "05:48",
    "cap4":  "50:51",
    "cap5":  "1:09:54",
    "cap6":  "Torne-se o Ímã",
    "kit":   "Kit de Ferramentas",
}
# Outline (bookmark) structure: (title, marker-key, level)
OUTLINE = [
    ("Introdução — A realidade é generosa", "intro", 1),
    ("1 · A Equação de Ouro", "cap1", 1),
    ("2 · Estados Primais e Estados Poderosos", "cap2", 1),
    ("3 · A Ferida Central da Infância", "cap3", 1),
    ("4 · Vícios, Sofrimento e a Arte da Entrega", "cap4", 1),
    ("5 · Crenças São Decisões", "cap5", 1),
    ("6 · Torne-se o Ímã (Plano de 30 dias)", "cap6", 1),
    ("Kit de Ferramentas Rápidas", "kit", 1),
]

def render(html_path, pdf_path):
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
        "--print-to-pdf=" + pdf_path, "--no-pdf-header-footer",
        "file://" + html_path], check=True,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def find_pages(pdf_path):
    import fitz
    doc = fitz.open(pdf_path)
    # Determine where front matter ends: the last page containing "Sumário".
    toc_idx = 0
    for i in range(min(doc.page_count, 10)):
        if doc[i].search_for("Sumário"):
            toc_idx = i
    # The FIRST occurrence of a marker AFTER the TOC page is the section opener.
    pos = {}
    for key, txt in MARKERS.items():
        found = None
        for i in range(toc_idx + 1, doc.page_count):
            if doc[i].search_for(txt):
                found = i + 1  # 1-based physical page == displayed folio
                break
        pos[key] = found
    doc.close()
    return pos

def fill_toc(html, pos):
    for key, pg in pos.items():
        if pg is None:
            continue
        html = re.sub(r'(<span class="pg" data-pg="%s">)\d+(</span>)' % re.escape(key),
                      r'\g<1>%d\g<2>' % pg, html)
    return html

def add_outline(pdf_path, pos):
    import fitz
    doc = fitz.open(pdf_path)
    toc = []
    for title, key, lvl in OUTLINE:
        pg = pos.get(key)
        if pg:
            toc.append([lvl, title, pg])
    # front bookmarks
    toc = [[1, "Capa", 1], [1, "Sumário", None]] + toc
    # resolve Sumário page by searching
    for i in range(doc.page_count):
        if doc[i].search_for("Sumário"):
            toc[1][2] = i + 1
            break
    if toc[1][2] is None:
        toc[1][2] = 1
    doc.set_toc(toc)
    doc.set_metadata({
        "title": "Como Se Tornar um Ímã para o que Você Deseja",
        "author": "Síntese dos ensinamentos de David Bayer",
        "subject": "Desenvolvimento pessoal — transformação de crenças e estados",
        "keywords": "David Bayer, Lewis Howes, magnetismo, crenças, manifestação",
    })
    doc.saveIncr()
    doc.close()

def main():
    preview = None
    if "--preview" in sys.argv:
        preview = sys.argv[sys.argv.index("--preview") + 1].split(",")
    html = open(HTML, encoding="utf-8").read()
    # pass 1 (temp html, unfilled TOC) to locate pages
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=HERE, delete=False, encoding="utf-8") as f:
        f.write(html); tmp = f.name
    try:
        render(tmp, OUT)
        pos = find_pages(OUT)
        print("section pages:", json.dumps(pos, ensure_ascii=False))
        # pass 2: fill TOC and re-render final
        html2 = fill_toc(html, pos)
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(html2)
        render(tmp, OUT)
        try:
            add_outline(OUT, pos)
        except Exception as e:
            print("outline skipped:", e)
    finally:
        os.remove(tmp)
    # report
    import fitz
    doc = fitz.open(OUT)
    print("PAGES:", doc.page_count, "SIZE:", os.path.getsize(OUT)//1024, "KB")
    if preview:
        for p in preview:
            i = int(p) - 1
            if 0 <= i < doc.page_count:
                pix = doc[i].get_pixmap(dpi=130)
                out = os.path.join(HERE, "_preview_%02d.png" % (i+1))
                pix.save(out); print("preview", out)
    doc.close()

if __name__ == "__main__":
    main()
