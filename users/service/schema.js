var jsonSchemaReqUser = {
  '$schema': 'http://json-schema.org/draft-04/schema#',
  'type': 'object',
  'description': 'User Entity Schema (no required fields)',
  'properties': {
    // 'id': {
    //   'type': 'string',
    //   'description': 'id in format UUID v4',
    //   'pattern': '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
    // },
    'username': {
      'type': 'string',
      'description': 'username allowed characters:[a-zA-Z0-9_-] min:3 max:16',
      'pattern': '^[a-zA-Z0-9_-]{3,16}$'
    },
    'email': { 'type': 'string', 'format': 'email' },
    'password': { 'type': 'string' },
    'firstName': { 'type': 'string', 'minLength': 2, 'maxLength': 255 },
    'lastName': { 'type': 'string', 'minLength': 2, 'maxLength': 255 }
  }
}
var jsonSchemaReqQueryByTimestamp = {
  type: 'object',
  required: ['from'],
  'properties': {
    from: { 'type': 'number' },
    to: { 'type': 'number' }
  }
}
var jsonSchemaRes = {
  'oneOf': [
    {
      type: 'object',
      'properties': {
        success: { 'type': 'string' }
      }
    },
    { type: 'object',
      'properties': {
        error: { 'type': 'string' }
      }
    }
  ]
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
      responseSchema: jsonSchemaRes,
      requestSchema: Object.assign({required: ['username', 'email', 'password']}, jsonSchemaReqUser)
    },
    'read': {
      public: true,
      responseType: 'response',
      responseSchema: jsonSchemaReqUser,
      requestSchema: Object.assign({required: ['username']}, jsonSchemaReqUser)
    },
    'update': {
      public: true,
      responseType: 'response',
      responseSchema: jsonSchemaRes,
      requestSchema: Object.assign({required: ['username']}, jsonSchemaReqUser)
    },
    'remove': {
      public: true,
      responseType: 'response',
      responseSchema: {'type': 'object'},
      requestSchema: Object.assign({required: ['username']}, jsonSchemaReqUser)
    },
    'queryByTimestamp': {
      public: true,
      responseType: 'response',
      responseSchema: jsonSchemaRes,
      requestSchema: jsonSchemaReqQueryByTimestamp
    }
  }
}
