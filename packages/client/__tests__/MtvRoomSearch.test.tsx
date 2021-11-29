import { MtvRoomSummary } from '@musicroom/types';
import { NavigationContainer } from '@react-navigation/native';
import { datatype, random } from 'faker';
import React from 'react';
import { RootNavigator } from '../navigation';
import { isReadyRef, navigationRef } from '../navigation/RootNavigation';
import { db, generateArray } from '../tests/data';
import {
    fireEvent,
    noop,
    render,
    waitFor,
    waitForElementToBeRemoved,
    within,
} from '../tests/tests-utils';

test('Rooms are listed when coming to the screen and infinitely loaded', async () => {
    const rooms = generateArray({
        minLength: 11,
        maxLength: 15,
        fill: () => db.searchableRooms.create(),
    });
    const firstPageRooms = rooms.slice(0, 10);
    const secondPageRooms = rooms.slice(10);

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

    const goToMtvSearchScreenButton = screen.getByText(
        /go.*to.*music.*track.*vote/i,
    );
    expect(goToMtvSearchScreenButton).toBeTruthy();

    fireEvent.press(goToMtvSearchScreenButton);

    const searchInput = await screen.findByPlaceholderText(/search.*room/i);
    expect(searchInput).toBeTruthy();

    for (const { roomID, roomName, creatorName, isOpen } of firstPageRooms) {
        const listItem = await screen.findByTestId(`mtv-room-search-${roomID}`);
        expect(listItem).toBeTruthy();

        const roomNameElement = within(listItem).getByText(
            new RegExp(roomName),
        );
        expect(roomNameElement).toBeTruthy();

        const creatorNameElement = within(listItem).getByText(creatorName);
        expect(creatorNameElement).toBeTruthy();

        switch (isOpen) {
            case true: {
                const publicStatusIcon = within(listItem).getByA11yLabel(
                    new RegExp(`${roomName}.*public`),
                );
                expect(publicStatusIcon).toBeTruthy();

                break;
            }
            case false: {
                const privateStatusIcon = within(listItem).getByA11yLabel(
                    new RegExp(`${roomName}.*private`),
                );
                expect(privateStatusIcon).toBeTruthy();

                break;
            }

            default: {
                throw new Error('Reached unreachable state');
            }
        }
    }

    const mtvRoomsSearchFlatList = screen.getByTestId(
        'mtv-room-search-flat-list',
    );
    expect(mtvRoomsSearchFlatList).toBeTruthy();
    fireEvent(mtvRoomsSearchFlatList, 'endReached');

    // Load more button disappears when there are no more items to fetch.
    await waitForElementToBeRemoved(() => screen.getByText(/load.*more/i));

    for (const { roomID, roomName, creatorName, isOpen } of secondPageRooms) {
        const listItem = await screen.findByTestId(`mtv-room-search-${roomID}`);
        expect(listItem).toBeTruthy();

        const roomNameElement = within(listItem).getByText(
            new RegExp(roomName),
        );
        expect(roomNameElement).toBeTruthy();

        const creatorNameElement = within(listItem).getByText(creatorName);
        expect(creatorNameElement).toBeTruthy();

        switch (isOpen) {
            case true: {
                const publicStatusIcon = within(listItem).getByA11yLabel(
                    new RegExp(`${roomName}.*public`),
                );
                expect(publicStatusIcon).toBeTruthy();

                break;
            }

            case false: {
                const privateStatusIcon = within(listItem).getByA11yLabel(
                    new RegExp(`${roomName}.*private`),
                );
                expect(privateStatusIcon).toBeTruthy();

                break;
            }

            default: {
                throw new Error('Reached unreachable state');
            }
        }
    }
});

test('Rooms are filtered and infinitely loaded', async () => {
    const rooms = generateArray({
        minLength: 11,
        maxLength: 15,
        fill: () => db.searchableRooms.create(),
    });
    // Create a room with a unique name so that we can sort
    // results with it.
    const roomToFind = db.searchableRooms.create({
        roomName: datatype.uuid(),
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

    const goToMtvSearchScreenButton = screen.getByText(
        /go.*to.*music.*track.*vote/i,
    );
    expect(goToMtvSearchScreenButton).toBeTruthy();

    fireEvent.press(goToMtvSearchScreenButton);

    // Wait for first element of the list to be displayed
    await waitFor(() => {
        const firstRoomBeforeFilteringElement = screen.getByTestId(
            `mtv-room-search-${rooms[0].roomID}`,
        );
        expect(firstRoomBeforeFilteringElement).toBeTruthy();
    });
    // Ensure room we want to find is not displayed.
    const roomWithSpecialNameElement = screen.queryByTestId(
        `mtv-room-search-${roomToFind.roomID}`,
    );
    expect(roomWithSpecialNameElement).toBeNull();

    const searchInput = await screen.findByPlaceholderText(/search.*room/i);
    expect(searchInput).toBeTruthy();

    fireEvent(searchInput, 'focus');
    fireEvent.changeText(searchInput, roomToFind.roomName);
    fireEvent(searchInput, 'submitEditing');

    const roomToFindListElement = await screen.findByTestId(
        `mtv-room-search-${roomToFind.roomID}`,
    );
    expect(roomToFindListElement).toBeTruthy();

    const roomNameElement = within(roomToFindListElement).getByText(
        new RegExp(roomToFind.roomName),
    );
    expect(roomNameElement).toBeTruthy();

    const creatorNameElement = within(roomToFindListElement).getByText(
        roomToFind.creatorName,
    );
    expect(creatorNameElement).toBeTruthy();

    switch (roomToFind.isOpen) {
        case true: {
            const publicStatusIcon = within(
                roomToFindListElement,
            ).getByA11yLabel(new RegExp(`${roomToFind.roomName}.*public`));
            expect(publicStatusIcon).toBeTruthy();

            break;
        }

        case false: {
            const privateStatusIcon = within(
                roomToFindListElement,
            ).getByA11yLabel(new RegExp(`${roomToFind.roomName}.*private`));
            expect(privateStatusIcon).toBeTruthy();

            break;
        }

        default: {
            throw new Error('Reached unreachable state');
        }
    }
});

test('Clearing search input displays rooms without filter', async () => {
    const rooms = generateArray({
        minLength: 11,
        maxLength: 15,
        fill: () => db.searchableRooms.create(),
    });
    // Create a room with a unique name so that we can sort
    // results with it.
    const roomToFind = db.searchableRooms.create({
        roomName: datatype.uuid(),
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

    const goToMtvSearchScreenButton = screen.getByText(
        /go.*to.*music.*track.*vote/i,
    );
    expect(goToMtvSearchScreenButton).toBeTruthy();

    fireEvent.press(goToMtvSearchScreenButton);

    // Wait for first element of the list to be displayed
    await waitFor(() => {
        const firstRoomBeforeFilteringElement = screen.getByTestId(
            `mtv-room-search-${rooms[0].roomID}`,
        );
        expect(firstRoomBeforeFilteringElement).toBeTruthy();
    });
    // Ensure room we want to find is not displayed.
    const roomWithSpecialNameElement = screen.queryByTestId(
        `mtv-room-search-${roomToFind.roomID}`,
    );
    expect(roomWithSpecialNameElement).toBeNull();

    const searchInput = await screen.findByPlaceholderText(/search.*room/i);
    expect(searchInput).toBeTruthy();

    fireEvent(searchInput, 'focus');
    fireEvent.changeText(searchInput, roomToFind.roomName);
    fireEvent(searchInput, 'submitEditing');

    const roomToFindListElement = await screen.findByTestId(
        `mtv-room-search-${roomToFind.roomID}`,
    );
    expect(roomToFindListElement).toBeTruthy();

    const clearSearchInputButton =
        screen.getByLabelText(/clear.*search.*input/i);
    expect(clearSearchInputButton).toBeTruthy();

    const waitForRoomWithSpecialNameElementToDisappearPromise =
        waitForElementToBeRemoved(() =>
            screen.getByTestId(`mtv-room-search-${roomToFind.roomID}`),
        );

    fireEvent.press(clearSearchInputButton);

    await waitForRoomWithSpecialNameElementToDisappearPromise;

    expect(searchInput).toHaveProp('value', '');
});

test('Cancelling search input displays rooms without filter', async () => {
    const rooms = generateArray({
        minLength: 11,
        maxLength: 15,
        fill: () => db.searchableRooms.create(),
    });
    // Create a room with a unique name so that we can sort
    // results with it.
    const roomToFind = db.searchableRooms.create({
        roomName: datatype.uuid(),
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

    const goToMtvSearchScreenButton = screen.getByText(
        /go.*to.*music.*track.*vote/i,
    );
    expect(goToMtvSearchScreenButton).toBeTruthy();

    fireEvent.press(goToMtvSearchScreenButton);

    // Wait for first element of the list to be displayed
    await waitFor(() => {
        const firstRoomBeforeFilteringElement = screen.getByTestId(
            `mtv-room-search-${rooms[0].roomID}`,
        );
        expect(firstRoomBeforeFilteringElement).toBeTruthy();
    });
    // Ensure room we want to find is not displayed.
    const roomWithSpecialNameElement = screen.queryByTestId(
        `mtv-room-search-${roomToFind.roomID}`,
    );
    expect(roomWithSpecialNameElement).toBeNull();

    const searchInput = await screen.findByPlaceholderText(/search.*room/i);
    expect(searchInput).toBeTruthy();

    fireEvent(searchInput, 'focus');
    fireEvent.changeText(searchInput, roomToFind.roomName);
    fireEvent(searchInput, 'submitEditing');

    const roomToFindListElement = await screen.findByTestId(
        `mtv-room-search-${roomToFind.roomID}`,
    );
    expect(roomToFindListElement).toBeTruthy();

    const cancelButton = screen.getByText(/cancel/i);
    expect(cancelButton).toBeTruthy();

    const waitForRoomWithSpecialNameElementToDisappearPromise =
        waitForElementToBeRemoved(() =>
            screen.getByTestId(`mtv-room-search-${roomToFind.roomID}`),
        );

    fireEvent.press(cancelButton);

    await waitForRoomWithSpecialNameElementToDisappearPromise;

    expect(searchInput).toHaveProp('value', '');
});

test('Displays empty state when no rooms match the query', async () => {
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

    const goToMtvSearchScreenButton = screen.getByText(
        /go.*to.*music.*track.*vote/i,
    );
    expect(goToMtvSearchScreenButton).toBeTruthy();

    fireEvent.press(goToMtvSearchScreenButton);

    const emptyStateElement = await screen.findByText(
        /no.*rooms.*match.*request/i,
    );
    expect(emptyStateElement).toBeTruthy();
});

test('Room card specific icon for isOpen isInvited', async () => {
    const searchableRooms = generateArray<MtvRoomSummary>({
        maxLength: 10,
        minLength: 10,
        fill: (index) => {
            const indexIsEven = index % 2 === 0;
            const indexIsZeroOrFive = index === 5 || index === 0;
            const room = {
                roomID: datatype.uuid(),
                isInvited: indexIsZeroOrFive,
                roomName: random.words(5),
                creatorName: datatype.uuid(),
                isOpen: indexIsEven,
            };

            db.searchableRooms.create(room);

            return room;
        },
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

    const goToMtvSearchScreenButton = screen.getByText(
        /go.*to.*music.*track.*vote/i,
    );
    expect(goToMtvSearchScreenButton).toBeTruthy();

    fireEvent.press(goToMtvSearchScreenButton);

    // Wait for first element of the list to be displayed
    await waitFor(() => {
        const firstRoomBeforeFilteringElement = screen.getByTestId(
            `mtv-room-search-${searchableRooms[0].roomID}`,
        );
        expect(firstRoomBeforeFilteringElement).toBeTruthy();
    });

    for (const room of searchableRooms) {
        const { roomID, roomName, isOpen, isInvited } = room;
        const roomCard = screen.getByTestId(`mtv-room-search-${roomID}`);
        expect(roomCard).toBeTruthy();

        if (isOpen) {
            const publicStatusIcon = within(roomCard).getByA11yLabel(
                new RegExp(`${roomName}.*public`),
            );
            expect(publicStatusIcon).toBeTruthy();

            if (isInvited) {
                const invitationIcon = within(roomCard).getByA11yLabel(
                    `You're invited to ${roomName}`,
                );
                expect(invitationIcon).toBeTruthy();
            }
        } else {
            const privateStatusIcon = within(roomCard).getByA11yLabel(
                new RegExp(`${roomName}.*private`),
            );
            expect(privateStatusIcon).toBeTruthy();
        }
    }
});
