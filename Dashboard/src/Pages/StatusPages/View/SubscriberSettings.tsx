import Route from 'Common/Types/API/Route';
import ModelPage from 'CommonUI/src/Components/Page/ModelPage';
import React, { FunctionComponent, ReactElement } from 'react';
import PageMap from '../../../Utils/PageMap';
import RouteMap, { RouteUtil } from '../../../Utils/RouteMap';
import PageComponentProps from '../../PageComponentProps';
import SideMenu from './SideMenu';
import ObjectID from 'Common/Types/ObjectID';
import StatusPage from 'Model/Models/StatusPage';
import CardModelDetail from 'CommonUI/src/Components/ModelDetail/CardModelDetail';
import FormFieldSchemaType from 'CommonUI/src/Components/Forms/Types/FormFieldSchemaType';
import FieldType from 'CommonUI/src/Components/Types/FieldType';
import Navigation from 'CommonUI/src/Utils/Navigation';
const StatusPageDelete: FunctionComponent<PageComponentProps> = (
    _props: PageComponentProps
): ReactElement => {
    const modelId: ObjectID = Navigation.getLastParamAsObjectID(1);

    return (
        <ModelPage
            title="Status Page"
            modelType={StatusPage}
            modelId={modelId}
            modelNameField="name"
            breadcrumbLinks={[
                {
                    title: 'Project',
                    to: RouteUtil.populateRouteParams(
                        RouteMap[PageMap.HOME] as Route,
                        { modelId }
                    ),
                },
                {
                    title: 'Status Pages',
                    to: RouteUtil.populateRouteParams(
                        RouteMap[PageMap.STATUS_PAGES] as Route,
                        { modelId }
                    ),
                },
                {
                    title: 'View Status Page',
                    to: RouteUtil.populateRouteParams(
                        RouteMap[PageMap.STATUS_PAGE_VIEW] as Route,
                        { modelId }
                    ),
                },
                {
                    title: 'Subscriber Settings',
                    to: RouteUtil.populateRouteParams(
                        RouteMap[
                            PageMap.STATUS_PAGE_VIEW_SUBSCRIBER_SETTINGS
                        ] as Route,
                        { modelId }
                    ),
                },
            ]}
            sideMenu={<SideMenu modelId={modelId} />}
        >
            <CardModelDetail<StatusPage>
                name="Status Page > Branding > Subscriber"
                cardProps={{
                    title: 'Subscriber Settings',
                    description: 'Subscriber settings for this status page.',
                }}
                isEditable={true}
                formFields={[
                    {
                        field: {
                            enableSubscribers: true,
                        },
                        title: 'Enable Subscribers',
                        fieldType: FormFieldSchemaType.Toggle,
                        required: false,
                        placeholder:
                            'Can subscribers subscribe to this status page?',
                    },
                ]}
                modelDetailProps={{
                    showDetailsInNumberOfColumns: 1,
                    modelType: StatusPage,
                    id: 'model-detail-status-page',
                    fields: [
                        {
                            field: {
                                enableSubscribers: true,
                            },
                            fieldType: FieldType.Boolean,
                            title: 'Enable Subscribers',
                        },
                    ],
                    modelId: modelId,
                }}
            />
        </ModelPage>
    );
};

export default StatusPageDelete;
