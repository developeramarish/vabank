(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/schema')

// Patterns
require('./lib/patterns/reference')
require('./lib/patterns/nothing')
require('./lib/patterns/anything')
require('./lib/patterns/object')
require('./lib/patterns/or')
require('./lib/patterns/equality')
require('./lib/patterns/regexp')
require('./lib/patterns/class')
require('./lib/patterns/schema')

// Extensions
require('./lib/extensions/Boolean')
require('./lib/extensions/Number')
require('./lib/extensions/String')
require('./lib/extensions/Object')
require('./lib/extensions/Array')
require('./lib/extensions/Function')
require('./lib/extensions/Schema')

},{"./lib/extensions/Array":3,"./lib/extensions/Boolean":4,"./lib/extensions/Function":5,"./lib/extensions/Number":6,"./lib/extensions/Object":7,"./lib/extensions/Schema":8,"./lib/extensions/String":9,"./lib/patterns/anything":10,"./lib/patterns/class":11,"./lib/patterns/equality":12,"./lib/patterns/nothing":13,"./lib/patterns/object":14,"./lib/patterns/or":15,"./lib/patterns/reference":16,"./lib/patterns/regexp":17,"./lib/patterns/schema":18,"./lib/schema":19}],2:[function(require,module,exports){
var Schema = module.exports = function() {}

Schema.prototype = {
  wrap: function() {
    if (this.wrapped) return this.validate
    this.wrapped = true

    var publicFunctions = [ 'toJSON', 'unwrap', 'errors' ]
    publicFunctions = publicFunctions.concat(this.publicFunctions || [])

    for (var i = 0; i < publicFunctions.length; i++) {
      if (!this[publicFunctions[i]]) continue
      this.validate[publicFunctions[i]] = this[publicFunctions[i]].bind(this)
    }

    return this.validate
  },

  unwrap: function() {
    return this
  },

  toJSON: session(function(makeReference) {
    var json, session = Schema.session

    // Initializing session if it isnt
    if (!session.serialized) session.serialized = { objects: [], jsons: [], ids: [] }

    var index = session.serialized.objects.indexOf(this)
    if (makeReference && index !== -1) {
      // This was already serialized, returning a JSON schema reference ($ref)
      json = session.serialized.jsons[index]

      // If there was no id given, generating one now
      if (json.id == null) {
        do {
          json.id = 'id-' + Math.floor(Math.random() * 100000)
        } while (session.serialized.ids.indexOf(json.id) !== -1)
        session.serialized.ids.push(json.id)
      }

      json = { '$ref': json.id }

    } else {
      // This was not serialized yet, serializing now
      json = {}

      if (this.doc != null) json.description = this.doc

      // Registering that this was serialized and storing the json
      session.serialized.objects.push(this)
      session.serialized.jsons.push(json)
    }

    return json
  })
}

Schema.extend = function(descriptor) {
  if (!descriptor.validate) {
    throw new Error('Schema objects must have a validate function.')
  }

  var constructor = function() {
    var self = this;
    if (this.initialize)
      this.initialize.apply(this, arguments)

    this.validate = this.validate.bind(this)
    this.validate.schema = this.validate
  }

  var prototype = Object.create(Schema.prototype)
  for (var key in descriptor) prototype[key] = descriptor[key]
  constructor.prototype = prototype

  return constructor
}


var active = false
function session(f) {
  return function() {
    if (active) {
      // There's an active session, just forwarding to the original function
      return f.apply(this, arguments)

    } else {
      // The initiator is the one who handles the active flag, and clears the session when it's over
      active = true

      var result = f.apply(this, arguments)

      // Cleanup
      for (var i in session) delete session[i]
      active = false

      return result
    }
  }
}
Schema.session = session

function lastDefinedResult(functions, arg) {
  var i = functions.length, result;
  while (i--) {
    result = functions[i](arg)
    if (result != null) return result
  }
}

var fromJSdefs = []
Schema.fromJS = lastDefinedResult.bind(null, fromJSdefs)
Schema.fromJS.def = Array.prototype.push.bind(fromJSdefs)

var fromJSONdefs = []
Schema.fromJSON = session(lastDefinedResult.bind(null, fromJSONdefs))
Schema.fromJSON.def = Array.prototype.push.bind(fromJSONdefs)

Schema.patterns = {}
Schema.extensions = {}

},{}],3:[function(require,module,exports){
var Schema          = require('../BaseSchema')
  , EqualitySchema  = require('../patterns/equality')
  , anything        = require('../patterns/anything').instance

var ArraySchema = module.exports = Schema.extensions.ArraySchema = Schema.extend({
  initialize: function(itemSchema, max, min) {
    this.itemSchema = itemSchema || anything
    this.min = min || 0
    this.max = max || Infinity
  },
  errors: function(instance) {
    var self = this
    // Instance must be an instance of Array
    if (!(instance instanceof Array))
      return ( instance + ' is not an instance of Array')

    // Checking length
    if (this.min === this.max) {
      if (instance.length !== this.min)
        return ( 'Array length should be equal to ' + this.min + ' and is ' + instance.length )

    } else {
      if (this.min > 0 && instance.length < this.min)
        return ( 'Array length should not be less than ' + this.min + ' and is ' + instance.length )
      if (this.max < Infinity && instance.length > this.max)
        return ( 'Array length should not be more than ' + this.max + ' and is ' + instance.length )
    }

    // Checking conformance to the given item schema
    var results = {}
    for (var i = 0; i < instance.length; i++) {
      var errs = this.itemSchema.errors(instance[i])
      if (errs) {
        results[i] = errs
      }
    }
    var resultKeysArray = Object.keys(results)
    if (resultKeysArray.length > 0) {
      return results
    }

    return false
  },
  validate: function(instance) {
    // Instance must be an instance of Array
    if (!(instance instanceof Array)) return false

    // Checking length
    if (this.min === this.max) {
      if (instance.length !== this.min) return false

    } else {
      if (this.min > 0 && instance.length < this.min) return false
      if (this.max < Infinity && instance.length > this.max) return false
    }

    // Checking conformance to the given item schema
    for (var i = 0; i < instance.length; i++) {
      if (!this.itemSchema.validate(instance[i])) return false
    }

    return true
  },

  toJSON: Schema.session(function() {
    var json = Schema.prototype.toJSON.call(this, true)

    if (json['$ref'] != null) return json

    json.type = 'array'

    if (this.min > 0) json.minItems = this.min
    if (this.max < Infinity) json.maxItems = this.max
    if (this.itemSchema !== anything) json.items = this.itemSchema.toJSON()

    return json
  })
})


Schema.fromJSON.def(function(sch) {
  if (!sch || sch.type !== 'array') return

  // Tuple typing is not yet supported
  if (sch.items instanceof Array) return

  return new ArraySchema(Schema.fromJSON(sch.items), sch.maxItems, sch.minItems)
})

Array.of = function() {
  // Possible signatures : (schema)
  //                       (length, schema)
  //                       (minLength, maxLength, schema)
  var args = Array.prototype.slice.call(arguments).reverse()
  if (args.length === 2) args[2] = args[1]
  return new ArraySchema(Schema.fromJS(args[0]), args[1], args[2]).wrap()
}

Array.like = function(other) {
  return new EqualitySchema(other).wrap()
}

Array.schema = new ArraySchema().wrap()

},{"../BaseSchema":2,"../patterns/anything":10,"../patterns/equality":12}],4:[function(require,module,exports){
var Schema = require('../BaseSchema')

var BooleanSchema = module.exports = Schema.extensions.BooleanSchema = new Schema.extend({
  errors: function(instance) {
    if (!this.validate(instance)) {
      return ( instance + ' is not Boolean' )
    }
    return false
  },

  validate: function(instance) {
    return Object(instance) instanceof Boolean
  },

  toJSON: function() {
    return {
      type: 'boolean'
    }
  }
})

var booleanSchema = module.exports = new BooleanSchema().wrap()

Schema.fromJSON.def(function(sch) {
  if (!sch || sch.type !== 'boolean') return

  return booleanSchema
})

Boolean.schema = booleanSchema

},{"../BaseSchema":2}],5:[function(require,module,exports){
var ReferenceSchema = require('../patterns/reference')

Function.reference = function(f) {
  return new ReferenceSchema(f).wrap()
}

},{"../patterns/reference":16}],6:[function(require,module,exports){
var Schema = require('../BaseSchema')

var NumberSchema = module.exports = Schema.extensions.NumberSchema = Schema.extend({
  initialize: function(minimum, exclusiveMinimum, maximum, exclusiveMaximum, divisibleBy) {
    this.minimum = minimum != null ? minimum : -Infinity
    this.exclusiveMinimum = exclusiveMinimum
    this.maximum = minimum != null ? maximum : Infinity
    this.exclusiveMaximum = exclusiveMaximum
    this.divisibleBy = divisibleBy || 0
  },

  min: function(minimum) {
    return new NumberSchema( minimum, false
                           , this.maximum
                           , this.exclusiveMaximum
                           , this.divisibleBy
                           ).wrap()
  },

  above: function(minimum) {
    return new NumberSchema( minimum, true
                           , this.maximum
                           , this.exclusiveMaximum
                           , this.divisibleBy
                           ).wrap()
  },

  max: function(maximum) {
    return new NumberSchema( this.minimum
                           , this.exclusiveMinimum
                           , maximum
                           , false
                           , this.divisibleBy
                           ).wrap()
  },

  below: function(maximum) {
    return new NumberSchema( this.minimum
                           , this.exclusiveMinimum
                           , maximum
                           , true
                           , this.divisibleBy
                           ).wrap()
  },

  step: function(divisibleBy) {
    return new NumberSchema( this.minimum
                           , this.exclusiveMinimum
                           , this.maximum
                           , this.exclusiveMaximum
                           , divisibleBy
                           ).wrap()
  },

  publicFunctions: ['min', 'above', 'max', 'below', 'step'],

  errors: function(instance) {
    var message
    if (!(Object(instance) instanceof Number)) {
      message = instance + ' is not Number'
    } else if (instance < this.minimum) {
      message = 'number = ' + instance + ' is smaller than required minimum = ' + this.minimum
    } else if (instance > this.maximum) {
      message = 'number = ' + instance + ' is bigger than required maximum = ' + this.maximum
    } else if (this.divisibleBy !== 0 && instance % this.divisibleBy !== 0) {
      message = 'number = ' + instance + ' is not divisibleBy ' + this.divisibleBy
    }

    if (message != null) {
      return message
    }
    return false
  },

  validate: function(instance) {
    return (Object(instance) instanceof Number) &&
      (this.exclusiveMinimum ? instance >  this.minimum
                             : instance >= this.minimum) &&
      (this.exclusiveMaximum ? instance <  this.maximum
                             : instance <= this.maximum) &&
      (this.divisibleBy === 0 || instance % this.divisibleBy === 0)
  },

  toJSON: function() {
    var json = Schema.prototype.toJSON.call(this)

    json.type = ( this.divisibleBy !== 0 && this.divisibleBy % 1 === 0) ? 'integer' : 'number'

    if (this.divisibleBy !== 0 && this.divisibleBy !== 1) json.divisibleBy = this.divisibleBy

    if (this.minimum !== -Infinity) {
      json.minimum = this.minimum
      if (this.exclusiveMinimum === true) json.exclusiveMinimum = true
    }

    if (this.maximum !== Infinity) {
      json.maximum = this.maximum
      if (this.exclusiveMaximum === true) json.exclusiveMaximum = true
    }

    return json
  }
})

Schema.fromJSON.def(function(sch) {
  if (!sch || (sch.type !== 'number' && sch.type !== 'integer')) return

  return new NumberSchema(sch.minimum, sch.exclusiveMinimum, sch.maximum, sch.exclusiveMaximum, sch.divisibleBy || (sch.type === 'integer' ? 1 : 0))
})

Number.schema     = new NumberSchema().wrap()
Number.min        = Number.schema.min
Number.above      = Number.schema.above
Number.max        = Number.schema.max
Number.below      = Number.schema.below
Number.step       = Number.schema.step

Number.Integer    = Number.step(1)

},{"../BaseSchema":2}],7:[function(require,module,exports){
var ReferenceSchema = require('../patterns/reference')
  , EqualitySchema = require('../patterns/equality')
  , ObjectSchema = require('../patterns/object')

Object.like = function(other) {
  return new EqualitySchema(other).wrap()
}

Object.reference = function(o) {
  return new ReferenceSchema(o).wrap()
}

Object.schema = new ObjectSchema().wrap()

},{"../patterns/equality":12,"../patterns/object":14,"../patterns/reference":16}],8:[function(require,module,exports){
var Schema = require('../BaseSchema')
  , schema = require('../schema')

var SchemaReference = module.exports = Schema.extensions.SchemaReference = Schema.extend({
  validate: function() {
    throw new Error('Trying to validate unresolved schema reference.')
  },

  resolve: function(schemaDescriptor) {
    var schemaObject = Schema.fromJS(schemaDescriptor)

    for (var key in schemaObject) {
      if (schemaObject[key] instanceof Function) {
        this[key] = schemaObject[key].bind(schemaObject)
      } else {
        this[key] = schemaObject[key]
      }
    }

    delete this.resolve
  },

  publicFunctions: [ 'resolve' ]
})

schema.reference = function(schemaDescriptor) {
  return new SchemaReference()
}

function renewing(ref) {
  ref.resolve = function() {
    Schema.self = schema.self = renewing(new SchemaReference())
    return SchemaReference.prototype.resolve.apply(this, arguments)
  }
  return ref
}

Schema.self = schema.self = renewing(new SchemaReference())

Schema.fromJSON.def(function(sch) {
  if (sch.id == null && sch['$ref'] == null) return

  var id, session = Schema.session

  if (!session.deserialized) session.deserialized = { references: {}, subscribers: {} }

  if (sch.id != null) {
    // This schema can be referenced in the future with the given ID
    id = sch.id

    // Deserializing:
    delete sch.id
    var schemaObject = Schema.fromJSON(sch)
    sch.id = id

    // Storing the schema object and notifying subscribers
    session.deserialized.references[id] = schemaObject
    ;(session.deserialized.subscribers[id] || []).forEach(function(callback) {
      callback(schemaObject)
    })

    return schemaObject

  } else {
    // Referencing a schema given somewhere else with the given ID
    id = sch['$ref']

    // If the referenced schema is already known, we are ready
    if (session.deserialized.references[id]) return session.deserialized.references[id]

    // If not, returning a reference, and when the schema gets known, resolving the reference
    if (!session.deserialized.subscribers[id]) session.deserialized.subscribers[id] = []
    var reference = new SchemaReference()
    session.deserialized.subscribers[id].push(reference.resolve.bind(reference))

    return reference
  }
})

},{"../BaseSchema":2,"../schema":19}],9:[function(require,module,exports){
var RegexpSchema = require('../patterns/regexp')

String.of = function() {
  // Possible signatures : (charset)
  //                       (length, charset)
  //                       (minLength, maxLength, charset)
  var args = Array.prototype.slice.call(arguments).reverse()
    , charset = args[0] ? ('[' + args[0] + ']') : '[a-zA-Z0-9]'
    , max = args[1]
    , min = (args.length > 2) ? args[2] : args[1]
    , regexp = '^' + charset + '{' + (min || 0) + ',' + (max || '') + '}$'

  return new RegexpSchema(RegExp(regexp)).wrap()
}

String.schema = new RegexpSchema().wrap()

},{"../patterns/regexp":17}],10:[function(require,module,exports){
var Schema = require('../BaseSchema')

var AnythingSchema = module.exports = Schema.patterns.AnythingSchema = Schema.extend({
  errors: function(instance) {
    if (instance == null)
      return 'anything cannot be null'

    return false
  },
  validate: function(instance) {
    return instance != null
  },

  toJSON: function() {
    return { type: 'any' }
  }
})

var anything = AnythingSchema.instance = new AnythingSchema()

Schema.fromJS.def(function(sch) {
  if (sch === undefined) return anything
})

Schema.fromJSON.def(function(sch) {
  if (sch.type === 'any') return anything
})

},{"../BaseSchema":2}],11:[function(require,module,exports){
var Schema = require('../BaseSchema')

var ClassSchema = module.exports = Schema.patterns.ClassSchema = Schema.extend({
  initialize: function(constructor) {
    this.constructor = constructor
  },
  getName: function(obj) {
    if (!obj) return obj
    if (obj instanceof Object) {
      return obj.constructor.name
    } else {
      return typeof obj + ' = ' + obj
    }
  },
  errors: function(instance) {
    var middleMessage = ' is not instance of '

    if (instance == null) {
      return this.getName(instance) + middleMessage + this.getName(this.constructor)
    }
    if (!(instance instanceof this.constructor)) {
      return this.getName(instance) + middleMessage + this.getName(this.constructor);
    }
    return false
  },
  validate: function(instance) {
    return instance instanceof this.constructor
  }
})


Schema.fromJS.def(function(constructor) {
  if (!(constructor instanceof Function)) return

  if (constructor.schema instanceof Function) {
    return constructor.schema.unwrap()
  } else {
    return new ClassSchema(constructor)
  }
})

},{"../BaseSchema":2}],12:[function(require,module,exports){
var Schema = require('../BaseSchema')

// Object deep equality
var equal = function(a, b) {
  // if a or b is primitive, simple comparison
  if (Object(a) !== a || Object(b) !== b) return a === b

  // both a and b must be Array, or none of them
  if ((a instanceof Array) !== (b instanceof Array)) return false

  // they must have the same number of properties
  if (Object.keys(a).length !== Object.keys(b).length) return false

  // and every property should be equal
  for (var key in a) {
    if (!equal(a[key], b[key])) return false
  }

  // if every check succeeded, they are deep equal
  return true
}

var EqualitySchema = module.exports = Schema.patterns.EqualitySchema = Schema.extend({
  initialize: function(object) {
    this.object = object
  },
  errors: function(instance) {
    if (!equal(instance, this.object)) {
      return ( instance + ' is not equal to ' + this.object )
    }
    return false
  },
  validate: function(instance) {
    return equal(instance, this.object)
  },

  toJSON: function() {
    var json = Schema.prototype.toJSON.call(this)

    json['enum'] = [this.object]

    return json
  }
})


Schema.fromJS.def(function(sch) {
  if (sch instanceof Array && sch.length === 1) return new EqualitySchema(sch[0])
})

},{"../BaseSchema":2}],13:[function(require,module,exports){
var Schema = require('../BaseSchema')

var NothingSchema = module.exports = Schema.patterns.NothingSchema = Schema.extend({
  errors: function(instance) {
    return false
  },
  validate: function(instance) {
    return instance == null
  },

  toJSON: function() {
    return { type: 'null' }
  }
})

var nothing = NothingSchema.instance = new NothingSchema()

Schema.fromJS.def(function(sch) {
  if (sch === null) return nothing
})

Schema.fromJSON.def(function(sch) {
  if (sch.type === 'null') return nothing
})

},{"../BaseSchema":2}],14:[function(require,module,exports){
var Schema    = require('../BaseSchema')
  , anything  = require('./anything').instance
  , nothing   = require('./nothing').instance

var ObjectSchema = module.exports = Schema.patterns.ObjectSchema = Schema.extend({
  initialize: function(properties, other) {
    var self = this

    this.other = other || anything
    this.properties = properties || []

    // Sorting properties into two groups
    this.stringProps = {}, this.regexpProps = []
    this.properties.forEach(function(property) {
      if (typeof property.key === 'string') {
        self.stringProps[property.key] = property
      } else {
        self.regexpProps.push(property)
      }
    })
  },

  errors: function(instance) {
    var self = this
    if (instance == null)
      return ( instance + ' is not Object' )

    var errors = {}

    // Simple string properties
    Object.keys(this.stringProps).forEach(function(key) {
      var result = self.stringProps[key].value.errors(instance[key])
      if (result) {
        errors[key] = result
      }
    })
    if (Object.keys(errors).length > 0) {
      return errors
    }
    return false
  },
  validate: function(instance) {
    var self = this

    if (instance == null) return false

    // Simple string properties
    var stringPropsValid = Object.keys(this.stringProps).every(function(key) {
      return (self.stringProps[key].min === 0 && !(key in instance)) ||
             (self.stringProps[key].value.validate(instance[key]))
    })
    if (!stringPropsValid) return false

    // If there are no RegExp and other validator, that's all
    if (!this.regexpProps.length && this.other === anything) return true

    // Regexp and other properties
    var checked
    for (var key in instance) {

      // Checking the key against every key regexps
      checked = false
      var regexpPropsValid = Object.keys(this.regexpProps).every(function(key) {
        return (!self.regexpProps[key].key.test(key) ||
                ((checked = true) && self.regexpProps[key].value.validate(instance[key]))
               )
      })
      if (!regexpPropsValid) return false

      // If the key is not matched by regexps and by simple string checks
      // then check it against this.other
      if (!checked && !(key in this.stringProps) && !this.other.validate(instance[key])) return false

    }

    // If all checks passed, the instance conforms to the schema
    return true
  },

  toJSON: Schema.session(function() {
    var i, property, regexp, json = Schema.prototype.toJSON.call(this, true)

    if (json['$ref'] != null) return json

    json.type = 'object'

    for (i in this.stringProps) {
      property = this.stringProps[i]
      json.properties = json.properties || {}
      json.properties[property.key] = property.value.toJSON()
      if (property.min === 1) json.properties[property.key].required = true
      if (property.title) json.properties[property.key].title = property.title
    }

    for (i = 0; i < this.regexpProps.length; i++) {
      property = this.regexpProps[i]
      json.patternProperties = json.patternProperties || {}
      regexp = property.key.toString()
      regexp = regexp.substr(2, regexp.length - 4)
      json.patternProperties[regexp] = property.value.toJSON()
      if (property.title) json.patternProperties[regexp].title = property.title
    }

    if (this.other !== anything) {
      json.additionalProperties = (this.other === nothing) ? false : this.other.toJSON()
    }

    return json
  })
})

// Testing if a given string is a real regexp or just a single string escaped
// If it is just a string escaped, return the string. Otherwise return the regexp
var regexpString = (function() {
  // Special characters that should be escaped when describing a regular string in regexp
  var shouldBeEscaped = '[](){}^$?*+.'.split('').map(function(element) {
    return RegExp('(\\\\)*\\' + element, 'g')
  })
  // Special characters that shouldn't be escaped when describing a regular string in regexp
  var shouldntBeEscaped = 'bBwWdDsS'.split('').map(function(element) {
    return RegExp('(\\\\)*' + element, 'g')
  })

  return function(string) {
    var i, j, match

    for (i = 0; i < shouldBeEscaped.length; i++) {
      match = string.match(shouldBeEscaped[i])
      if (!match) continue
      for (j = 0; j < match.length; j++) {
        // If it is not escaped, it must be a regexp (e.g. [, \\[, \\\\[, etc.)
        if (match[j].length % 2 === 1) return RegExp('^' + string + '$')
      }
    }
    for (i = 0; i < shouldntBeEscaped.length; i++) {
      match = string.match(shouldntBeEscaped[i])
      if (!match) continue
      for (j = 0; j < match.length; j++) {
        // If it is escaped, it must be a regexp (e.g. \b, \\\b, \\\\\b, etc.)
        if (match[j].length % 2 === 0) return RegExp('^' + string + '$')
      }
    }

    // It is not a real regexp. Removing the escaping.
    for (i = 0; i < shouldBeEscaped.length; i++) {
      string = string.replace(shouldBeEscaped[i], function(match) {
        return match.substr(1)
      })
    }

    return string
  }
})()

Schema.fromJS.def(function(object) {
  if (!(object instanceof Object)) return

  var other, property, properties = []
  for (var key in object) {
    property = {
      value: Schema.fromJS(object[key])
    }

    // '*' as property name means 'every other property should match this schema'
    if (key === '*') {
      other = property.value
      continue
    }

    // Handling special chars at the beginning of the property name
    property.min = (key[0] === '*' || key[0] === '?') ? 0 : 1
    property.max = (key[0] === '*' || key[0] === '+') ? Infinity : 1
    key = key.replace(/^[*?+]/, '')

    // Handling property title that looks like: { 'a : an important property' : Number }
    key = key.replace(/\s*:[^:]+$/, function(match) {
      property.title = match.replace(/^\s*:\s*/, '')
      return ''
    })

    // Testing if it is regexp-like or not. If it is, then converting to a regexp object
    property.key = regexpString(key)

    properties.push(property)
  }

  return new ObjectSchema(properties, other)
})

Schema.fromJSON.def(function(json) {
  if (!json || json.type !== 'object') return

  var key, properties = []
  for (key in json.properties) {
    properties.push({
      min: json.properties[key].required ? 1 : 0,
      max: 1,
      key: key,
      value: Schema.fromJSON(json.properties[key]),
      title: json.properties[key].title
    })
  }
  for (key in json.patternProperties) {
    properties.push({
      min: 0,
      max: Infinity,
      key: RegExp('^' + key + '$'),
      value: Schema.fromJSON(json.patternProperties[key]),
      title: json.patternProperties[key].title
    })
  }

  var other
  if (json.additionalProperties !== undefined) {
    other = json.additionalProperties === false ? nothing : Schema.fromJSON(json.additionalProperties)
  }

  return new ObjectSchema(properties, other)
})

},{"../BaseSchema":2,"./anything":10,"./nothing":13}],15:[function(require,module,exports){
var Schema = require('../BaseSchema')
  , EqualitySchema = require('../patterns/equality')

var OrSchema = module.exports = Schema.patterns.OrSchema = Schema.extend({
  initialize: function(schemas) {
    this.schemas = schemas
  },
  errors: function(instance) {
    var self = this

    var errors = []
    if (!this.validate(instance)) {
      this.schemas.forEach(function(sch) {
        var result = sch.errors(instance)
        if (result) {
          errors.push(result)
        }
      })
      if (errors.length > 0) {
        return errors.join('   OR   ')
      }
    }
    return false
  },
  validate: function(instance) {
    return this.schemas.some(function(sch) {
      return sch.validate(instance)
    })
  },

  toJSON: Schema.session(function() {
    var json = Schema.prototype.toJSON.call(this, true)
      , subjsons = this.schemas.map(function(sch) {
          return sch.toJSON()
        })
      , onlyEquality = subjsons.every(function(json) {
          return json['enum'] instanceof Array && json['enum'].length === 1
        })

    if (json['$ref'] != null) return json

    if (onlyEquality) {
      json['enum'] = subjsons.map(function(json) {
        return json['enum'][0]
      })

    } else {
      json['type'] = subjsons.map(function(json) {
        var simpleType = typeof json.type === 'string' && Object.keys(json).length === 1
        return simpleType ? json.type : json
      })
    }

    return json
  })
})


Schema.fromJS.def(function(schemas) {
  if (schemas instanceof Array) return new OrSchema(schemas.map(function(sch) {
    return sch === undefined ? Schema.self : Schema.fromJS(sch)
  }))
})

Schema.fromJSON.def(function(sch) {
  if (!sch) return

  if (sch['enum'] instanceof Array) {
    return new OrSchema(sch['enum'].map(function(object) {
      return new EqualitySchema(object)
    }))
  }

  if (sch['type'] instanceof Array) {
    return new OrSchema(sch['type'].map(function(type) {
      return Schema.fromJSON(typeof type === 'string' ? {
        type: type
      } : type)
    }))
  }
})

},{"../BaseSchema":2,"../patterns/equality":12}],16:[function(require,module,exports){
var Schema = require('../BaseSchema')

var ReferenceSchema = module.exports = Schema.patterns.ReferenceSchema = Schema.extend({
  initialize: function(value) {
    this.value = value
  },
  getName: function(obj) {
    if (obj instanceof Object) {
      return obj.constructor.name + ' = ' + obj
    } else {
      return typeof obj + ' = ' + obj
    }
  },
  errors: function(instance) {
    if (instance == null) {
      return ( instance + ' is not a reference' )
    }
    if (instance !== this.value) {
      var middleMessage = ' is not reference to '
      return ( this.getName(instance) + middleMessage + this.getName(this.value) )
    }
    return false
  },
  validate: function(instance) {
    return instance === this.value
  },

  toJSON: function() {
    var json = Schema.prototype.toJSON.call(this)

    json['enum'] = [this.value]

    return json
  }
})


Schema.fromJS.def(function(value) {
  return new ReferenceSchema(value)
})

},{"../BaseSchema":2}],17:[function(require,module,exports){
var Schema = require('../BaseSchema')

var RegexpSchema = module.exports = Schema.patterns.RegexpSchema = Schema.extend({
  initialize: function(regexp) {
    this.regexp = regexp
  },
  errors: function(instance) {
    var message
    if (!(Object(instance) instanceof String)) {
      message = instance + ' is not a String'
    } else if (this.regexp && !this.regexp.test(instance)) {
      message = instance + ' is not matched with RegExp -> ' + this.regexp
    }

    if (message)
      return message
    return false
  },
  validate: function(instance) {
    return Object(instance) instanceof String && (!this.regexp || this.regexp.test(instance))
  },

  toJSON: function() {
    var json = Schema.prototype.toJSON.call(this)

    json.type = 'string'

    if (this.regexp) {
      json.pattern = this.regexp.toString()
      json.pattern = json.pattern.substr(1, json.pattern.length - 2)
    }

    return json
  }
})

Schema.fromJSON.def(function(sch) {
  if (!sch || sch.type !== 'string') return

  if ('pattern' in sch) {
    return new RegexpSchema(RegExp('^' + sch.pattern + '$'))
  } else if ('minLength' in sch || 'maxLength' in sch) {
    return new RegexpSchema(RegExp('^.{' + [sch.minLength || 0, sch.maxLength].join(',') + '}$'))
  } else {
    return new RegexpSchema()
  }
})

Schema.fromJS.def(function(regexp) {
  if (regexp instanceof RegExp) return new RegexpSchema(regexp)
})

},{"../BaseSchema":2}],18:[function(require,module,exports){
var Schema = require('../BaseSchema')

Schema.fromJS.def(function(sch) {
  if (sch instanceof Schema) return sch
})

},{"../BaseSchema":2}],19:[function(require,module,exports){
var Schema = require('./BaseSchema')

schema = module.exports = function(schemaDescription) {
  var doc, schemaObject

  if (arguments.length === 2) {
    doc = schemaDescription
    schemaDescription = arguments[1]
  }

  if (this instanceof schema) {
    // When called with new, create a schema object and then return the schema function
    var constructor = Schema.extend(schemaDescription)
    schemaObject = new constructor()
    if (doc) schemaObject.doc = doc
    return schemaObject.wrap()

  } else {
    // When called as simple function, forward everything to fromJS
    // and then resolve schema.self to the resulting schema object
    schemaObject = Schema.fromJS(schemaDescription)
    schema.self.resolve(schemaObject)
    if (doc) schemaObject.doc = doc
    return schemaObject.wrap()
  }
}

schema.Schema = Schema

schema.toJSON = function(sch) {
  return Schema.fromJS(sch).toJSON()
}

schema.fromJS = function(sch) {
  return Schema.fromJS(sch).wrap()
}

schema.fromJSON = function(sch) {
  return Schema.fromJSON(sch).wrap()
}

},{"./BaseSchema":2}]},{},[1]);
