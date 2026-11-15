# AgroShift — Rotation Rescue Engine

**Banger Duo | NASA Space Apps Challenge 2026 | Field Shift**

**Interactive project:** https://agroshift-resilience.vercel.app/

**Seven-slide public presentation:** https://agroshift-resilience.vercel.app/demo.html

An explainable crop-rotation *repair* proof of concept. Instead of ranking unrelated crops, AgroShift starts from the farmer's existing four-season plan, diagnoses modeled water-budget violations, and finds the fewest crop substitutions satisfying encoded constraints.

## What has actually been demonstrated

- Exhaustive evaluation of **256** four-season candidate rotations (4 crop choices for each of four seasons).
- Minimum substitution count under the **encoded** season, simplified water, and crop-family constraints.
- Explicit failure reasons and honest no-feasible-option outcomes.
- Synthetic regression tests and GitHub Actions CI.
- A public interactive UI and a **seven-slide** browser presentation at `/demo.html`.
- A successful **real NASA POWER retrieval and verification workflow**, linked below.

## Verified NASA POWER data

**Workflow:** https://github.com/aadi-harale/nasaspaceappschallenge/actions/runs/43730283559

**Evidence artifact:** `nasa-power-provenance` in the workflow's Artifacts section. The workflow fetched and validated **1,096** daily precipitation observations for **18.52 N, 73.85 E**, from **2022-01-01** to **2024-12-31**.

- Parameter: **PRECTOTCORR**, unit **mm/day**, NASA POWER Daily API, community AG, local solar time.
- Source endpoint: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- Reproduce: `python scripts/verify_nasa.py`.
- Complete regional Kharif season rainfall totals (mm): **2022: 1988.83**, **2023: 1817.85**, **2024: 2417.46**.
- Complete regional Rabi totals (mm): **2022–23: 227.23**, **2023–24: 75.95**.
- Raw NASA response SHA-256 is documented in the CI artifact. No invented observations were inserted.

**Important:** The verified NASA retrieval ran in GitHub Actions. A live cross-origin fetch initiated from the browser is implemented but has **not** been independently browser-verified.

## Scientific limitations

This project is a **hackathon planning demonstration, not a validated agronomic recommendation**. Crop-water values, rainfall utilization fractions, and crop-cover-day indicators are **illustrative screening assumptions**. The soil selection controls an assumed rainfall-utilization factor and **does not measure actual soil health**.

A modeled water deficit indicates the illustrative water threshold is exceeded, *not* a forecast of crop failure. Minimum-change optimality applies only to the fixed four-season catalog and encoded constraints. The application does not predict yields, future climate, groundwater, soil carbon, or farmer income. Independent crop-parameter calibration and local expert validation are needed before any farming decisions.

The season definitions in this hackathon model are simplified (Kharif June–September, Rabi October–March) and should not be interpreted as universal regional planting calendars.

## Why this differs from typical dashboards

Existing Field Shift demos already display NASA observations, soil indicators, and ranked crop rotations. The specific narrow contribution here is **constraint failure diagnosis and exhaustive minimum-change rotation repair** with a visible no-solution path. This is an implementation-level contribution, not a claim of having invented constraint optimization.

## Running and testing

```bash
python -m http.server 8000
# visit http://localhost:8000
node --test engine.test.mjs
python scripts/verify_nasa.py
```

The NASA script requires internet connectivity. The browser demo can run with clearly labeled illustrative rainfall values when the NASA fetch fails.

## Public submission links

- Project: https://agroshift-resilience.vercel.app/
- Demonstration (seven slides, print-friendly): https://agroshift-resilience.vercel.app/demo.html
- Source: https://github.com/aadi-harale/nasaspaceappschallenge
- Latest CI: https://github.com/aadi-harale/nasaspaceappschallenge/actions

## AI assistance and data acknowledgments

AI assistance was used in planning, implementation, debugging, and documentation. The application credits **NASA POWER** for meteorological data and is independent student work, not endorsed by NASA. No NASA logos are used. There are no unlicensed stock images in the seven-slide presentation.

## Submission verification still required

- Independently open the project and slide links in an **incognito/private window** to confirm anonymous access.
- Verify the NASA data load button in a normal browser and document any failures.
- Confirm that the NASA form accepts the seven-slide web presentation; if a conventional format is required, print `demo.html` to a **seven-page PDF** and upload to a public host.
- Make no claims of validated water savings or improved soil health without actual field and agronomic evidence.
