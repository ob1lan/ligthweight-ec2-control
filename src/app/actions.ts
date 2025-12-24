
'use server'

import { promises as fs } from 'fs';
import path from 'path';

export type InstanceAction = 'powerOn' | 'powerOff' | 'getStatus';

if (!process.env.START_INSTANCE_WEBHOOK_URL) {
  throw new Error('Missing required environment variable: START_INSTANCE_WEBHOOK_URL');
}
if (!process.env.STOP_INSTANCE_WEBHOOK_URL) {
  throw new Error('Missing required environment variable: STOP_INSTANCE_WEBHOOK_URL');
}
if (!process.env.GET_STATUS_WEBHOOK_URL) {
  throw new Error('Missing required environment variable: GET_STATUS_WEBHOOK_URL');
}

const ACTION_WEBHOOKS: Record<InstanceAction, string> = {
  powerOn: process.env.START_INSTANCE_WEBHOOK_URL,
  powerOff: process.env.STOP_INSTANCE_WEBHOOK_URL,
  getStatus: process.env.GET_STATUS_WEBHOOK_URL
};

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'instances.json');

export interface InstanceConfig {
    id: string;
    name: string;
    ec2Id: string;
}

export async function getInstances(): Promise<InstanceConfig[]> {
    try {
        const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading instances file:', error);
        return [];
    }
}

export async function addInstance(name: string, ec2Id: string): Promise<InstanceConfig | null> {
    try {
        const instances = await getInstances();
        const newInstance: InstanceConfig = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            ec2Id
        };
        instances.push(newInstance);
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(instances, null, 2));
        return newInstance;
    } catch (error) {
        console.error('Error adding instance:', error);
        return null;
    }
}

export async function removeInstance(id: string): Promise<boolean> {
    try {
        const instances = await getInstances();
        const filteredInstances = instances.filter(inst => inst.id !== id);
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(filteredInstances, null, 2));
        return true;
    } catch (error) {
        console.error('Error removing instance:', error);
        return false;
    }
}

export async function controlInstance(ec2Name: string, ec2Id: string, action: InstanceAction) {
  const webhookUrl = ACTION_WEBHOOKS[action];

  if (!webhookUrl) {
    console.error(`No webhook URL found for action: ${action}`);
    return { success: false, error: 'Invalid action' };
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        name: ec2Name,
        instance_id: ec2Id
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`Error calling webhook for ${ec2Name} (${action}):`, error);
    return { success: false, error: 'Failed to communicate with the automation server.' };
  }
}