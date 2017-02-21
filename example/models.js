const uuidV4 = require('uuid/v4');

module.exports = [{
    identity: 'box',
    exportName: 'Box',
    schema: false,
    attributes: {
        id: {
            type: 'text',
            primaryKey: true,
            required: true,
            unique: true,
            defaultsTo: function() {
              return uuidV4();
            }
        },
        name: {
            type: 'string',
            label: 'Name'
        },
        uuid: {
            type: 'string',
            required: true,
            label: 'UUID',
            defaultsTo: function() {
                return uuidV4();
            }
        },
        eventName: {
            label: 'Event Name',
            type: 'string'
        },
        eventResponse: {
            label: 'Event Response',
            type: 'string'
        },
        eventAction: {
            label: 'Event Action',
            type: 'string',
            defaultsTo: 'ACTIVATE'
        },
        boxset: {
            label: 'Boxset',
            model: 'boxset'
        },
        status: {
            label: 'Status',
            type: 'string',
            enum: [ 'available', 'assigned', 'delivered', 'full', 'broken'],
            defaultsTo: 'available'
        }
    }
}, {
    identity: 'boxset',
    exportName: 'BoxSet',
    schema: true,
    attributes: {
        id: {
            type: 'text',
            primaryKey: true,
            unique: true,
            defaultsTo: function() {
              return uuidV4();
            }
        },
        uuid: {
            type: 'string',
            required: true,
            defaultsTo: function() {
                return uuidV4();
            }
        },
        identifier: {
            type: 'string'
        },
        partitionId: {
            type: 'integer'
        },
        serverId: {
            type: 'integer'
        },
        partition: {
            type: 'string'
        },
        boxes: {
            collection: 'box',
            via: 'boxset'
        }
    }
}];
