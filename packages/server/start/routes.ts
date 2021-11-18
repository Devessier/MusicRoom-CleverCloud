/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/
// import Redis from '@ioc:Adonis/Addons/Redis';
import Route from '@ioc:Adonis/Core/Route';

Route.get('/search/track/:query', 'TracksSearchesController.searchTrackName');

Route.post('/search/rooms', 'MtvRoomsHttpController.fetchMtvRooms');

Route.post('/search/users', 'SearchUsersController.searchUsers');

Route.get('/ping', () => console.log('pong'));

/// Temporal Routes ///

Route.post(
    '/temporal/mtv-creation-acknowledgement',
    'Temporal/TemporalToServerController.mtvCreationAcknowledgement',
);

Route.post('/temporal/play', 'Temporal/TemporalToServerController.play');

Route.post('/temporal/pause', 'Temporal/TemporalToServerController.pause');

Route.post('/temporal/join', 'Temporal/TemporalToServerController.join');

Route.post('/temporal/leave', 'Temporal/TemporalToServerController.leave');

Route.post(
    '/temporal/change-user-emitting-device',
    'Temporal/TemporalToServerController.mtvChangeUserEmittingDeviceAcknowledgement',
);

Route.post(
    'temporal/user-length-update',
    'Temporal/TemporalToServerController.userLengthUpdate',
);

Route.post(
    '/temporal/suggest-or-vote-update',
    'Temporal/TemporalToServerController.suggestOrVoteTracksListUpdate',
);

Route.post(
    '/temporal/acknowledge-tracks-suggestion',
    'Temporal/TemporalToServerController.acknowledgeTracksSuggestion',
);

Route.post(
    '/temporal/acknowledge-tracks-suggestion-fail',
    'Temporal/TemporalToServerController.acknowledgeTracksSuggestionFail',
);

Route.post(
    '/temporal/acknowledge-user-vote-for-track',
    'Temporal/TemporalToServerController.acknowledgeUserVoteForTrack',
);

Route.get('/proxy-places-api/*', 'PlacesApisController.proxyPlacesAPIRequest');

Route.post(
    '/temporal/acknowledge-update-user-fits-position-constraint',
    'Temporal/TemporalToServerController.acknowledgeUserVoteForTrack',
);

Route.post(
    '/temporal/acknowledge-update-delegation-owner',
    'Temporal/TemporalToServerController.acknowledgeUpdateDelegationOwner',
);

Route.post(
    '/temporal/acknowledge-update-control-and-delegation-permission',
    'Temporal/TemporalToServerController.acknowledgeUpdateControlAndDelegationPermission',
);

Route.post(
    '/temporal/acknowledge-update-time-constraint',
    'Temporal/TemporalToServerController.acknowledgeUpdateTimeConstraint',
);

/// //////// ////// ///

Route.get('/', () => {
    return { hello: 'world' };
});
