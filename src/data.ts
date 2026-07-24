import { Flight, SystemStatus } from './types';

export const mockFlights: Flight[] = [
  {
    id: 'f1',
    callsign: 'AAL772',
    type: 'DEP',
    airport: 'SBGR',
    squawk: '1300',
    aircraft: 'A321',
    wakeTurbulence: 'M',
    level: 'F350',
    route: 'L560',
    runway: '09R',
    taxiwayIn: 'A'
  },
  {
    id: 'f2',
    callsign: 'BAN551',
    type: 'DEP',
    airport: 'SBGR',
    squawk: '2212',
    aircraft: 'B738',
    wakeTurbulence: 'M',
    level: 'F320',
    route: 'J11',
    runway: '09L',
    taxiwayIn: 'B'
  },
  {
    id: 'f3',
    callsign: 'GLO1244',
    type: 'ARR',
    airport: 'SBGR',
    squawk: '4510',
    aircraft: 'B38M',
    wakeTurbulence: 'M',
    level: 'F120',
    route: 'K01',
    runway: '09R',
    taxiwayOut: 'C'
  },
  {
    id: 'f4',
    callsign: 'TAM3321',
    type: 'ARR',
    airport: 'SBGR',
    squawk: '1104',
    aircraft: 'A320',
    wakeTurbulence: 'M',
    level: 'F080',
    route: 'K02',
    runway: '09R',
    taxiwayOut: 'D'
  },
  {
    id: 'f5',
    callsign: 'BAN1039',
    type: 'HOLD',
    airport: 'ED001',
    squawk: '0777',
    aircraft: 'C550',
    wakeTurbulence: 'L',
    level: 'REASON',
    route: 'WX-AVD',
    time: '14:45'
  },
  {
    id: 'f6',
    callsign: 'DLH6578',
    type: 'HOLD',
    airport: 'MA04',
    squawk: '5544',
    aircraft: 'B748',
    wakeTurbulence: 'H',
    level: 'REASON',
    route: 'TFC-DENSITY',
    time: '15:10'
  },
  // Sample completed flights for testing spreadsheet
  {
    id: 'f-done-1',
    callsign: 'AZU4012',
    type: 'DEP',
    airport: 'SBGR',
    squawk: '2301',
    aircraft: 'E195',
    wakeTurbulence: 'M',
    level: 'F310',
    route: 'UW2',
    runway: '09R',
    taxiwayIn: 'A',
    ingressoTime: Date.now() - 900000,
    reacaoTime: Date.now() - 894000,
    corridaTime: Date.now() - 860000,
    finished: true
  },
  {
    id: 'f-done-2',
    callsign: 'TAM3005',
    type: 'ARR',
    airport: 'SBGR',
    squawk: '4210',
    aircraft: 'A320',
    wakeTurbulence: 'M',
    level: 'F090',
    route: 'K01',
    runway: '09L',
    taxiwayOut: 'B',
    faf2Time: Date.now() - 1500000,
    faf1Time: Date.now() - 1350000,
    fafTime: Date.now() - 1200000,
    thrTime: Date.now() - 1050000,
    pLivreTime: Date.now() - 990000,
    finished: true
  },
  {
    id: 'f-done-3',
    callsign: 'UPS202',
    type: 'DEP',
    airport: 'SBGR',
    squawk: '1412',
    aircraft: 'B763',
    wakeTurbulence: 'H',
    level: 'F330',
    route: 'J12',
    runway: '09R',
    taxiwayIn: 'E',
    ingressoTime: Date.now() - 2400000,
    reacaoTime: Date.now() - 2392000,
    corridaTime: Date.now() - 2350000,
    finished: true
  }
];

export const mockSystemStatus: SystemStatus = {
  metar: {
    time: '141400Z',
    text: 'SBGR 141400Z 09010KT 9999 FEW025 22/16 Q1015 NOSIG'
  },
  frequencies: {
    primary: '118.000',
    secondary: '118.450',
    ground: '121.700'
  },
  alerts: [
    { id: 'a1', type: 'warning', message: 'T-STORM APRX NE' },
    { id: 'a2', type: 'info', message: 'RWY 09L MAINT @ 1600Z' }
  ]
};
