module.exports = {
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
  permissions: {
    description: 'permissions',
    type: 'array',
    items: {type: 'array'}
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
