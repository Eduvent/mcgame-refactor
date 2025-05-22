const ROLES = {
    USER: 'user',
    TRADER: 'trader',
    ADMIN: 'admin'
};

const ROLE_PERMISSIONS = {
    [ROLES.USER]: ['read:own-profile', 'create:order', 'cancel:own-order'],
    [ROLES.TRADER]: ['read:own-profile', 'create:order', 'cancel:own-order', 'unlimited:funds'],
    [ROLES.ADMIN]: ['*'] // All permissions
};

module.exports = {
    ROLES,
    ROLE_PERMISSIONS
};