module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // We'll still get warnings but not errors for these rules
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'warn'
  }
};
