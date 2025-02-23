# Toronto Street API

Simple API that returns the nearest street name for any given coordinate in the Greater Toronto Area (GTA).

## API Usage

```http
GET /api?lat={latitude}&lng={longitude}
```

### Example Request
```http
GET https://toronto-street-api.vercel.app/api?lat=43.5935064119175&lng=-79.52954035201256
```

### Example Response
```json
{"street":"Thirty First Street","coordinates":{"latitude":43.5935064119175,"longitude":-79.52954035201256},"totalStreets":31871}
```

### Boundaries
Exactly covers Greater Toronto Area with these corner points:
- South-West: 43.57455720071925, -79.56596680728272 (Mississauga)
- North-West: 43.80542322864151, -79.68545466957553 (Brampton)
- North-East: 43.99894444958437, -79.03600299452471 (Markham)
- South-East: 43.63890648992304, -78.93970983491215 (Pickering)

## Features
- High precision street detection (within 15 meters)
- Includes all road types (streets, trails, avenues, etc.)
- Fast response times (<100ms)
- No rate limits
- Comprehensive GTA coverage
  
## Local Development

1. Clone the repository:
```bash
git clone https://github.com/sankeer28/toronto-street-api.git
```

2. Install dependencies:
```bash
npm install
```

3. Download street data (need to be manually run every few months):
```bash
npm run download-streets
```

4. Start the development server:
```bash
npm run dev
```

5. Test the API:
```http
http://localhost:3000/api?lat=43.6532&lng=-79.3832
```

## Data Source

Street data is sourced from OpenStreetMap using the Overpass API. The data includes all named streets, roads, and pathways in the GTA region including:
- Toronto
- Mississauga
- Brampton
- Markham
- Richmond Hill
- Vaughan
- Pickering
- Ajax
- Whitby
- Oshawa


