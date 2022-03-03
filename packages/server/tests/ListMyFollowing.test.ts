import Database from '@ioc:Adonis/Lucid/Database';
import {
    ListMyFollowingRequestBody,
    ListMyFollowingResponseBody,
    UserSummary,
} from '@musicroom/types';
import User from 'App/Models/User';
import { datatype, internet } from 'faker';
import test from 'japa';
import sinon from 'sinon';
import supertest from 'supertest';
import urlcat from 'urlcat';
import {
    BASE_URL,
    generateArray,
    initTestUtils,
    sortBy,
    TEST_MY_PROFILE_ROUTES_GROUP_PREFIX,
} from './utils/TestUtils';

const PAGE_MAX_LENGTH = 10;

test.group('List my following tests group', (group) => {
    const { initSocketConnection, disconnectEveryRemainingSocketConnection } =
        initTestUtils();

    group.beforeEach(async () => {
        initSocketConnection();
        await Database.beginGlobalTransaction();
    });

    group.afterEach(async () => {
        await disconnectEveryRemainingSocketConnection();
        sinon.restore();
        await Database.rollbackGlobalTransaction();
    });

    test('It should retrieve paginated my following', async (assert) => {
        const meUserID = datatype.uuid();
        const meUser = await User.create({
            uuid: meUserID,
            nickname: internet.userName(),
            email: internet.email(),
            password: internet.password(),
        });

        const users = await User.createMany(
            generateArray({
                fill: () => ({
                    uuid: datatype.uuid(),
                    nickname: internet.userName(),
                    email: internet.email(),
                    password: internet.password(),
                }),
                minLength: 22,
                maxLength: 30,
            }),
        );

        //Follow relationship set up
        const followersCounter = datatype.number({
            max: 15,
            min: 11,
        });
        const searchedUserFollowersUserSummary: UserSummary[] = (
            await Promise.all(
                users.map(async (user, index) => {
                    if (index < followersCounter) {
                        await meUser.related('following').save(user);
                        return {
                            userID: user.uuid,
                            nickname: user.nickname,
                        };
                    }

                    return undefined;
                }),
            )
        ).filter(
            (el: UserSummary | undefined): el is UserSummary =>
                el !== undefined,
        );

        const sortedByNicknameSearchedUserFollowersUserSummary: UserSummary[] =
            sortBy(
                searchedUserFollowersUserSummary.map(
                    ({ userID, nickname }) => ({
                        userID,
                        nickname,
                    }),
                ),
                'nickname',
            );
        ///

        const { body: page1BodyRaw } = await supertest(BASE_URL)
            .post(
                urlcat(TEST_MY_PROFILE_ROUTES_GROUP_PREFIX, 'search/following'),
            )
            .send({
                page: 1,
                searchQuery: '',
                tmpAuthUserID: meUserID,
            } as ListMyFollowingRequestBody)
            .expect('Content-Type', /json/)
            .expect(200);
        const page1BodyParsed = ListMyFollowingResponseBody.parse(page1BodyRaw);
        console.log({ pageBodyParsed: page1BodyParsed });
        assert.equal(page1BodyParsed.page, 1);
        assert.equal(
            page1BodyParsed.totalEntries,
            sortedByNicknameSearchedUserFollowersUserSummary.length,
        );
        assert.isTrue(page1BodyParsed.hasMore);
        assert.equal(page1BodyParsed.data.length, PAGE_MAX_LENGTH);
        assert.deepEqual(
            page1BodyParsed.data,
            sortedByNicknameSearchedUserFollowersUserSummary.slice(
                0,
                PAGE_MAX_LENGTH,
            ),
        );

        const { body: page2BodyRaw } = await supertest(BASE_URL)
            .post(
                urlcat(TEST_MY_PROFILE_ROUTES_GROUP_PREFIX, 'search/following'),
            )
            .send({
                page: 2,
                searchQuery: '',
                tmpAuthUserID: meUserID,
            } as ListMyFollowingRequestBody)
            .expect('Content-Type', /json/)
            .expect(200);
        const page2BodyParsed = ListMyFollowingResponseBody.parse(page2BodyRaw);
        console.log({ pageBodyParsed: page2BodyParsed });
        assert.equal(page2BodyParsed.page, 2);
        assert.equal(
            page2BodyParsed.totalEntries,
            sortedByNicknameSearchedUserFollowersUserSummary.length,
        );
        assert.isFalse(page2BodyParsed.hasMore);
        assert.equal(
            page2BodyParsed.data.length,
            sortedByNicknameSearchedUserFollowersUserSummary.length -
                PAGE_MAX_LENGTH,
        );
        assert.deepEqual(
            page2BodyParsed.data,
            sortedByNicknameSearchedUserFollowersUserSummary.slice(
                PAGE_MAX_LENGTH,
                PAGE_MAX_LENGTH * 2,
            ),
        );
    });

    test('It should retrieve filtered my following', async (assert) => {
        const meUserID = datatype.uuid();
        const meUser = await User.create({
            uuid: meUserID,
            nickname: internet.userName(),
            email: internet.email(),
            password: internet.password(),
        });

        const searchQuery = datatype.string(1);
        const users = await User.createMany(
            generateArray({
                fill: (index) => ({
                    uuid: datatype.uuid(),
                    nickname: `${
                        index % 2 === 0 ? searchQuery : ''
                    }${internet.userName()}`,
                    email: internet.email(),
                    password: internet.password(),
                }),
                minLength: 20,
                maxLength: 20,
            }),
        );

        //Follow relationship set up
        const followersCounter = datatype.number({
            max: 10,
            min: 8,
        });
        const searchedUserFollowersUserSummary: UserSummary[] = (
            await Promise.all(
                users.map(async (user, index) => {
                    if (index < followersCounter) {
                        await meUser.related('following').save(user);
                        return {
                            userID: user.uuid,
                            nickname: user.nickname,
                        };
                    }

                    return undefined;
                }),
            )
        ).filter(
            (el: UserSummary | undefined): el is UserSummary =>
                el !== undefined,
        );
        ///

        //filtering options
        const matchingSearchQuerySortedByNicknameSearchedUserFollowers =
            searchedUserFollowersUserSummary
                .filter((user) =>
                    user.nickname
                        .toLowerCase()
                        .startsWith(searchQuery.toLowerCase()),
                )
                .sort((a, b) => {
                    if (a.nickname.toLowerCase() < b.nickname.toLowerCase()) {
                        return -1;
                    }
                    if (a.nickname.toLowerCase() > b.nickname.toLowerCase()) {
                        return 1;
                    }
                    return 0;
                });
        ///

        const { body: pageBodyRaw } = await supertest(BASE_URL)
            .post(
                urlcat(TEST_MY_PROFILE_ROUTES_GROUP_PREFIX, 'search/following'),
            )
            .send({
                page: 1,
                searchQuery,
                tmpAuthUserID: meUserID,
            } as ListMyFollowingRequestBody)
            .expect('Content-Type', /json/)
            .expect(200);

        const pageBodyParsed = ListMyFollowingResponseBody.parse(pageBodyRaw);

        assert.equal(pageBodyParsed.page, 1);
        assert.equal(
            pageBodyParsed.totalEntries,
            matchingSearchQuerySortedByNicknameSearchedUserFollowers.length,
        );
        assert.isFalse(pageBodyParsed.hasMore);
        assert.equal(
            pageBodyParsed.data.length,
            matchingSearchQuerySortedByNicknameSearchedUserFollowers.length,
        );
        const expectedData =
            matchingSearchQuerySortedByNicknameSearchedUserFollowers.slice(
                0,
                PAGE_MAX_LENGTH,
            );
        console.log('ACTUAL', pageBodyParsed.data);
        console.log('EXPECTED', expectedData);
        assert.deepEqual(pageBodyParsed.data, expectedData);
    });

    test('It should send back 404 as requesting user does not exist', async () => {
        const meUserID = datatype.uuid();

        await supertest(BASE_URL)
            .post(
                urlcat(TEST_MY_PROFILE_ROUTES_GROUP_PREFIX, 'search/following'),
            )
            .send({
                page: 1,
                searchQuery: '',
                tmpAuthUserID: meUserID,
            } as ListMyFollowingRequestBody)
            .expect(404);
    });
});
