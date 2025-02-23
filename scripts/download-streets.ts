import * as fs from 'fs';
import fetch from 'node-fetch';

interface OSMNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
}

interface OSMWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: {
    name?: string;
    highway?: string;
  };
}

interface OSMResponse {
  elements: (OSMNode | OSMWay)[];
}

interface Coordinate {
  lat: number;
  lng: number;
}

interface StreetData {
  name: string;
  type: string;  // Add type field
  coordinates: Coordinate[];
}

async function downloadStreetData() {
  const query = `
    [out:json][timeout:900];
    // Define the exact GTA bounding box using provided coordinates
    (
      // South-West point: 43.57455720071925,-79.56596680728272
      // North-West point: 43.805423228641516,-79.68545466957553
      // North-East point: 43.99894444958437,-79.03600299452471
      // South-East point: 43.638906489923045,-78.93970983491215
      
      // Get ALL named ways within this bounding box
      way["name"](43.57,-79.69,44.00,-78.93);
      
      // Explicitly include all highways and roads
      way["highway"]["name"](43.57,-79.69,44.00,-78.93);
      
      // Get address points for verification
      node["addr:street"](43.57,-79.69,44.00,-78.93);
    );
    out body;
    >;
    out skel qt;
  `;

  console.log('Downloading complete GTA street data...');
  
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 900000
  });

  const data: OSMResponse = await response.json();
  
  const streets = new Map<string, StreetData>();
  const nodes = new Map<number, Coordinate>();

  // First, collect all nodes
  data.elements.forEach((element) => {
    if (element.type === 'node') {
      nodes.set(element.id, {
        lat: element.lat,
        lng: element.lon
      });
    }
  });

  // Update street type priority with proper typing
  type StreetType = 'residential' | 'tertiary' | 'secondary' | 'unclassified' | 
                    'primary' | 'trunk' | 'motorway' | 'unknown';

  const streetTypePriority: Record<StreetType, number> = {
    'residential': 1,
    'tertiary': 2,
    'secondary': 3,
    'unclassified': 4,
    'primary': 5,
    'trunk': 6,
    'motorway': 7,
    'unknown': 8
  };

  // Then process ways into streets with priority
  data.elements.forEach((element) => {
    if (element.type === 'way' && element.tags?.name) {
      const name = element.tags.name.trim();
      const type = element.tags.highway || 'unknown';
      
      // Don't modify street names, keep them exactly as they are
      const coordinates = element.nodes
        .map((nodeId: number) => nodes.get(nodeId))
        .filter((node): node is Coordinate => node !== undefined);

      const key = `${name}|${type}`;
      
      if (!streets.has(key)) {
        streets.set(key, { name, type, coordinates: [] });
      }
      const street = streets.get(key);
      if (street) {
        street.coordinates.push(...coordinates);
      }
    }
  });

  try {
    const dataDir = 'data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const streetsArray = Array.from(streets.values());
    console.log(`Processing ${streetsArray.length} unique streets`);

    // Split into chunks of 1000 streets
    const chunkSize = 1000;
    const chunks = [];
    
    for (let i = 0; i < streetsArray.length; i += chunkSize) {
      chunks.push(streetsArray.slice(i, i + chunkSize));
    }

    // Save each chunk to a separate file
    chunks.forEach((chunk, index) => {
      fs.writeFileSync(
        `data/streets_${index}.json`,
        JSON.stringify(chunk, null, 2),
        'utf8'
      );
    });

    // Create the main streets.ts file that imports all chunks
    const indexContent = `// This file is auto-generated
export type Street = {
  name: string;
  type: string;
  coordinates: Array<{
    lat: number;
    lng: number;
  }>;
};

const chunks = [
${chunks.map((_, i) => `  require('./streets_${i}.json')`).join(',\n')}
] as const;

export const streets: Street[] = chunks.flat();`;

    fs.writeFileSync('data/streets.ts', indexContent, 'utf8');
    console.log(`Split ${streetsArray.length} streets into ${chunks.length} files`);
    
    if (fs.existsSync('data/streets.ts')) {
      console.log('Successfully verified streets.ts file creation');
    } else {
      throw new Error('Failed to create streets.ts file');
    }

    // Save a list of all street names
    const streetList = Array.from(streets.values()).map(s => `${s.name} (${s.type})`).sort();
    fs.writeFileSync('data/street_names.txt', streetList.join('\n'), 'utf8');
    console.log(`Saved ${streetList.length} street names to street_names.txt`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Add error handling
downloadStreetData().catch(error => {
  console.error('Failed to download street data:', error);
  process.exit(1);
});
