var jsonSchemaUser = {
  '$schema': 'http://json-schema.org/draft-04/schema#',
  'type': 'object',
  'description': 'User Entity Schema (no required fields)',
  'properties': {
    // 'id': {
    //   'type': 'string',
    //   'description': 'id in format UUID v4',
    //   'pattern': '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
    // },
    '_updated': { 'description': 'last update nano timestamp', 'type': 'integer', 'minimum': 0 },
    '_created': { 'description': 'creation nano timestamp', 'type': 'integer', 'format': 'email', 'minimum': 0 },
    'username': {
      'description': 'username allowed characters:[a-zA-Z0-9_-] min:3 max:16',
      'type': 'string',
      'pattern': '^[a-zA-Z0-9_-]{3,32}$'
    },
    'status': {
      'description': '0 - not active, 1 - waiting , 2 - active, 3 - blocked',
      'type': 'integer',
      'minimum': 0,
      'maximum': 5
    },
    'email': { 'description': 'valid email', 'type': 'string', 'format': 'email' },
    'password': {
      'description': 'Minimum 6 characters at least 1 Uppercase Alphabet, 1 Lowercase Alphabet and 1 Number',
      'type': 'string',
      'pattern': '^[a-zA-Z0-9_#?!@$%^&*-]{6,30}$'

    },
    'confirm': {
      'type': 'string'
    },
    'firstName': { 'type': 'string', 'minLength': 2, 'maxLength': 255 },
    'lastName': { 'type': 'string', 'minLength': 2, 'maxLength': 255 }
  }
}
var jsonSchemaQueryByTimestamp = {
  type: 'object',
  required: ['from'],
  'properties': {
    from: { 'type': 'integer' },
    to: { 'type': 'integer' }
  }
}
var jsonSchemaRes = {
  type: 'object',
  'properties': {
    success: { 'type': 'string' },
    error: { 'type': 'string' }
  }
}
var jsonSchemaQueryRes = {
  'type': 'array',
  'items': jsonSchemaUser
}
module.exports = {
  rpcOut: {
  },
  eventsIn: {

  },
  eventsOut: {

  },
  methods: {
    'create': {
      public: true,
      responseType: 'response',
      requestSchema: Object.assign({required: ['username', 'email', 'password', 'confirm']}, jsonSchemaUser),
      responseSchema: jsonSchemaRes
    },
    'read': {
      public: true,
      responseType: 'response',
      requestSchema: Object.assign({required: ['username']}, jsonSchemaUser),
      responseSchema: jsonSchemaUser
    },
    'privateInfo': {
      public: true,
      responseType: 'response',
      requestSchema: Object.assign({required: ['username']}, jsonSchemaUser),
      responseSchema: jsonSchemaUser
    },
    'update': {
      public: true,
      responseType: 'response',
      requestSchema: Object.assign({required: ['username']}, jsonSchemaUser),
      responseSchema: jsonSchemaRes
    },
    'remove': {
      public: true,
      responseType: 'response',
      requestSchema: Object.assign({required: ['username']}, jsonSchemaUser),
      responseSchema: jsonSchemaRes
    },
    'queryByTimestamp': {
      public: true,
      responseType: 'response',
      requestSchema: jsonSchemaQueryByTimestamp,
      responseSchema: jsonSchemaQueryRes
    }
  }
}
