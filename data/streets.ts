// This file is auto-generated
export type Street = {
  name: string;
  type: string;
  coordinates: Array<{
    lat: number;
    lng: number;
  }>;
};

const chunks = [
  require('./streets_0.json'),
  require('./streets_1.json'),
  require('./streets_2.json'),
  require('./streets_3.json'),
  require('./streets_4.json'),
  require('./streets_5.json'),
  require('./streets_6.json'),
  require('./streets_7.json'),
  require('./streets_8.json'),
  require('./streets_9.json'),
  require('./streets_10.json'),
  require('./streets_11.json'),
  require('./streets_12.json'),
  require('./streets_13.json'),
  require('./streets_14.json'),
  require('./streets_15.json'),
  require('./streets_16.json'),
  require('./streets_17.json'),
  require('./streets_18.json'),
  require('./streets_19.json'),
  require('./streets_20.json'),
  require('./streets_21.json'),
  require('./streets_22.json'),
  require('./streets_23.json'),
  require('./streets_24.json'),
  require('./streets_25.json'),
  require('./streets_26.json'),
  require('./streets_27.json'),
  require('./streets_28.json'),
  require('./streets_29.json'),
  require('./streets_30.json'),
  require('./streets_31.json'),
  require('./streets_32.json'),
  require('./streets_33.json'),
  require('./streets_34.json'),
  require('./streets_35.json'),
  require('./streets_36.json'),
  require('./streets_37.json'),
  require('./streets_38.json')
] as const;

export const streets: Street[] = chunks.flat();