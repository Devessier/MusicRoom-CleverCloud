import Database from '@ioc:Adonis/Lucid/Database';
import {
    GetMySettingsRequestBody,
    GetMySettingsResponseBody,
    UpdateNicknameRequestBody,
    UpdateNicknameResponseBody,
    UpdateNicknameResponseStatus,
    UpdatePlaylistsVisibilityRequestBody,
    UpdatePlaylistsVisibilityResponseBody,
    UpdateRelationsVisibilityRequestBody,
    UpdateRelationsVisibilityResponseBody,
    UserSettingVisibility,
} from '@musicroom/types';
import SettingVisibility from 'App/Models/SettingVisibility';
import User from 'App/Models/User';
import { datatype, random, internet } from 'faker';
import test from 'japa';
import sinon from 'sinon';
import supertest from 'supertest';
import { BASE_URL, initTestUtils } from './utils/TestUtils';

test.group('User settings', (group) => {
    const { disconnectEveryRemainingSocketConnection, initSocketConnection } =
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

    test('Gets my settings', async (assert) => {
        const privateVisibilitySetting = await SettingVisibility.findByOrFail(
            'name',
            UserSettingVisibility.enum.PRIVATE,
        );
        const followersOnlyVisibilitySetting =
            await SettingVisibility.findByOrFail(
                'name',
                UserSettingVisibility.enum.FOLLOWERS_ONLY,
            );
        const userID = datatype.uuid();
        const user = await User.create({
            uuid: userID,
            nickname: random.word(),
            playlistsVisibilitySettingUuid: privateVisibilitySetting.uuid,
            relationsVisibilitySettingUuid: followersOnlyVisibilitySetting.uuid,
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: GetMySettingsRequestBody = {
            tmpAuthUserID: userID,
        };
        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/settings')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody = GetMySettingsResponseBody.parse(rawResponseBody);

        assert.equal(responseBody.nickname, user.nickname);
        assert.equal<UserSettingVisibility>(
            responseBody.playlistsVisibilitySetting,
            'PRIVATE',
        );
        assert.equal<UserSettingVisibility>(
            responseBody.relationsVisibilitySetting,
            'FOLLOWERS_ONLY',
        );
    });

    test('Returns Authorization error when the user is not authenticated', async () => {
        const userID = datatype.uuid();
        await User.create({
            uuid: userID,
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: GetMySettingsRequestBody = {
            tmpAuthUserID: datatype.uuid(),
        };
        await supertest(BASE_URL)
            .post('/me/settings')
            .send(requestBody)
            .expect(404);
    });

    test(`'PUBLIC' is the default setting for playlists, relations and devices visibility settings`, async (assert) => {
        const userID = datatype.uuid();
        const user = await User.create({
            uuid: userID,
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        await user.load('playlistsVisibilitySetting');
        await user.load('relationsVisibilitySetting');

        assert.equal<UserSettingVisibility>(
            user.playlistsVisibilitySetting.name,
            'PUBLIC',
        );

        assert.equal<UserSettingVisibility>(
            user.relationsVisibilitySetting.name,
            'PUBLIC',
        );
    });

    test(`Can set playlists visibility to 'PUBLIC'`, async (assert) => {
        const userID = datatype.uuid();
        const user = await User.create({
            uuid: userID,
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdatePlaylistsVisibilityRequestBody = {
            tmpAuthUserID: userID,
            visibility: 'PUBLIC',
        };

        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/playlists-visibility')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody =
            UpdatePlaylistsVisibilityResponseBody.parse(rawResponseBody);

        assert.equal(responseBody.status, 'SUCCESS');

        await user.load('playlistsVisibilitySetting');

        assert.equal<UserSettingVisibility>(
            user.playlistsVisibilitySetting.name,
            'PUBLIC',
        );
    });

    test(`Can set playlists visibility to 'PRIVATE'`, async (assert) => {
        const userID = datatype.uuid();
        const user = await User.create({
            uuid: userID,
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdatePlaylistsVisibilityRequestBody = {
            tmpAuthUserID: userID,
            visibility: 'PRIVATE',
        };

        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/playlists-visibility')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody =
            UpdatePlaylistsVisibilityResponseBody.parse(rawResponseBody);

        assert.equal(responseBody.status, 'SUCCESS');

        await user.refresh();
        await user.load('playlistsVisibilitySetting');

        assert.equal<UserSettingVisibility>(
            user.playlistsVisibilitySetting.name,
            'PRIVATE',
        );
    });

    test(`Can set playlists visibility to 'FOLLOWERS_ONLY'`, async (assert) => {
        const userID = datatype.uuid();
        const user = await User.create({
            uuid: userID,
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdatePlaylistsVisibilityRequestBody = {
            tmpAuthUserID: userID,
            visibility: 'FOLLOWERS_ONLY',
        };

        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/playlists-visibility')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody =
            UpdatePlaylistsVisibilityResponseBody.parse(rawResponseBody);

        assert.equal(responseBody.status, 'SUCCESS');

        await user.refresh();
        await user.load('playlistsVisibilitySetting');

        assert.equal<UserSettingVisibility>(
            user.playlistsVisibilitySetting.name,
            'FOLLOWERS_ONLY',
        );
    });

    test(`Can set relations visibility to 'PUBLIC'`, async (assert) => {
        const userID = datatype.uuid();
        const user = await User.create({
            uuid: userID,
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdateRelationsVisibilityRequestBody = {
            tmpAuthUserID: userID,
            visibility: 'PUBLIC',
        };

        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/relations-visibility')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody =
            UpdateRelationsVisibilityResponseBody.parse(rawResponseBody);

        assert.equal(responseBody.status, 'SUCCESS');

        await user.load('relationsVisibilitySetting');

        assert.equal<UserSettingVisibility>(
            user.relationsVisibilitySetting.name,
            'PUBLIC',
        );
    });

    test(`Can set relations visibility to 'PRIVATE'`, async (assert) => {
        const userID = datatype.uuid();
        const user = await User.create({
            uuid: userID,
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdateRelationsVisibilityRequestBody = {
            tmpAuthUserID: userID,
            visibility: 'PRIVATE',
        };

        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/relations-visibility')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody =
            UpdateRelationsVisibilityResponseBody.parse(rawResponseBody);

        assert.equal(responseBody.status, 'SUCCESS');

        await user.refresh();
        await user.load('relationsVisibilitySetting');

        assert.equal<UserSettingVisibility>(
            user.relationsVisibilitySetting.name,
            'PRIVATE',
        );
    });

    test(`Can set relations visibility to 'FOLLOWERS_ONLY'`, async (assert) => {
        const userID = datatype.uuid();
        const user = await User.create({
            uuid: userID,
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdateRelationsVisibilityRequestBody = {
            tmpAuthUserID: userID,
            visibility: 'FOLLOWERS_ONLY',
        };

        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/relations-visibility')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody =
            UpdateRelationsVisibilityResponseBody.parse(rawResponseBody);

        assert.equal(responseBody.status, 'SUCCESS');

        await user.refresh();
        await user.load('relationsVisibilitySetting');

        assert.equal<UserSettingVisibility>(
            user.relationsVisibilitySetting.name,
            'FOLLOWERS_ONLY',
        );
    });

    test(`Returns an error when trying to update user's nickname with her current nickname`, async (assert) => {
        const userID = datatype.uuid();
        const userNickname = random.word();
        const user = await User.create({
            uuid: userID,
            nickname: userNickname,
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdateNicknameRequestBody = {
            tmpAuthUserID: userID,
            nickname: userNickname,
        };
        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/nickname')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody = UpdateNicknameResponseBody.parse(rawResponseBody);

        assert.equal<UpdateNicknameResponseStatus>(
            responseBody.status,
            'SAME_NICKNAME',
        );

        await user.refresh();

        assert.equal(user.nickname, userNickname);
    });

    test(`Returns an error when trying to update user's nickname with an unavailable nickname`, async (assert) => {
        const userID = datatype.uuid();
        const userNickname = random.word();
        await User.create({
            uuid: userID,
            nickname: userNickname,
            email: internet.email(),
            password: internet.password(),
        });

        const randomUser = await User.create({
            uuid: datatype.uuid(),
            nickname: random.word(),
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdateNicknameRequestBody = {
            tmpAuthUserID: userID,
            nickname: randomUser.nickname,
        };
        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/nickname')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody = UpdateNicknameResponseBody.parse(rawResponseBody);

        assert.equal<UpdateNicknameResponseStatus>(
            responseBody.status,
            'UNAVAILABLE_NICKNAME',
        );

        // We can not refresh the user because the transaction has failed,
        // as we violated a unique constraint, and Postgres does not allow
        // to make additional requests on a transaction that has been aborted.
        // See: https://stackoverflow.com/questions/10399727/psqlexception-current-transaction-is-aborted-commands-ignored-until-end-of-tra.
    });

    test(`Returns an error when trying to set username as an empty string`, async (assert) => {
        const userID = datatype.uuid();
        const userNickname = random.word();
        const user = await User.create({
            uuid: userID,
            nickname: userNickname,
            email: internet.email(),
            password: internet.password(),
        });

        const requestBody: UpdateNicknameRequestBody = {
            tmpAuthUserID: userID,
            nickname: '',
        };
        await supertest(BASE_URL)
            .post('/me/nickname')
            .send(requestBody)
            .expect(500);

        await user.refresh();

        assert.equal(user.nickname, userNickname);
    });

    test(`Updates user's nickname`, async (assert) => {
        const userID = datatype.uuid();
        const userNickname = random.word();
        const user = await User.create({
            uuid: userID,
            nickname: userNickname,
            email: internet.email(),
            password: internet.password(),
        });
        const newNickname = random.words();

        const requestBody: UpdateNicknameRequestBody = {
            tmpAuthUserID: userID,
            nickname: newNickname,
        };
        const { body: rawResponseBody } = await supertest(BASE_URL)
            .post('/me/nickname')
            .send(requestBody)
            .expect(200)
            .expect('Content-Type', /json/);
        const responseBody = UpdateNicknameResponseBody.parse(rawResponseBody);

        assert.equal<UpdateNicknameResponseStatus>(
            responseBody.status,
            'SUCCESS',
        );

        await user.refresh();

        assert.equal(user.nickname, newNickname);
    });
});
