import type { Patient } from '../types/triage';

const now = new Date();

export const mockPatients: Patient[] = [
  {
    id: '1',
    crNo: '10001',
    name: 'Rahul Sharma',
    age: 45,
    gender: 'M',
    category: 'RED',
    area: 'Red Area',
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.toISOString(),
    complaint: 'Chest pain and sweating',
    pathway: 'NonTrauma'
  },
  {
    id: '2',
    crNo: '10002',
    name: 'Priya Patel',
    age: 34,
    gender: 'F',
    category: 'YELLOW',
    area: 'Yellow Area',
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.toISOString(),
    complaint: 'Fever and weakness',
    pathway: 'NonTrauma'
  },
  {
    id: '3',
    crNo: '10003',
    name: 'Amit Singh',
    age: 28,
    gender: 'M',
    category: 'GREEN',
    area: 'Green Area',
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.toISOString(),
    complaint: 'Minor abrasion after fall',
    pathway: 'Trauma'
  }
];
