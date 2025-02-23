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
  // Fix the longitude calculation bug
  const A = (lat - lat1) * 111.32; // Convert to km (approximately)
  const B = (lng - lng1) * 111.32 * Math.cos(lat * Math.PI / 180);
  const C = (lat2 - lat1) * 111.32;
  const D = (lng2 - lng1) * 111.32 * Math.cos(lat * Math.PI / 180);

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq ? dot / lenSq : -1;

  let xx, yy;
  if (param < 0) {
    xx = lat1;
    yy = lng1;
  } else if (param > 1) {
    xx = lat2;
    yy = lng2;
  } else {
    xx = lat1 + param * (lat2 - lat1);
    yy = lng1 + param * (lng2 - lng1);
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

  let nearestStreets: Array<{ name: string; type: string; distance: number }> = [];
  const VERY_CLOSE_THRESHOLD = 0.015; // 15 meters

  streets.forEach((street: Street) => {
    let minSegmentDistance = Infinity;
    let closestPoint = { lat: 0, lng: 0 };

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

      if (distance < minSegmentDistance) {
        minSegmentDistance = distance;
        closestPoint = {
          lat: (point1.lat + point2.lat) / 2,
          lng: (point1.lng + point2.lng) / 2
        };
      }
    }

    if (minSegmentDistance < VERY_CLOSE_THRESHOLD) {
      nearestStreets.push({
        name: street.name,
        type: street.type,
        distance: minSegmentDistance
      });
    }
  });

  // Sort by distance and pick the closest
  nearestStreets.sort((a, b) => a.distance - b.distance);
  
  // If no streets found within threshold, return the closest one
  if (nearestStreets.length === 0) {
    return {
      name: 'No nearby street found',
      type: 'unknown',
      distance: Infinity
    };
  }

  return nearestStreets[0];
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

  // Update bounds to match exact GTA boundaries
  if (latitude < 43.57 || latitude > 44.00 || longitude < -79.69 || longitude > -78.93) {
    return res.status(400).json({ error: 'Coordinates outside Greater Toronto Area boundaries' });
  }

  const streetInfo = findNearestStreet(latitude, longitude);
  
  // If distance is too large, probably missing data for this area
  if (streetInfo.distance > 0.2) { // More than 200m away
    console.warn(`Large distance (${streetInfo.distance.toFixed(3)}km) for coordinates:`, latitude, longitude);
  }

  return res.status(200).json({
    street: streetInfo.name,
    coordinates: {
      latitude,
      longitude
    },
    totalStreets: streets.length
  });
}