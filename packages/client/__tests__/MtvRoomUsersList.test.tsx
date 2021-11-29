import { MtvPlayingModes, MtvWorkflowState } from '@musicroom/types';
import { NavigationContainer } from '@react-navigation/native';
import { datatype, random } from 'faker';
import React from 'react';
import { RootNavigator } from '../navigation';
import { isReadyRef, navigationRef } from '../navigation/RootNavigation';
import { serverSocket } from '../services/websockets';
import { generateTrackMetadata } from '../tests/data';
import {
    fireEvent,
    getFakeUsersList,
    noop,
    render,
    waitFor,
    within,
    waitForElementToBeRemoved,
} from '../tests/tests-utils';

test('Clearing search input displays users without filtering', async () => {
    const tracksList = [generateTrackMetadata(), generateTrackMetadata()];
    const roomCreatorUserID = datatype.uuid();
    const initialState: MtvWorkflowState = {
        name: random.words(),
        roomID: datatype.uuid(),
        playing: false,
        playingMode: MtvPlayingModes.Values.DIRECT,
        roomCreatorUserID,
        isOpen: true,
        isOpenOnlyInvitedUsersCanVote: false,
        hasTimeAndPositionConstraints: false,
        timeConstraintIsValid: null,
        delegationOwnerUserID: null,
        userRelatedInformation: {
            hasControlAndDelegationPermission: true,
            userFitsPositionConstraint: null,
            userHasBeenInvited: false,
            emittingDeviceID: datatype.uuid(),
            userID: roomCreatorUserID,
            tracksVotedFor: [],
        },
        usersLength: 1,
        currentTrack: {
            ...tracksList[0],
            elapsed: 0,
        },
        tracks: tracksList.slice(1),
        minimumScoreToBePlayed: 1,
    };

    const fakeUsersArray = getFakeUsersList({
        directMode: true,
        isMeIsCreator: true,
    });

    serverSocket.on('GET_CONTEXT', () => {
        serverSocket.emit('RETRIEVE_CONTEXT', initialState);
    });

    serverSocket.on('GET_USERS_LIST', (cb) => {
        cb(fakeUsersArray);
    });

    const screen = render(
        <NavigationContainer
            ref={navigationRef}
            onReady={() => {
                isReadyRef.current = true;
            }}
        >
            <RootNavigator colorScheme="dark" toggleColorScheme={noop} />
        </NavigationContainer>,
    );

    expect(screen.getAllByText(/home/i).length).toBeGreaterThanOrEqual(1);

    const musicPlayerMini = screen.getByTestId('music-player-mini');
    expect(musicPlayerMini).toBeTruthy();

    const miniPlayerTrackTitle = await within(musicPlayerMini).findByText(
        new RegExp(`${tracksList[0].title}.*${tracksList[0].artistName}`),
    );
    expect(miniPlayerTrackTitle).toBeTruthy();

    fireEvent.press(miniPlayerTrackTitle);

    const musicPlayerFullScreen = await screen.findByA11yState({
        expanded: true,
    });
    expect(musicPlayerFullScreen).toBeTruthy();
    expect(
        within(musicPlayerFullScreen).getByText(tracksList[0].title),
    ).toBeTruthy();

    const listenersButton = await screen.getByText(/listeners/i);
    expect(listenersButton).toBeTruthy();

    fireEvent.press(listenersButton);

    await waitFor(() => {
        const usersListScreen = screen.getByText(/users.*list/i);
        expect(usersListScreen).toBeTruthy();
    });

    const initiallyDisplayedUser = fakeUsersArray[0];
    await waitFor(() => {
        const initiallyDisplayedUserCard = screen.getByTestId(
            `${initiallyDisplayedUser.nickname}-user-card`,
        );
        expect(initiallyDisplayedUserCard).toBeTruthy();
    });

    const searchUserTextField = await screen.findByPlaceholderText(
        /search.*user.*/i,
    );
    expect(searchUserTextField).toBeTruthy();

    const waitForInitiallyDisplayedUserToDisappearPromise =
        waitForElementToBeRemoved(() =>
            screen.getByTestId(`${initiallyDisplayedUser.nickname}-user-card`),
        );

    const searchedUser = fakeUsersArray[1];
    const searchQuery = searchedUser.nickname.slice(0, 4);
    fireEvent(searchUserTextField, 'focus');
    fireEvent.changeText(searchUserTextField, searchQuery);
    fireEvent(searchUserTextField, 'submitEditing');

    await waitForInitiallyDisplayedUserToDisappearPromise;

    await waitFor(() => {
        const searchedUserCard = screen.getByTestId(
            `${searchedUser.nickname}-user-card`,
        );
        expect(searchedUserCard).toBeTruthy();
    });

    const clearSearchInputButton =
        screen.getByLabelText(/clear.*search.*input/i);
    expect(clearSearchInputButton).toBeTruthy();

    fireEvent.press(clearSearchInputButton);

    // Initially displayed user is displayed again.
    await waitFor(() => {
        const initiallyDisplayedUserCard = screen.getByTestId(
            `${initiallyDisplayedUser.nickname}-user-card`,
        );
        expect(initiallyDisplayedUserCard).toBeTruthy();
    });
    expect(searchUserTextField).toHaveProp('value', '');
});

test('Cancelling search input displays users without filtering', async () => {
    const tracksList = [generateTrackMetadata(), generateTrackMetadata()];
    const roomCreatorUserID = datatype.uuid();
    const initialState: MtvWorkflowState = {
        name: random.words(),
        roomID: datatype.uuid(),
        playing: false,
        playingMode: MtvPlayingModes.Values.DIRECT,
        roomCreatorUserID,
        isOpen: true,
        isOpenOnlyInvitedUsersCanVote: false,
        hasTimeAndPositionConstraints: false,
        timeConstraintIsValid: null,
        delegationOwnerUserID: null,
        userRelatedInformation: {
            hasControlAndDelegationPermission: true,
            userFitsPositionConstraint: null,
            userHasBeenInvited: false,
            emittingDeviceID: datatype.uuid(),
            userID: roomCreatorUserID,
            tracksVotedFor: [],
        },
        usersLength: 1,
        currentTrack: {
            ...tracksList[0],
            elapsed: 0,
        },
        tracks: tracksList.slice(1),
        minimumScoreToBePlayed: 1,
    };

    const fakeUsersArray = getFakeUsersList({
        directMode: true,
        isMeIsCreator: true,
    });

    serverSocket.on('GET_CONTEXT', () => {
        serverSocket.emit('RETRIEVE_CONTEXT', initialState);
    });

    serverSocket.on('GET_USERS_LIST', (cb) => {
        cb(fakeUsersArray);
    });

    const screen = render(
        <NavigationContainer
            ref={navigationRef}
            onReady={() => {
                isReadyRef.current = true;
            }}
        >
            <RootNavigator colorScheme="dark" toggleColorScheme={noop} />
        </NavigationContainer>,
    );

    expect(screen.getAllByText(/home/i).length).toBeGreaterThanOrEqual(1);

    const musicPlayerMini = screen.getByTestId('music-player-mini');
    expect(musicPlayerMini).toBeTruthy();

    const miniPlayerTrackTitle = await within(musicPlayerMini).findByText(
        new RegExp(`${tracksList[0].title}.*${tracksList[0].artistName}`),
    );
    expect(miniPlayerTrackTitle).toBeTruthy();

    fireEvent.press(miniPlayerTrackTitle);

    const musicPlayerFullScreen = await screen.findByA11yState({
        expanded: true,
    });
    expect(musicPlayerFullScreen).toBeTruthy();
    expect(
        within(musicPlayerFullScreen).getByText(tracksList[0].title),
    ).toBeTruthy();

    const listenersButton = await screen.getByText(/listeners/i);
    expect(listenersButton).toBeTruthy();

    fireEvent.press(listenersButton);

    await waitFor(() => {
        const usersListScreen = screen.getByText(/users.*list/i);
        expect(usersListScreen).toBeTruthy();
    });

    const initiallyDisplayedUser = fakeUsersArray[0];
    await waitFor(() => {
        const initiallyDisplayedUserCard = screen.getByTestId(
            `${initiallyDisplayedUser.nickname}-user-card`,
        );
        expect(initiallyDisplayedUserCard).toBeTruthy();
    });

    const searchUserTextField = await screen.findByPlaceholderText(
        /search.*user.*/i,
    );
    expect(searchUserTextField).toBeTruthy();

    const waitForInitiallyDisplayedUserToDisappearPromise =
        waitForElementToBeRemoved(() =>
            screen.getByTestId(`${initiallyDisplayedUser.nickname}-user-card`),
        );

    const searchedUser = fakeUsersArray[1];
    const searchQuery = searchedUser.nickname.slice(0, 4);
    fireEvent(searchUserTextField, 'focus');
    fireEvent.changeText(searchUserTextField, searchQuery);
    fireEvent(searchUserTextField, 'submitEditing');

    await waitForInitiallyDisplayedUserToDisappearPromise;

    await waitFor(() => {
        const searchedUserCard = screen.getByTestId(
            `${searchedUser.nickname}-user-card`,
        );
        expect(searchedUserCard).toBeTruthy();
    });

    const cancelButton = screen.getByText(/cancel/i);
    expect(cancelButton).toBeTruthy();

    fireEvent.press(cancelButton);

    // Initially displayed user is displayed again.
    await waitFor(() => {
        const initiallyDisplayedUserCard = screen.getByTestId(
            `${initiallyDisplayedUser.nickname}-user-card`,
        );
        expect(initiallyDisplayedUserCard).toBeTruthy();
    });
    expect(searchUserTextField).toHaveProp('value', '');
});
