import { VercelRequest, VercelResponse } from '@vercel/node';
import { streets, Street } from '../data/streets';

// Remove the Street interface since we're importing it

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
           Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function distanceToLineSegment(
  lat: number, 
  lng: number, 
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const A = lat - lat1;
  const B = lng - lng1;
  const C = lat2 - lat1;
  const D = lng2 - lng2;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lat1;
    yy = lng1;
  } else if (param > 1) {
    xx = lat2;
    yy = lng2;
  } else {
    xx = lat1 + param * C;
    yy = lng1 + param * D;
  }

  return calculateDistance(lat, lng, xx, yy);
}

function findNearestStreet(lat: number, lng: number): { name: string; type: string; distance: number } {
  if (!Array.isArray(streets) || !streets.length) {
    return {
      name: 'No street data available',
      type: 'unknown',
      distance: 0
    };
  }

  let nearestStreet = '';
  let nearestType = '';
  let minDistance = Infinity;

  streets.forEach((street: Street) => {
    for (let i = 0; i < street.coordinates.length - 1; i++) {
      const point1 = street.coordinates[i];
      const point2 = street.coordinates[i + 1];
      
      const distance = distanceToLineSegment(
        lat, 
        lng, 
        point1.lat, 
        point1.lng, 
        point2.lat, 
        point2.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStreet = street.name;
        nearestType = street.type;
      }
    }
  });

  return { 
    name: nearestStreet,
    type: nearestType, 
    distance: minDistance 
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Updated check for valid streets data
  if (!Array.isArray(streets) || !streets.length) {
    console.error('Streets data missing or invalid');
    return res.status(503).json({
      error: 'Street data not available. Please run npm run download-streets first.'
    });
  }

  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing latitude or longitude parameters' });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  // Check if coordinates are within GTA bounds
  if (latitude < 43.4 || latitude > 44.0 || longitude < -79.8 || longitude > -79.1) {
    return res.status(400).json({ error: 'Coordinates outside Toronto/GTA area' });
  }

  const streetInfo = findNearestStreet(latitude, longitude);
  
  return res.status(200).json({
    street: streetInfo.name,
    coordinates: {
      latitude,
      longitude
    },
    totalStreets: streets.length
  });
}