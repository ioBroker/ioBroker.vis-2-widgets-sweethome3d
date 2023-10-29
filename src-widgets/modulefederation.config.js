const makeFederation = require('@iobroker/vis-2-widgets-react-dev/modulefederation.config');

module.exports = makeFederation(
    'vis2SweetHome3dWidgets',
    {
        './SweetHome3d': './src/SweetHome3d',
        './translations': './src/translations',
    }
);