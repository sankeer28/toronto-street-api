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
    area["name"="Toronto"]->.toronto;
    area["name"="Mississauga"]->.mississauga;
    area["name"="Brampton"]->.brampton;
    area["name"="Markham"]->.markham;
    area["name"="Richmond Hill"]->.richmond;
    area["name"="Vaughan"]->.vaughan;
    area["name"="Pickering"]->.pickering;
    area["name"="Ajax"]->.ajax;
    area["name"="Whitby"]->.whitby;
    area["name"="Oshawa"]->.oshawa;
    (
      way["highway"]["name"](area.toronto);
      way["highway"]["name"](area.mississauga);
      way["highway"]["name"](area.brampton);
      way["highway"]["name"](area.markham);
      way["highway"]["name"](area.richmond);
      way["highway"]["name"](area.vaughan);
      way["highway"]["name"](area.pickering);
      way["highway"]["name"](area.ajax);
      way["highway"]["name"](area.whitby);
      way["highway"]["name"](area.oshawa);
    );
    out body;
    >;
    out skel qt;
  `;

  console.log('Downloading GTA street data (this may take several minutes)...');
  
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    // Add longer timeout for larger dataset
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

  // Then process ways into streets
  data.elements.forEach((element) => {
    if (element.type === 'way' && element.tags?.name) {
      const name = element.tags.name;
      const type = element.tags.highway || 'unknown';
      const coordinates = element.nodes
        .map((nodeId: number) => nodes.get(nodeId))
        .filter((node): node is Coordinate => node !== undefined);

      const key = `${name}|${type}`; // Use combination of name and type as key
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
