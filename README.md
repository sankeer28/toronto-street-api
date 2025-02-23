# Toronto Street API

Simple API that returns the nearest street name for any given coordinate in the Greater Toronto Area (GTA).

## API Usage

```http
GET /api?lat={latitude}&lng={longitude}
```

### Example Request
```http
GET https://toronto-street-api.vercel.app/api?lat=43.65487346557306&lng=-79.45351336619862
```

### Example Response
```json
{
  "street": "Indian Trail",
  "coordinates": {
    "latitude": 43.65487346557306,
    "longitude": -79.45351336619862
  },
  "totalStreets": 31871
}
```

### Boundaries
- Latitude: 43.4° to 44.0°
- Longitude: -79.8° to -79.1°

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd coordinate_to_street
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

## Deployment

The API is deployed on Vercel. To deploy your own instance:

1. Push to GitHub
2. Import project in Vercel
3. Deploy

## Technical Details

- Built with TypeScript and Node.js
- Uses Express for local development
- Vercel serverless functions for deployment
- ~32,000 streets in database
- Data is split into chunks for efficient loading
