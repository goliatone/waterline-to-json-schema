'use strict';

const titleize = require('pretty-camel');

function transform(models = [], options={}) {

    let schema = {};

    if(options.id) schema.id = options.id;
    schema.$schema = 'http://json-schema.org/draft-04/schema#';

    schema = schemaObject(schema);

    let definitions = models.map((model) => {
        return transformModel(options, model);
    });

    definitions.map((definition) => {
        schema.properties[definition.identity] = {
            $ref: '#/definitions' + definition.identity
            // $ref: '#/definitions' + definition.id
        };

        schema.definitions[definition.identity] = definition;
    });

    return schema;
}

function transformModel(options, model) {
    let output = schemaObject();

    /*
     * Metadata
     */
    output.description = '';
    output.id = makeElementId(model, options);//'/' + model.identity;
    output.identity = model.identity; //<-- this is non standard!!
    output.title = model.exportName || titleize(model.identity);


    //https://github.com/balderdashy/waterline-docs/blob/master/models/configuration.md#schema
    output.additionalProperties = !model.schema;

    //TODO: Add createdAt & updatedAt
    itr(model.attributes, (attr, name) => {

        /*
         * We are ignoring functions, not
         * sure why we would want to include them
         * in the output.
         *
         * TODO: Could we add a serialize false
         * attribute to the field definition in
         * Waterline models?
         *
         * TODO: Take a list of fields to ignore
         * we could do model:field pairs from CLI
         * or read from file.
         */
        if(isFieldIgnored(attr, name)) {
            return;
        }

        if (attr.hasOwnProperty('required')) output.required.push(name);

        let property = output.properties[name] = {};

        if (attr.hasOwnProperty('primaryKey')) {
            property.primaryKey = attr.primaryKey;
        }

        property.title = titleize(name);
        if (attr.description) property.description = attr.description;

        if (attr.hasOwnProperty('defaultsTo')) {
            if (attr.defaultsTo !== 'function') {
                property.default = attr.defaultsTo;
            }
            // property.default = typeof attr.defaultsTo === 'function' ? attr.defaultsTo.toString() : attr.defaultsTo;
        }

        /*
         * Attribute Data Types
         */
        property.type = 'string';

        if (attr.type === 'string') property.type = 'string';
        if (attr.type === 'text') property.type = 'string';

        if (attr.type === 'float') property.type = 'number';
        if (attr.type === 'integer') property.type = 'integer';

        if (attr.type === 'boolean') property.type = 'boolean';

        if (attr.type === 'json') property.type = 'object';
        if (attr.type === 'array') property.type = 'array';
        if (attr.type === 'binary') property.type = 'string';

        if (attr.type === 'time') property.type = 'string';

        if (attr.type === 'date') {
            property.type = 'string';
            property.format = 'date';
        }

        if (attr.type === 'datetime') {
            property.type = 'string';
            property.format = 'date-time'; //1732-02-22
        }

        if (attr.enum) property.enum = attr.enum.concat();

        /*
         * Attribute Formats
         */
        let formats = [
            'email', 'url', 'urlish',
            'ip', 'ipv4', 'ipv6',
            'creditcard', 'uuid', 'uuidv3',
            'uuidv4', 'date', 'array', 'hexColor',
            'hexadecimal', 'string', 'alpha', 'numeric',
            'alphanumeric', 'int', //'integer', //'number',
            'finite', 'decimal', 'float', 'boolean',
            'lowercase', 'uppercase'
        ];

        formats.map((format) => {
            if (attr.hasOwnProperty(format)) property.format = format;
        });

        //exclusiveMinimum exclusiveMaximum multipleOf

        //TODO: Pull patterns from validator.js. This
        //patterns assume "en"
        //TODO: regex should be in string form.
        if (property.format === 'alpa') {
            property.pattern = /^[A-Z]+$/i;
        }

        if (property.format === 'alphanumeric') {
            property.pattern = /^[0-9A-Z]+$/i;
        }

        if (property.format === 'numeric' || property.format === 'int') {
            property.pattern = /^[0-9]+$/i;
        }

        if (property.format === 'creditcard') {
            property.pattern = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})|62[0-9]{14}$/;
        }

        if (property.format === 'decimal') {
            property.pattern = /^[-+]?([0-9]+|\.[0-9]+|[0-9]+\.[0-9]+)$/;
        }

        if (property.format === 'hexadecimal') {
            property.pattern = /^[0-9A-F]+$/i;
        }

        if (property.format === 'hexColor') {
            property.pattern = /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i;
        }

        if (property.format === 'urlish') {
            property.pattern = /^\s([^\/]+.)+.+\s*$/g;
        }

        if (attr.hasOwnProperty('contains')) property.pattern = attr.contains;
        if (attr.hasOwnProperty('notContains')) {
            property.not = {
                pattern: attr.notContains
            };
        }

        // if attribute primaryKey -> type integer|number
        // "type": ["string", "integer"],
        // property.pattern = '^[1-9][0-9]*$'; //only to string
        // property.minimum = 1; //only to number
        // which would also be
        // {
        //   "anyOf": [
        //     { "type": "string", "pattern": "^[1-9][0-9]*$" },
        //     { "type": "integer", "minimum": 1 },
        //   ]
        // }

        /*
         * Attribute Validation
         */
        if (attr.hasOwnProperty('min')) property.minimum = attr.min;
        if (attr.hasOwnProperty('max')) property.maximum = attr.max;

        if (attr.hasOwnProperty('len')) {
            property.minLength = property.maxLength = attr.len;
        }

        if (attr.hasOwnProperty('maxLength')) property.maxLength = attr.maxLength;
        if (attr.hasOwnProperty('minLength')) property.minLength = attr.minLength;

        let patterns = ['is', 'regex', 'not', 'notRegex'];
        patterns.map((key) => {
            if (attr.hasOwnProperty(key)) property.pattern = attr[key];
        });


        /*
         * References:
         * - collection:
         *  type: array
         *  items: $ref
         */
        if (!attr.hasOwnProperty('type')) {
            if (attr.hasOwnProperty('collection')) {
                property.type = 'array';
                property.items = {
                    $ref: '#/definitions/' + (attr.collection).toLowerCase()
                };
                property.via = attr.via; //<-- this is non standard!!
            }

            if (attr.hasOwnProperty('model')) {
                property.type = {
                    $ref: '#/definitions/' + attr.model
                };
            }
        }

    });

    return output;
}

module.exports = transform;

/*
 * Sometimes we might want to
 */
function makeElementId(field, o={}) {
    let prefix = o.uriPrefix ? ( _cleanUri(o.uriPrefix) + '/') : '';
    return '/' + prefix + field.identity
}

function _cleanUri(uri='') {
    return (uri.toLowerCase()).replace(/^\//g,'').replace(/\/$/g,'');
}

function isFieldIgnored(field, name) {
    if(typeof field === 'function') {
        return true;
    }

    // if(typeof field === 'password') {
    //     return true;
    // }

    return false;
}

function schemaObject(output={}) {
    output.type = 'object';
    output.required = [];
    output.properties = {};
    output.definitions = {};

    return output;
}


function itr(obj = {}, cb = function() {}) {
    let index = 0,
        value;
    Object.keys(obj).map((key) => {
        value = obj[key];
        cb(value, key, obj, index++);
    });
}
