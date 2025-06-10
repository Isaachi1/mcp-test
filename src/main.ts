#!/usr/bin/env node

import axios, { AxiosInstance } from 'axios';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  McpError,
  ErrorCode,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class Weather {
  private server: Server;
  private axiosInstance: AxiosInstance;

  constructor() {
    console.error('[Setup] Initializing Weather MCP server...');

    this.server = new Server(
      {
        version: '0.0.1',
        name: 'weather-mcp-server',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.axiosInstance = axios.create({
      timeout: 5000,
      baseURL: 'https://api.open-meteo.com/v1',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.server.onerror = (error) => console.error('[Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get-weather',
          description: 'Get weather wind e etc..',
          inputSchema: {
            type: 'object',
            properties: {
              latitude: {
                type: 'string',
                description: 'Latitude'
              },
              longitude: {
                type: 'string',
                description: 'Longitude'
              }
            },
            required: ['latitude', 'longitude'],
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any): Promise<any> => {
      try {
        if (!['get-weather'].includes(request.params.name)) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        const args = request.params.arguments as {
          latitude: string;
          longitude: string;
        };

        if (!args.latitude) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameter: latitude'
          );
        }

        if (!args.longitude) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Missing required parameter: longitude'
          );
        }

        if (request.params.name === 'get-weather') {
          console.error(`[API] Fetching Weather from: ${args.latitude} and ${args.longitude}`);

          const response = await this.axiosInstance.get('/forecast', {
            params: {
              latitude: args.latitude,
              longitude: args.longitude,
              current: 'temperature_2m,wind_speed_10m',
              hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m'
            }
          });

          if (!response.data || !response.data.current) {
            throw new Error('No current weather data returned from Weather API');
          }

        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('[Error] Failed to fetch data:', error);
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to fetch data: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Weather MCP server running on stdio');
  }
}

const server = new Weather();
server.run().catch(console.error);