import { useInterpret, useSelector } from '@xstate/react';
import { Button, ScrollView, Text, useSx, View } from 'dripsy';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import {
    AppScreen,
    AppScreenContainer,
    AppScreenHeader,
    SvgImage,
} from '../../components/kit';
import { MyProfileScreenProps } from '../../types';
import { getFakeUserID } from '../../contexts/SocketContext';
import { createMyProfileInformationMachine } from '../../machines/myProfileInformationMachine';
import { generateUserAvatarUri } from '../../constants/users-avatar';

interface MyProfileInformationSectionProps {
    onPress: () => void;
    informationName: string;
    informationCounter: number | undefined;
}

const MyProfileInformationSection: React.FC<MyProfileInformationSectionProps> =
    ({ informationName, informationCounter, onPress }) => {
        const sx = useSx();

        const informationIsNotVisibleForUser = informationCounter === undefined;
        if (informationIsNotVisibleForUser) {
            return null;
        }

        return (
            <View sx={{ flexDirection: 'row', justifyContent: 'center' }}>
                <TouchableOpacity
                    onPress={onPress}
                    style={sx({
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 'l',
                    })}
                >
                    <Text
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            marginRight: 'l',
                            fontSize: 's',
                        }}
                    >
                        {informationName}
                    </Text>

                    <Text
                        sx={{
                            borderRadius: 'full',
                            paddingX: 'l',
                            paddingY: 's',
                            backgroundColor: 'greyLight',
                            color: 'white',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            fontSize: 's',
                        }}
                    >
                        {informationCounter}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

const MyProfileScreen: React.FC<MyProfileScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const sx = useSx();
    const userID = getFakeUserID();

    const userProfileInformationService = useInterpret(() =>
        createMyProfileInformationMachine(),
    );

    const myProfileInformation = useSelector(
        userProfileInformationService,
        (state) => state.context.myProfileInformation,
    );

    const userNotFound = useSelector(userProfileInformationService, (state) =>
        state.hasTag('userNotFound'),
    );

    function handleGoToMySettingsScreen() {
        navigation.navigate('MySettings');
    }

    function handleGoToMyDevices() {
        navigation.navigate('MyDevices');
    }

    if (myProfileInformation === undefined) {
        return (
            <AppScreen>
                <AppScreenHeader
                    title="My profile"
                    insetTop={insets.top}
                    canGoBack
                    goBack={() => {
                        navigation.goBack();
                    }}
                />

                <AppScreenContainer testID="default-my-profile-page-screen">
                    {userNotFound ? (
                        <>
                            <Text>User not found</Text>
                            <Button
                                title="Go back"
                                onPress={() => navigation.goBack()}
                            />
                        </>
                    ) : (
                        <Text>LOADING</Text>
                    )}
                </AppScreenContainer>
            </AppScreen>
        );
    }

    const myProfileInformationSections: MyProfileInformationSectionProps[] = [
        {
            informationName: 'Followers',
            onPress: () => {
                console.log('followers section pressed');
            },
            informationCounter: myProfileInformation.followersCounter,
        },
        {
            informationName: 'Following',
            onPress: () => {
                console.log('following section pressed');
            },
            informationCounter: myProfileInformation.followingCounter,
        },
        {
            informationName: 'Playlists',
            onPress: () => {
                console.log('paylists section pressed');
            },
            informationCounter: myProfileInformation.playlistsCounter,
        },
        // {
        //     informationName: 'Devices',
        //     onPress: handleGoToMyDevices,
        //     informationCounter: myProfileInformation.devicesCounter,
        // },
    ];

    return (
        <AppScreen>
            <AppScreenHeader
                title={`My profile`}
                insetTop={insets.top}
                canGoBack
                goBack={() => {
                    navigation.goBack();
                }}
                HeaderRight={() => {
                    return (
                        <TouchableOpacity onPress={handleGoToMySettingsScreen}>
                            <Ionicons
                                name="cog"
                                accessibilityLabel="Open my settings screen"
                                style={sx({
                                    fontSize: 'm',
                                    color: 'white',
                                    padding: 's',
                                })}
                            />
                        </TouchableOpacity>
                    );
                }}
            />

            <AppScreenContainer testID="my-profile-page-container">
                <View
                    sx={{
                        flex: 1,
                        paddingX: 'l',
                        maxWidth: [null, 420, 720],
                        width: '100%',
                        marginX: 'auto',
                        alignItems: 'center',
                        borderLeftWidth: 1,
                        borderRightWidth: 1,
                        borderColor: 'greyLighter',
                    }}
                >
                    <View
                        sx={{
                            padding: 'l',
                            marginBottom: 'xl',
                            borderRadius: 'full',
                            backgroundColor: 'greyLight',
                        }}
                    >
                        <SvgImage
                            uri={generateUserAvatarUri({ userID })}
                            accessibilityLabel="My avatar"
                            style={sx({
                                width: 'xl',
                                height: 'xl',
                                borderRadius: 'full',
                            })}
                        />
                    </View>

                    <Text
                        sx={{
                            color: 'white',
                            marginBottom: 'xl',
                            fontSize: 'l',
                            fontWeight: 'bold',
                        }}
                    >
                        {myProfileInformation.userNickname}
                    </Text>

                    <ScrollView
                        horizontal
                        contentContainerStyle={{ width: '100%' }}
                        sx={{
                            width: '100%',
                            flexGrow: 0,
                        }}
                    >
                        {myProfileInformationSections.map(
                            ({
                                informationName,
                                onPress,
                                informationCounter,
                            }) => (
                                <View
                                    sx={{
                                        // padding: 'm',
                                        flexGrow: [undefined, undefined, 1],
                                        flexShrink: [0, 0, 1],
                                    }}
                                >
                                    <MyProfileInformationSection
                                        key={informationName}
                                        informationName={informationName}
                                        onPress={onPress}
                                        informationCounter={informationCounter}
                                    />
                                </View>
                            ),
                        )}
                    </ScrollView>
                </View>
            </AppScreenContainer>
        </AppScreen>
    );
};

export default MyProfileScreen;
