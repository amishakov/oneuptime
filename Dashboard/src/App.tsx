import React, { FunctionComponent, useState } from 'react';
import Route from 'Common/Types/API/Route';
import {
    Routes,
    Route as PageRoute,
    useNavigate,
    useLocation,
    useParams,
} from 'react-router-dom';
import MasterPage from './Components/MasterPage/MasterPage';
// Pages
import Init from './Pages/Init/Init';
import Home from './Pages/Home/Home';
import useAsyncEffect from 'use-async-effect';
import StatusPages from './Pages/StatusPages/StatusPages';
import Incidents from './Pages/Incidents/Incidents';
import Logs from './Pages/Logs/Logs';
import Navigation from 'CommonUI/src/Utils/Navigation';
import RouteMap from './Utils/RouteMap';
import PageMap from './Utils/PageMap';
import { ACCOUNTS_URL } from 'CommonUI/src/Config';
// Settings Pages
import Settings from './Pages/Settings/Settings';
import SettingsDangerZone from './Pages/Settings/DangerZone';
import SettingsApiKeys from './Pages/Settings/APIKeys';
import SettingsCreateAPIKey from './Pages/Settings/CreateAPIKey';
// Import CSS
import 'CommonUI/src/Styles/theme.scss';
import User from 'CommonUI/src/Utils/User';
import Logout from './Pages/Logout/Logout';
import ModelAPI, { ListResult } from 'CommonUI/src/Utils/ModelAPI/ModelAPI';
import Project from 'Common/Models/Project';
import HTTPErrorResponse from 'Common/Types/API/HTTPErrorResponse';
import { JSONObject } from 'Common/Types/JSON';

const App: FunctionComponent = () => {
    Navigation.setNavigateHook(useNavigate());
    Navigation.setLocation(useLocation());
    Navigation.setParams(useParams());

    if (!User.isLoggedIn()) {
        Navigation.navigate(ACCOUNTS_URL);
    }

    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [projects, setProjects] = useState<Array<Project>>([]);

    useAsyncEffect(async () => {
        setLoading(true);

        // get list of projects.
        try {
            const result: ListResult<Project> = await ModelAPI.getList<Project>(
                Project,
                {},
                50,
                0,
                {
                    name: true,
                    _id: true,
                }
            );
            setProjects(result.data);
        } catch (err) {
            setError(
                ((err as HTTPErrorResponse).data as JSONObject)[
                    'error'
                ] as string
            );
        }

        setLoading(false);
    }, []);

    return (
        <MasterPage isLoading={isLoading} projects={projects} error={error}>
            <Routes>
                <PageRoute
                    path={RouteMap[PageMap.INIT]?.toString()}
                    element={
                        <Init pageRoute={RouteMap[PageMap.INIT] as Route} />
                    }
                />
                <PageRoute
                    path={RouteMap[PageMap.HOME]?.toString()}
                    element={
                        <Home pageRoute={RouteMap[PageMap.HOME] as Route} />
                    }
                />
                <PageRoute
                    path={RouteMap[PageMap.MONITORS]?.toString()}
                    element={
                        <Init pageRoute={RouteMap[PageMap.MONITORS] as Route} />
                    }
                />

                <PageRoute
                    path={RouteMap[PageMap.STATUS_PAGE]?.toString()}
                    element={
                        <StatusPages
                            pageRoute={RouteMap[PageMap.STATUS_PAGE] as Route}
                        />
                    }
                />
                <PageRoute
                    path={RouteMap[PageMap.INCIDENTS]?.toString()}
                    element={
                        <Incidents
                            pageRoute={RouteMap[PageMap.INCIDENTS] as Route}
                        />
                    }
                />
                <PageRoute
                    path={RouteMap[PageMap.LOGS]?.toString()}
                    element={
                        <Logs pageRoute={RouteMap[PageMap.LOGS] as Route} />
                    }
                />

                {/* Settings Routes */}

                <PageRoute
                    path={RouteMap[PageMap.SETTINGS]?.toString()}
                    element={
                        <Settings
                            pageRoute={RouteMap[PageMap.SETTINGS] as Route}
                        />
                    }
                />

                <PageRoute
                    path={RouteMap[PageMap.SETTINGS_DANGERZONE]?.toString()}
                    element={
                        <SettingsDangerZone
                            pageRoute={
                                RouteMap[PageMap.SETTINGS_DANGERZONE] as Route
                            }
                        />
                    }
                />

                <PageRoute
                    path={RouteMap[PageMap.SETTINGS_APIKEYS]?.toString()}
                    element={
                        <SettingsApiKeys
                            pageRoute={
                                RouteMap[PageMap.SETTINGS_APIKEYS] as Route
                            }
                        />
                    }
                />

                <PageRoute
                    path={RouteMap[PageMap.SETTINGS_CREATE_APIKEY]?.toString()}
                    element={
                        <SettingsCreateAPIKey
                            pageRoute={
                                RouteMap[PageMap.SETTINGS_APIKEYS] as Route
                            }
                        />
                    }
                />

                {/* Misc Routes */}
                <PageRoute
                    path={RouteMap[PageMap.LOGOUT]?.toString()}
                    element={
                        <Logout pageRoute={RouteMap[PageMap.LOGOUT] as Route} />
                    }
                />
            </Routes>
        </MasterPage>
    );
};

export default App;
