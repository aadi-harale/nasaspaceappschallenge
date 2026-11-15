# AgroShift — Rotation Rescue Engine

**Banger Duo | NASA Space Apps Challenge 2026 | Field Shift**

An explainable climate-aware crop rotation *repair* experiment. Instead of ranking unrelated rotations, AgroShift starts from the farmer's existing plan, diagnoses a simplified seasonal water-budget failure, and finds the fewest crop substitutions satisfying the encoded constraints.

## Live prototype
Open `index.html` through a static host (GitHub Pages, Vercel, or `python -m http.server 8000`). The NASA POWER button fetches daily regional precipitation directly from NASA; live observations and illustrative data are explicitly distinguished.

## Primary NASA resource
[NASA POWER daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/), `PRECTOTCORR`, agricultural community.

## Important scientific limitations
This is a **hackathon feasibility demonstration, not a validated farming recommendation**. Crop water-use figures, rainfall efficiency factors, and soil protection indicators are illustrative planning assumptions, not regional field estimates. The tool does not calculate yields, future climate probabilities, soil fertility gains, or farm economics. Repair feasibility means only that the *encoded proxy constraints* pass. Local agronomic validation is required before practical agricultural decisions.

## Differentiation
Public Field Shift projects already provide satellite dashboards, NASA data, crop recommendation scoring, scenario sliders and soil information. Our specific testable contribution is **minimum-change constraint repair with named failure explanations and explicit no-feasible-option responses**, rather than another opaque top-crop ranking.

## AI use and acknowledgments
AI assisted design, code and documentation. NASA POWER is credited as the climate observation provider. Independent student project; not endorsed by NASA. No NASA logos used.

## Submission checklist
- Validate NASA API live on deployed site
- Validate crop constants with local agricultural references
- Add automated tests and benchmark against a greedy baseline
- Publish accessible working site and <=7 slide or <=30 second demo
- Disclose all SI-assisted content and third-party data/assets
