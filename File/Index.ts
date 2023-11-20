import 'ejs';
import { PostgresAppInstance } from 'CommonServer/Infrastructure/PostgresDatabase';
import Express, { ExpressApplication } from 'CommonServer/Utils/Express';
import logger from 'CommonServer/Utils/Logger';
import Redis from 'CommonServer/Infrastructure/Redis';
import App from 'CommonServer/Utils/StartServer';
import File from 'Model/Models/File';
import FileService, {
    Service as FileServiceType,
} from 'CommonServer/Services/FileService';
import BaseAPI from 'CommonServer/API/BaseAPI';
import FileAPI from './API/File';
import { ClickhouseAppInstance } from 'CommonServer/Infrastructure/ClickhouseDatabase';

const app: ExpressApplication = Express.getExpressApp();

const APP_NAME: string = 'File';

app.use(
    `/${APP_NAME.toLocaleLowerCase()}`,
    new BaseAPI<File, FileServiceType>(File, FileService).getRouter()
);

// File Serve API.
app.use(`/${APP_NAME.toLocaleLowerCase()}`, new FileAPI().router);

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
