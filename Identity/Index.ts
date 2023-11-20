import 'ejs';
import { PostgresAppInstance } from 'CommonServer/Infrastructure/PostgresDatabase';
import Express, { ExpressApplication } from 'CommonServer/Utils/Express';
import logger from 'CommonServer/Utils/Logger';
import App from 'CommonServer/Utils/StartServer';
import AuthenticationAPI from './API/Authentication';
import SsoAPI from './API/SSO';
import ResellerAPI from './API/Reseller';
import StatusPageSsoAPI from './API/StatusPageSSO';
import StatusPageAuthenticationAPI from './API/StatusPageAuthentication';
import Redis from 'CommonServer/Infrastructure/Redis';
import { ClickhouseAppInstance } from 'CommonServer/Infrastructure/ClickhouseDatabase';

const app: ExpressApplication = Express.getExpressApp();

const APP_NAME: string = 'identity';

app.use([`/${APP_NAME}`, '/'], AuthenticationAPI);

app.use([`/${APP_NAME}`, '/'], ResellerAPI);

app.use([`/${APP_NAME}`, '/'], SsoAPI);

app.use([`/${APP_NAME}`, '/'], StatusPageSsoAPI);

app.use(
    [`/${APP_NAME}/status-page`, '/status-page'],
    StatusPageAuthenticationAPI
);

const init: () => Promise<void> = async (): Promise<void> => {
    try {
        // init the app
        await App(APP_NAME);
        // connect to the database.
        await PostgresAppInstance.connect(
            PostgresAppInstance.getDatasourceOptions()
        );

        // connect redis
        await Redis.connect();

        await ClickhouseAppInstance.connect(
            ClickhouseAppInstance.getDatasourceOptions()
        );
    } catch (err) {
        logger.error('App Init Failed:');
        logger.error(err);
        throw err;
    }
};

init().catch((err: Error) => {
    logger.error(err);
    logger.info('Exiting node process');
    process.exit(1);
});
