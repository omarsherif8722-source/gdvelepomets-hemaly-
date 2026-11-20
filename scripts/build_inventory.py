#!/usr/bin/env python3
"""Build data/inventory.json from G Developments "Primary ATS" Excel exports.

Usage (needs openpyxl:  pip install openpyxl):
    python3 scripts/build_inventory.py ~/Downloads/"Primary ATS"*.xlsx

Drop every new ATS export on the command line. When two files cover the same
project report (e.g. two dates of "Seashell Playa - Phase 2"), the newest
"As of" date wins. The site reads data/inventory.json on load, so a rebuild +
push is all it takes to refresh live availability.
"""
import json
import re
import sys
import warnings
from datetime import datetime
from pathlib import Path

import openpyxl

warnings.filterwarnings("ignore")

OUT = Path(__file__).resolve().parent.parent / "data" / "inventory.json"

# ATS phase -> (project id, display phase, payment plan id from data/payment_terms.json)
PHASES = {
    "NEWKAIRO GOLF VIEWS": ("newkairo", "Golf Views", "nk-golf"),
    "NEWKAIRO NEON VIEWS 01": ("newkairo", "Neon Views 01", "nk-neon"),
    "NEWKAIRO NEON VIEWS 02": ("newkairo", "Neon Views 02", "nk-neon"),
    "NEWKAIRO URBAN LIVING": ("newkairo", "Urban Living", "nk-urban"),
    "NEWKAIRO URBAN LIVING 03": ("newkairo", "Krypton", "nk-krypton"),
    "Ivy Phase 1": ("ivy", "IVY Phase 1", "ivy"),
    "Ivy Phase 2": ("ivy", "IVY Phase 2", "ivy"),
    "DISTRICT ONE": ("newgiza", "District One", "ng-cash"),
    "KINGSRANGE PHASE 2": ("newgiza", "Kingsrange Phase 2", "ng-cash"),
    "WESTRIDGE": ("newgiza", "Westridge", "ng-cash"),
    "ARTLIFE PHASE 1": ("newgiza", "Artlife · Pixel Labs", "al-pixel"),
    "SUDOKU": ("newgiza", "Artlife · Sudoku", "al-pixel"),
    "PLAYA PHASE 1/A": ("playa", "Phase 1A", "pl-1ae"),
    "PLAYA PHASE 1/B": ("playa", "Phase 1B", "pl-1ae"),
    "PLAYA PHASE 1/C": ("playa", "Phase 1C", "pl-1ae"),
    "PLAYA PHASE 1/D": ("playa", "Phase 1D", "pl-1ae"),
    "PLAYA PHASE 1/E": ("playa", "Phase 1E", "pl-1ae"),
    "PLAYA PHASE 1/F": ("playa", "Phase 1F", "pl-1f"),
    "PLAYA PHASE 2A": ("playa", "Phase 2A", "pl-2a"),
    "PLAYA PHASE 2B": ("playa", "Phase 2B", "pl-2b"),
    "G VILLAGE PHASE 2": ("playa", "G Village 2", "pl-gvillage"),
    "G VILLAGE PHASE 3": ("playa", "G Village 3", "pl-gvillage"),
    "PLAYA CABINS": ("playa", "Playa Cabins", "pl-cabins"),
    "G RESIDENCE": ("seashell-rah", "G Residence", "sr-gres"),
    "G VILLAS": ("seashell-rah", "G Villas", "sr-gvillas"),
    "LAGOON VIEW": ("seashell-rah", "Lagoon View", "sr-lagoon"),
    "LAGOON VIEW 02": ("seashell-rah", "Lagoon View 02", "sr-lagoon2"),
    "SEASHELL RAS EL HEKMA 01/C": ("seashell-rah", "Phase 01/C", "sr-p12"),
    "SEASHELL RAS EL HEKMA 01X/B": ("seashell-rah", "Phase 01X/B", "sr-p12"),
    "SEASHELL RAS EL HEKMA 01Y/B": ("seashell-rah", "Phase 01Y/B", "sr-p12"),
    "SEASHELL RAS EL HEKMA 02/B": ("seashell-rah", "Phase 02/B", "sr-p12"),
    "SEASHELL RAS EL HEKMA 02/X": ("seashell-rah", "Phase 02/X", "sr-p12"),
    "SEASHELL RAS EL HEKMA CABIN": ("seashell-rah", "G Cabanas", "sr-cabins"),
}

PROJECTS = {
    "newkairo": "NEWKAIRO",
    "ivy": "IVY",
    "newgiza": "NEWGIZA",
    "playa": "Playa",
    "seashell-rah": "Seashell Ras El Hekma",
}

STATUS = {
    "Available": "available",
    "Hold": "hold",
    "Requested Ready for Reservation": "requested",
    "Ready for Reservation": "ready",
}


def title_case(s):
    if not s:
        return ""
    s = str(s).strip()
    keep = {"G", "TH", "SAV", "II", "III"}
    out = []
    for w in s.split():
        if w in keep or re.fullmatch(r"[A-Z]?\d+[A-Z]?", w):
            out.append(w)
        else:
            out.append(w.capitalize())
    return " ".join(out).replace("Twinvilla", "Twin Villa").replace("Townhome-p", "Townhome + Penthouse").replace("Twin Villa-p", "Twin Villa + Penthouse").replace("Townhome-apt", "Townhome Apartment")


def num(v):
    if v in (None, "", "NA", "N/A"):
        return None
    try:
        f = float(v)
        return int(f) if f.is_integer() else round(f, 2)
    except (TypeError, ValueError):
        return None


def parse(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    rows = list(wb.worksheets[0].iter_rows(values_only=True))
    title = next((c for r in rows[:4] if r for c in r if c and str(c).startswith("Primary ATS")), path.stem)
    asof_raw = next((c for r in rows[:5] if r for c in r if c and str(c).startswith("As of")), "")
    m = re.search(r"(\d{4}-\d{2}-\d{2})", asof_raw)
    asof = m.group(1) if m else ""
    hi = next(i for i, r in enumerate(rows) if r and any(c and str(c).strip() == "Sub Status" for c in r))
    cols = {i: re.sub(r"\s*↑", "", str(c)).strip() for i, c in enumerate(rows[hi]) if c}
    units, last = [], {}
    for r in rows[hi + 1:]:
        if not r or all(c is None for c in r):
            continue
        d = {name: (r[i] if i < len(r) else None) for i, name in cols.items()}
        for k in ("Phase", "Unit Type"):
            if d.get(k) in (None, ""):
                d[k] = last.get(k)
            else:
                last[k] = d[k]
        num_cell = str(d.get("Unit: Unit Number") or "").strip()
        if not num_cell or any(str(v).strip() in ("Subtotal", "Total") for v in r if v is not None):
            continue
        if num_cell.startswith(("Subtotal", "Total", "Count")):
            continue
        units.append(d)
    return str(title), asof, units


def main(paths):
    reports = {}
    for p in map(Path, paths):
        title, asof, units = parse(p)
        if title not in reports or asof > reports[title][0]:
            reports[title] = (asof, units, p.name)

    fields = ["project", "phase", "plan", "type", "unit", "beds", "floor", "bua", "land", "garden", "price", "finishing", "status", "view"]
    out_units, asof_by_project, skipped = [], {}, set()
    for title, (asof, units, fname) in sorted(reports.items()):
        for d in units:
            ph = str(d["Phase"]).strip()
            if ph not in PHASES:
                skipped.add(ph)
                continue
            pid, phase, plan = PHASES[ph]
            asof_by_project[pid] = max(asof_by_project.get(pid, ""), asof)
            beds_raw = str(d.get("Number of Beds") or "").strip()
            beds = num(re.sub(r"\D.*", "", beds_raw)) if beds_raw[:1].isdigit() else None
            floor = d.get("Floor")
            floor = None if floor in (None, "N/A", "NA") else title_case(floor)
            garden = num(d.get("Garden Area")) if d.get("Garden") else None
            view = d.get("Location")
            view = None if view in (None, "N/A", "NA", "FALSE", False) else title_case(view)
            bua = num(d.get("Gross BUA (SQM)") or d.get("Total BUA (SQM)"))
            out_units.append([
                pid, phase, plan, title_case(d.get("Unit Type")), str(d["Unit: Unit Number"]).strip(),
                beds, floor, bua, num(d.get("Land Area")) or None, garden or None,
                num(d.get("Total Unit Price")), title_case(d.get("Finishing Type")) or None,
                STATUS.get(str(d.get("Sub Status")).strip(), "available"), view,
            ])

    data = {
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "source": "G Developments Primary ATS exports",
        "projects": {pid: {"name": PROJECTS[pid], "asOf": asof_by_project.get(pid, "")} for pid in PROJECTS if pid in asof_by_project},
        "fields": fields,
        "units": out_units,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    print(f"Wrote {len(out_units)} units to {OUT}")
    for t, (a, u, f) in sorted(reports.items()):
        print(f"  {t}: {len(u)} rows as of {a} ({f})")
    if skipped:
        print("  Skipped unknown phases (add them to PHASES):", ", ".join(sorted(skipped)))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
