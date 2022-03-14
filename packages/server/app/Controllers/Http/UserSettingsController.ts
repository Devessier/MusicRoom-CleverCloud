import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import {
    UpdatePlaylistsVisibilityRequestBody,
    UpdatePlaylistsVisibilityResponseBody,
    UpdateRelationsVisibilityRequestBody,
    UpdateRelationsVisibilityResponseBody,
    UpdateNicknameRequestBody,
    UpdateNicknameResponseBody,
    GetMySettingsResponseBody,
} from '@musicroom/types';
import SettingVisibility from 'App/Models/SettingVisibility';
import User from 'App/Models/User';
import invariant from 'tiny-invariant';

export default class UserSettingsController {
    public async getMySettings({
        auth,
    }: HttpContextContract): Promise<GetMySettingsResponseBody> {
        const user = auth.user;
        invariant(
            user !== undefined,
            'User must be logged in to get her settings',
        );

        await user.load((loader) => {
            loader
                .load('playlistsVisibilitySetting')
                .load('relationsVisibilitySetting');
        });

        return {
            nickname: user.nickname,
            playlistsVisibilitySetting: user.playlistsVisibilitySetting.name,
            relationsVisibilitySetting: user.relationsVisibilitySetting.name,
        };
    }

    public async updatePlaylistsVisibility({
        request,
        auth,
    }: HttpContextContract): Promise<UpdatePlaylistsVisibilityResponseBody> {
        const user = auth.user;
        invariant(
            user !== undefined,
            'User must be logged in to update her playlists visibility setting',
        );

        const { visibility } = UpdatePlaylistsVisibilityRequestBody.parse(
            request.body(),
        );
        const settingVisibility = await SettingVisibility.findByOrFail(
            'name',
            visibility,
        );

        await user
            .related('playlistsVisibilitySetting')
            .associate(settingVisibility);

        return {
            status: 'SUCCESS',
        };
    }

    public async updateRelationsVisibility({
        request,
        auth,
    }: HttpContextContract): Promise<UpdateRelationsVisibilityResponseBody> {
        const user = auth.user;
        invariant(
            user !== undefined,
            'User must be logged in to update her relations visibility setting',
        );

        const { visibility } = UpdateRelationsVisibilityRequestBody.parse(
            request.body(),
        );
        const settingVisibility = await SettingVisibility.findByOrFail(
            'name',
            visibility,
        );

        await user
            .related('relationsVisibilitySetting')
            .associate(settingVisibility);

        return {
            status: 'SUCCESS',
        };
    }

    public async updateNickname({
        request,
        auth,
        response,
    }: HttpContextContract): Promise<UpdateNicknameResponseBody> {
        const user = auth.user;
        invariant(
            user !== undefined,
            'User must be logged in to update her nickname',
        );

        const { nickname } = UpdateNicknameRequestBody.parse(request.body());

        if (user.nickname === nickname) {
            return {
                status: 'SAME_NICKNAME',
            };
        }

        try {
            user.nickname = nickname;

            await user.save();

            return {
                status: 'SUCCESS',
            };
        } catch (err: unknown) {
            response.status(400);
            return {
                status: 'UNAVAILABLE_NICKNAME',
            };
        }
    }
}
