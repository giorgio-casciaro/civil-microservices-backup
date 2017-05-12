var jsFields = require('./lib/JSchemaFields')
var jsUserById = { properties: { id: jsFields.id }, required: ['id'] }
var jsRes = { properties: {
  success: { type: 'string' },
  error: { type: 'string' },
  method: { type: 'string' },
  type: { type: 'string' },
  id: jsFields.id
}}
var loginRes = { properties: {
  success: { type: 'string' },
  error: { type: 'string' },
  method: { type: 'string' },
  type: { type: 'string' },
  token: { type: 'string' },
  id: jsFields.id
}}
var jsRead = { properties: { id: jsFields.id, publicName: jsFields.publicName, pic: jsFields.pic, status: jsFields.status } }
var jsReadPrivate = { properties: { id: jsFields.id, email: jsFields.email, emailStatus: jsFields.emailStatus, publicName: jsFields.publicName, pic: jsFields.pic, status: jsFields.status } }
var jsQueryRes = { type: 'array', items: jsRead }

var jsCanReq = { properties: { data: { type: 'object' } } }
var jsCanRes = { properties: { success: { type: 'string' }, error: { type: 'string' } } }

module.exports = {
  rpcOut: { },
  eventsIn: {
    'getPermissions': {
      method: 'getPermissions'
    }
  },
  eventsOut: {
    'getPermissions': {
      multipleResponse: true,
      requestSchema: jsCanReq,
      responseSchema: jsCanRes
    }
  },
  methods: {
    'create': {
      public: true,
      responseType: 'response',
      requestSchema: { properties: { email: jsFields.email }, required: [ 'email' ] },
      responseSchema: jsRes
    },
    'getPermissions': {
      public: false,
      responseType: 'response',
      requestSchema: { properties: { } },
      responseSchema: { properties: { permissions: jsFields.permissions } }
    },
    'readEmailConfirmationCode': {
      public: (process.env.NODE_ENV === 'development'),
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
    'readPrivate': {
      public: true,
      responseType: 'response',
      requestSchema: jsUserById,
      responseSchema: jsReadPrivate
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
        required: [ 'id', 'password', 'confirmPassword', 'oldPassword' ]
      },
      responseSchema: jsRes
    },
    'assignPassword': {
      public: true,
      responseType: 'response',
      requestSchema: {
        properties: { id: jsFields.id, password: jsFields.password, confirmPassword: jsFields.password },
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
      responseSchema: loginRes
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
