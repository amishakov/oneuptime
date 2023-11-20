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
                    title: 'Settings',
                    to: RouteUtil.populateRouteParams(
                        RouteMap[
                            PageMap.STATUS_PAGE_VIEW_AUTHENTICATION_SETTINGS
                        ] as Route,
                        { modelId }
                    ),
                },
            ]}
            sideMenu={<SideMenu modelId={modelId} />}
        >
            <CardModelDetail<StatusPage>
                name="Status Page > Settings"
                cardProps={{
                    title: 'Incident Settings',
                    description: 'Incident Settings for Status Page',
                }}
                editButtonText="Edit Settings"
                isEditable={true}
                formFields={[
                    {
                        field: {
                            showIncidentHistoryInDays: true,
                        },
                        title: 'Show Incident History (in days)',
                        fieldType: FormFieldSchemaType.Number,
                        required: true,
                        placeholder: '14',
                    },
                    {
                        field: {
                            showIncidentLabelsOnStatusPage: true,
                        },
                        title: 'Show Incident Labels',
                        fieldType: FormFieldSchemaType.Toggle,
                        required: false,
                    },
                ]}
                modelDetailProps={{
                    showDetailsInNumberOfColumns: 1,
                    modelType: StatusPage,
                    id: 'model-detail-status-page',
                    fields: [
                        {
                            field: {
                                showIncidentHistoryInDays: true,
                            },
                            fieldType: FieldType.Number,
                            title: 'Show Incident History (in days)',
                        },
                        {
                            field: {
                                showIncidentLabelsOnStatusPage: true,
                            },
                            fieldType: FieldType.Boolean,
                            title: 'Show Incident Labels',
                            placeholder: 'No',
                        },
                    ],
                    modelId: modelId,
                }}
            />

            <CardModelDetail<StatusPage>
                name="Status Page > Settings"
                cardProps={{
                    title: 'Announcement Settings',
                    description: 'Announcement Settings for Status Page',
                }}
                editButtonText="Edit Settings"
                isEditable={true}
                formFields={[
                    {
                        field: {
                            showAnnouncementHistoryInDays: true,
                        },
                        title: 'Show Announcement History (in days)',
                        fieldType: FormFieldSchemaType.Number,
                        required: true,
                        placeholder: '14',
                    },
                ]}
                modelDetailProps={{
                    showDetailsInNumberOfColumns: 1,
                    modelType: StatusPage,
                    id: 'model-detail-status-page',
                    fields: [
                        {
                            field: {
                                showAnnouncementHistoryInDays: true,
                            },
                            fieldType: FieldType.Number,
                            title: 'Show Announcement History (in days)',
                        },
                    ],
                    modelId: modelId,
                }}
            />

            <CardModelDetail<StatusPage>
                name="Status Page > Settings"
                cardProps={{
                    title: 'Scheduled Event Settings',
                    description: 'Scheduled Event Settings for Status Page',
                }}
                editButtonText="Edit Settings"
                isEditable={true}
                formFields={[
                    {
                        field: {
                            showScheduledEventHistoryInDays: true,
                        },
                        title: 'Show Scheduled Event History (in days)',
                        fieldType: FormFieldSchemaType.Number,
                        required: true,
                        placeholder: '14',
                    },
                    {
                        field: {
                            showScheduledEventLabelsOnStatusPage: true,
                        },
                        title: 'Show Event Labels',
                        fieldType: FormFieldSchemaType.Toggle,
                        required: false,
                    },
                ]}
                modelDetailProps={{
                    showDetailsInNumberOfColumns: 1,
                    modelType: StatusPage,
                    id: 'model-detail-status-page',
                    fields: [
                        {
                            field: {
                                showScheduledEventHistoryInDays: true,
                            },
                            fieldType: FieldType.Number,
                            title: 'Show Scheduled Event History (in days)',
                        },
                        {
                            field: {
                                showScheduledEventLabelsOnStatusPage: true,
                            },
                            fieldType: FieldType.Boolean,
                            title: 'Show Event Labels',
                            placeholder: 'No',
                        },
                    ],
                    modelId: modelId,
                }}
            />
        </ModelPage>
    );
};

export default StatusPageDelete;
