var jsFields = {
  id: {
    type: 'string',
    description: 'id in format UUID v4',
    pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
  },
  updated: { description: 'last update nano timestamp', type: 'integer', minimum: 0 },
  created: { description: 'creation nano timestamp', type: 'integer', minimum: 0 },
  publicName: {
    description: 'public name',
    type: 'string'
  },
  pic: {
    description: 'pic link on https',
    type: 'string',
    pattern: '(http(s?):)|([/|.|\\w|\\s])*\\.(?:jpg|gif|png)$'
  },
  status: {
    description: '0 - not active, 1 - waiting , 2 - active, 3 - deregistered , 4 - blocked',
    type: 'integer',
    minimum: 0,
    maximum: 5
  },
  email: { description: 'valid email', type: 'string', 'format': 'email' },
  emailStatus: {
    description: '0 - not active, 1 - waiting , 2 - confirmed',
    type: 'integer',
    minimum: 0,
    maximum: 5
  },
  emailConfirmationCode: {
    type: 'string',
    description: 'emailConfirmationCode in format UUID v4',
    pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
  },
  salt: {
    type: 'string',
    description: 'salt in format UUID v4',
    pattern: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
  },
  password: {
    description: 'Minimum 6 characters at least 1 Uppercase Alphabet, 1 Lowercase Alphabet and 1 Number',
    type: 'string',
    pattern: '^[a-zA-Z0-9_#?!@$%^&*-]{6,30}$'
  },
  firstName: { type: 'string', 'minLength': 2, 'maxLength': 255 },
  birth: { description: 'birth timestamp', type: 'integer', minimum: 0 },
  lastName: { type: 'string', 'minLength': 2, 'maxLength': 255 }
}

var jsUserById = { properties: { id: jsFields.id }, required: ['id'] }
var jsRes = { properties: {
  success: { type: 'string' },
  error: { type: 'string' },
  method: { type: 'string' },
  type: { type: 'string' },
  id: jsFields.id
}}
var jsRead = { properties: { id: jsFields.id, email: jsFields.email, publicName: jsFields.publicName, pic: jsFields.pic, status: jsFields.status } }
var jsQueryRes = { type: 'array', items: jsRead }

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
      requestSchema: { properties: { email: jsFields.email }, required: [ 'email' ] },
      responseSchema: jsRes
    },
    'readEmailConfirmationCode': {
      public: false,
      responseType: 'response',
      requestSchema: jsUserById,
      responseSchema: { properties: { emailConfirmationCode: jsFields.emailConfirmationCode } }
    },
    'confirmEmail': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, emailConfirmationCode: jsFields.emailConfirmationCode },
        required: [ 'id', 'emailConfirmationCode' ]
      },
      responseSchema: jsRes
    },
    'read': {
      public: true,
      responseType: 'response',
      requestSchema: jsUserById,
      responseSchema: jsRead
    },
    'updatePublicName': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, publicName: jsFields.publicName },
        required: [ 'id', 'publicName' ]
      },
      responseSchema: jsRes
    },
    'updatePic': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, pic: jsFields.pic },
        required: [ 'id', 'pic' ]
      },
      responseSchema: jsRes
    },
    'updatePassword': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, password: jsFields.password, confirmPassword: jsFields.password, oldPassword: jsFields.password },
        required: [ 'id', 'password', 'confirmPassword' ]
      },
      responseSchema: jsRes
    },
    'login': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { email: jsFields.email, password: jsFields.password },
        required: [ 'email', 'password' ]
      },
      responseSchema: jsRes
    },
    'updatePersonalInfo': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, firstName: jsFields.firstName, lastName: jsFields.lastName, birth: jsFields.birth },
        required: [ 'id' ]
      },
      responseSchema: jsRes
    },
    'readPersonalInfo': {
      public: false,
      responseType: 'response',
      requestSchema: jsUserById,
      responseSchema: {
        properties: { id: jsFields.id, firstName: jsFields.firstName, lastName: jsFields.lastName, birth: jsFields.birth },
        required: [ 'id' ]
      }
    },
    'remove': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, status: jsFields.status },
        required: [ 'id', 'status' ]
      },
      responseSchema: jsRes
    },
    'queryByTimestamp': {
      public: true,
      responseType: 'response',
      requestSchema: { required: ['from'], properties: { from: { type: 'integer' }, to: { type: 'integer' } } },
      responseSchema: jsQueryRes
    }
  }
}
