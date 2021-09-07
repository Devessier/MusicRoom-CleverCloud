import { MtvWorkflowStateWithUserRelatedInformation } from '@musicroom/types';
import { NavigationContainer } from '@react-navigation/native';
import { datatype, random } from 'faker';
import React from 'react';
import { RootNavigator } from '../navigation';
import { isReadyRef, navigationRef } from '../navigation/RootNavigation';
import { serverSocket } from '../services/websockets';
import { generateTrackMetadata } from '../tests/data';
import { fireEvent, render, within } from '../tests/tests-utils';

function noop() {
    return undefined;
}

test.only(`
User should go to the musicPlayer into the tracks tab and hit a track card to vote for it
After the vote has been accepted a checked icon will appears next the track score
Also the scroll view will be updated to the track card position
`, async () => {
    const deviceID = datatype.uuid();
    const deviceName = random.word();
    const userID = datatype.uuid();

    const state: MtvWorkflowStateWithUserRelatedInformation = {
        roomID: datatype.uuid(),
        name: random.word(),
        playing: false,
        usersLength: 1,
        userRelatedInformation: {
            emittingDeviceID: deviceID,
            userID,
            tracksVotedFor: [],
        },
        currentTrack: null,
        roomCreatorUserID: userID,
        tracks: [
            generateTrackMetadata({
                score: 0,
            }),
            generateTrackMetadata({
                score: 0,
            }),
            generateTrackMetadata({
                score: 0,
            }),
            generateTrackMetadata({
                score: 0,
            }),
            generateTrackMetadata({
                score: 0,
            }),
            generateTrackMetadata({
                score: 0,
            }),
            generateTrackMetadata({
                score: 0,
            }),
            generateTrackMetadata({
                score: 0,
            }),
            generateTrackMetadata({
                score: 0,
            }),
        ],
        minimumScoreToBePlayed: 42,
    };

    if (state.tracks === null) throw new Error('state.track is null');

    let voteForTrackHasBeenCalled = false;
    serverSocket.on('VOTE_FOR_TRACK', ({ trackID }) => {
        if (state.tracks === null) throw new Error('state.track is null');
        state.userRelatedInformation.tracksVotedFor.push(trackID);

        state.tracks = state.tracks
            .map((track) => {
                if (track.id === trackID) {
                    return {
                        ...track,
                        score: track.score + 1,
                    };
                }
                return track;
            })
            .sort((a, b) => (a.score < b.score ? 1 : -1));

        serverSocket.emit('VOTE_OR_SUGGEST_TRACK_CALLBACK', state);
        voteForTrackHasBeenCalled = true;
    });

    const {
        findByText,
        getByTestId,
        getAllByText,
        findByA11yState,
        queryAllByA11yState,
        debug,
    } = render(
        <NavigationContainer
            ref={navigationRef}
            onReady={() => {
                isReadyRef.current = true;
            }}
        >
            <RootNavigator colorScheme="dark" toggleColorScheme={noop} />
        </NavigationContainer>,
    );

    /**
     * Retrieve context to have the appMusicPlayerMachine directly
     * in state connectedToRoom
     * And toggle mtv room full screen
     */

    serverSocket.emit('RETRIEVE_CONTEXT', state);

    const musicPlayerMini = getByTestId('music-player-mini');
    expect(musicPlayerMini).toBeTruthy();

    fireEvent.press(musicPlayerMini);

    const musicPlayerFullScreen = await findByA11yState({ expanded: true });
    expect(musicPlayerFullScreen).toBeTruthy();

    /**
     * Find the last track card element
     */
    const lastTrackElement = state.tracks[state.tracks.length - 1];
    const lastTrack = await within(musicPlayerFullScreen).findByText(
        lastTrackElement.title,
    );
    expect(lastTrack).toBeTruthy();

    fireEvent.press(lastTrack);

    const firsTrackElement = state.tracks[0];
    expect(
        await within(musicPlayerFullScreen).findAllByText(
            new RegExp(
                `${firsTrackElement.score}/${state.minimumScoreToBePlayed}`,
            ),
        ),
    ).toBeTruthy();

    const votedTrackCard = await within(musicPlayerFullScreen).findByText(
        firsTrackElement.title,
    );
    expect(votedTrackCard).toBeDisabled();
});
