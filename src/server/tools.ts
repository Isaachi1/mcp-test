export const weatherTool = {
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