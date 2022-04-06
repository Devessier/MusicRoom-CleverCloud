import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { GetMyProfileInformationResponseBody } from '@musicroom/types';
import invariant from 'tiny-invariant';

export default class MyProfileController {
    public async getMyProfileInformation({
        auth,
    }: HttpContextContract): Promise<GetMyProfileInformationResponseBody> {
        const user = auth.user;
        invariant(
            user !== undefined,
            'User must be authenticated to get her profile information',
        );
        //This should not be hasConfirmedEmail bouncer protected

        const {
            uuid,
            nickname: userNickname,
            confirmedEmailAt,
            googleID,
        } = user;

        /**
         * A user that has signed up using a google account won't have to verify her email
         * A user that has signed up using a mail + pswd will have to verify her email to be able to
         * later link a google account to her account
         */
        const hasVerifiedAccount =
            googleID !== null || confirmedEmailAt !== null;

        // After this user model column are erased
        await user
            .loadCount('following')
            .loadCount('followers')
            .loadCount('mpeRooms')
            .loadCount('devices');

        return {
            userID: uuid,
            userNickname,
            devicesCounter: Number(user.$extras.devices_count),
            followersCounter: Number(user.$extras.followers_count),
            followingCounter: Number(user.$extras.following_count),
            playlistsCounter: Number(user.$extras.mpeRooms_count),
            hasVerifiedAccount,
        };
    }
}
