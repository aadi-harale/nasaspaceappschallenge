#!/usr/bin/env python3
"""Retrieve and validate real NASA POWER precipitation; emit verifiable provenance, no invented data."""
import json, datetime, urllib.request, urllib.parse, pathlib, hashlib
from statistics import median

latitude, longitude = 18.52, 73.85
params = {
    "parameters": "PRECTOTCORR",
    "community": "AG",
    "latitude": str(latitude),
    "longitude": str(longitude),
    "start": "20220101",
    "end": "20241231",
    "format": "JSON",
    "time-standard": "LST",
}
url = "https://power.larc.nasa.gov/api/temporal/daily/point?" + urllib.parse.urlencode(params)
request = urllib.request.Request(url, headers={"User-Agent": "AgroShift-NASA-Space-Apps-2026/1.0"})
with urllib.request.urlopen(request, timeout=100) as response:
    raw = response.read()
    if response.status != 200: raise RuntimeError(f"NASA HTTP {response.status}")
payload = json.loads(raw)
data = payload["properties"]["parameter"]["PRECTOTCORR"]
valid = {}
for date_str, value in data.items():
    if len(date_str) != 8: continue
    try: date = datetime.datetime.strptime(date_str, "%Y%m%d").date()
    except ValueError: continue
    if type(value) not in (int, float) or value < 0: continue  # exclude NASA fill values (-999)
    valid[date_str] = value
expected = sum(1 for day in (datetime.date(2022,1,1)+datetime.timedelta(days=i) for i in range(1096)) if day.year<=2024)
if len(valid) < expected*.95:
    raise RuntimeError(f"Insufficient valid NASA precipitation days: {len(valid)}/{expected}")
years = {}
for key, mm in valid.items():
    date = datetime.datetime.strptime(key,"%Y%m%d").date()
    if date.month in (6,7,8,9): years.setdefault((date.year,"kharif"),[]).append(mm)
    elif date.month in (10,11,12,1,2,3):
        y = date.year if date.month >= 10 else date.year-1
        years.setdefault((y,"rabi"),[]).append(mm)
complete = {}
for (year,season),values in years.items():
    start = datetime.date(year,6,1) if season=="kharif" else datetime.date(year,10,1)
    end = datetime.date(year,9,30) if season=="kharif" else datetime.date(year+1,3,31)
    expected_days = (end-start).days+1
    if len(values) == expected_days:
        complete[f"{year}-{season}"] = round(sum(values),2)
if not any(k.endswith("kharif") for k in complete) or not any(k.endswith("rabi") for k in complete):
    raise RuntimeError("No complete kharif/rabi seasons")
summary={
  "provider":"NASA POWER Daily API",
  "parameter":"PRECTOTCORR",
  "units":payload.get("parameters",{}).get("PRECTOTCORR",{}).get("units","see source metadata"),
  "community":"AG",
  "time_standard":"LST",
  "requested_latitude":latitude,
  "requested_longitude":longitude,
  "period":"2022-01-01 to 2024-12-31",
  "retrieved_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "source_url":url,
  "raw_sha256":hashlib.sha256(raw).hexdigest(),
  "valid_days":len(valid),
  "complete_season_totals_mm":complete,
  "notes":"Regional gridded NASA reanalysis observations, not farm-level measurements. Seasonal totals exclude April-May; these are not yield predictions.",
}
pathlib.Path("evidence").mkdir(exist_ok=True)
pathlib.Path("evidence/nasa-power-provenance.json").write_text(json.dumps(summary,indent=2)+"\n",encoding="utf-8")
print(json.dumps(summary,indent=2))
