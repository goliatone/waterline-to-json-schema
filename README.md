## WaterlineJS to JSON schema converter

Convert Waterline model definitions to [JSON schema][js]. You can then use this generated JSON with tools such as [core.io-cli-view-generator][core.io-cli-view-generator].

### CLI
This library provides a cli utility, `waterline-schema`, with two commands:

* `collect `
* `generate`

```
waterline-schema 0.2.1 - WaterlineJS to JSON schema generator

USAGE

  waterline-schema <command> [options]

COMMANDS

  collect [source] [output]       Collect metadata from waterline models and generates a JSON schema file
  generate [source] [output]      Generate schema from model data                                        
  help <command>                  Display help for a specific command                                    

GLOBAL OPTIONS

  -h, --help         Display help                                      
  -V, --version      Display version                                   
  --no-color         Disable colors                                    
  --quiet            Quiet mode - only displays warn and error messages
  -v, --verbose      Verbose mode - will also output debug messages   
```  

#### Collect

Collect will go over all files in a given directory and generate a JSON file with all the model definitions. Note that for now, the command relies on the models exposing an `schema` object.

```js
const schema = {
    identity: 'user',
    attributes: {
        id: {
            type: 'text',
            primaryKey: true
        },
        name: {
            type: 'string',
            label: 'Name'
        }
    }
};

const Model = Waterline.Collection.extend(schema);

module.exports = Model;
module.exports.schema = schema;
```

#### Generate

The generate command will take a JSON file with definitions of Waterline models, turn it into a valid JSON schema object, and save it to a file.


### TODO

- [ ] Do swagger output from schema?
- [ ] Remove `"required": []` if empty.
- [ ] Identify primary key
    - [ ] if not pk show warning.
- [ ] generate report with:
    - [ ] errors
    - [ ] warnings
- [ ] Filter out fields or mark them as private?
    - password field, we don't want to show in GUI but want to have in Swagger
- [ ] _inputs_
    - [ ] form:
        - [ ] ensure we have a default for items or provide one

[js]:http://json-schema.org/
[core.io-cli-view-generator]:https://github.com/goliatone/core.io-cli-view-generator

<!--
https://github.com/marcelklehr/waterline-to-jsonapi

https://github.com/raml2html/raml2html
https://www.npmjs.com/package/raml-jsonschema-expander

https://www.npmjs.com/package/json-schema-ref-parser

https://www.npmjs.com/package/json-schema-docs-generator
-->
