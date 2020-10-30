import React, { Component } from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import moment from 'moment';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import {
    acknowledgeIncident,
    resolveIncident,
    closeIncident,
    getIncidentTimeline,
} from '../../actions/incident';
import { FormLoader, Spinner } from '../basic/Loader';
import ShouldRender from '../basic/ShouldRender';
import { User } from '../../config';
import { logEvent } from '../../analytics';
import { SHOULD_LOG_ANALYTICS } from '../../config';
import DataPathHoC from '../DataPathHoC';
import { openModal } from '../../actions/modal';
import EditIncident from '../modals/EditIncident';
import { history } from '../../store';
import MessageBox from '../modals/MessageBox';
import { markAsRead } from '../../actions/notification';

export class IncidentStatus extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editIncidentModalId: uuid.v4(),
            messageModalId: uuid.v4(),
            resolveLoad: false
        };
    }
    acknowledge = () => {
        const userId = User.getUserId();
        this.props
            .acknowledgeIncident(
                this.props.incident.projectId,
                this.props.incident._id,
                userId,
                this.props.multiple
            )
            .then(() => {
                this.props.getIncidentTimeline(
                    this.props.currentProject._id,
                    this.props.incident._id,
                    parseInt(0),
                    parseInt(10)
                );
            });
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'EVENT: DASHBOARD > PROJECT > INCIDENT > INCIDENT ACKNOWLEDGED',
                {
                    ProjectId: this.props.incident.projectId,
                    incidentId: this.props.incident._id,
                    userId: userId,
                }
            );
        }
    };

    resolve = () => {
        const userId = User.getUserId();
        this.props
            .resolveIncident(
                this.props.incident.projectId,
                this.props.incident._id,
                userId,
                this.props.multiple
            )
            .then(() => {
                this.setState({ resolveLoad: false })
                this.props.markAsRead(
                    this.props.incident.projectId,
                    this.props.incident.notificationId
                );
                this.props.getIncidentTimeline(
                    this.props.currentProject._id,
                    this.props.incident._id,
                    parseInt(0),
                    parseInt(10)
                );
            });
        if (SHOULD_LOG_ANALYTICS) {
            logEvent(
                'EVENT: DASHBOARD > PROJECT > INCIDENT > INCIDENT RESOLVED',
                {
                    ProjectId: this.props.incident.projectId,
                    incidentId: this.props.incident._id,
                    userId: userId,
                }
            );
        }
    };

    closeIncident = () => {
        this.props.closeIncident(
            this.props.incident.projectId,
            this.props.incident._id
        );
    };

    handleIncident = () => {
        if (!this.props.incident.acknowledged) {
            this.acknowledge();
        } else if (
            this.props.incident.acknowledged &&
            !this.props.incident.resolved
        ) {
            this.setState({ resolveLoad: true })
            this.resolve();
        }
    };

    render() {
        const subProject =
            this.props.subProjects &&
            this.props.subProjects.filter(
                subProject => subProject._id === this.props.incident.projectId
            )[0];
        const loggedInUser = User.getUserId();
        const isUserInProject =
            this.props.currentProject &&
            this.props.currentProject.users.some(
                user => user.userId === loggedInUser
            );
        let isUserInSubProject = false;
        if (isUserInProject) isUserInSubProject = true;
        else
            isUserInSubProject = subProject.users.some(
                user => user.userId === loggedInUser
            );
        const monitorName =
            (this.props.multiple &&
                this.props.incident &&
                this.props.incident.monitorId) ||
                (this.props.incident && this.props.incident.monitorId)
                ? this.props.incident.monitorId.name
                : '';
        const projectId = this.props.currentProject
            ? this.props.currentProject._id
            : '';
        const incidentId = this.props.incident ? this.props.incident._id : '';
        const componentId = this.props.incident
            ? this.props.incident.monitorId.componentId._id
            : '';
        const homeRoute = this.props.currentProject
            ? '/dashboard/project/' + this.props.currentProject._id
            : '';
        const monitorRoute = this.props.currentProject
            ? '/dashboard/project/' +
            projectId +
            '/' +
            componentId +
            '/monitoring'
            : '';
        const incidentRoute = this.props.currentProject
            ? '/dashboard/project/' +
            projectId +
            '/' +
            componentId +
            '/incidents/' +
            this.props.incident._id
            : '';
       
        const showResolveButton = this.props.multipleIncidentRequest
            ? !this.props.multipleIncidentRequest.resolving
            : this.props.incidentRequest &&
            !this.props.incidentRequest.resolving;

        const incidentReason =
            this.props.incident.reason &&
            this.props.incident.reason.split('\n');


        return (
            <div
                id={`incident_${this.props.count}`}
                className="Box-root Margin-bottom--12"
            >
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <div className="Box-root">
                        <div className="bs-ContentSection-content Box-root Box-divider--surface-bottom-1 Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--16">
                            <div className="Box-root">
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span
                                        id={`incident_span_${this.props.count}`}
                                    >
                                        {monitorName
                                            ? monitorName + "'s Incident Status"
                                            : 'Incident Status'}
                                    </span>
                                </span>
                                <p>
                                    <span>
                                        Acknowledge and Resolve this incident.
                                    </span>
                                </p>
                            </div>
                            <div
                                className="ContentHeader-end Box-root Flex-flex Flex-alignItems--center Margin-left--16"
                                style={{ marginTop: '-20px' }}
                            >
                                <ShouldRender
                                    if={
                                        this.props.route &&
                                        !(this.props.route === incidentRoute)
                                    }
                                >
                                    <button
                                        className="bs-Button bs-Button--icon bs-Button--more"
                                        id={`${monitorName}_ViewIncidentDetails`}
                                        type="button"
                                        onClick={() => {
                                            setTimeout(() => {
                                                history.push(
                                                    `/dashboard/project/${projectId}/${componentId}/incidents/${incidentId}`
                                                );
                                            }, 100);
                                            this.props.markAsRead(
                                                projectId,
                                                this.props.incident
                                                    .notificationId
                                            );
                                        }}
                                    >
                                        <span>View Incident</span>
                                    </button>
                                </ShouldRender>
                                <ShouldRender
                                    if={
                                        !this.props.route ||
                                        (this.props.route &&
                                            !(
                                                this.props.route ===
                                                homeRoute ||
                                                this.props.route ===
                                                monitorRoute
                                            ))
                                    }
                                >
                                    <button
                                        className="bs-Button bs-Button--icon bs-Button--settings"
                                        id={`${monitorName}_EditIncidentDetails`}
                                        type="button"
                                        onClick={() => {
                                            this.props.openModal({
                                                id: this.state
                                                    .editIncidentModalId,
                                                content: DataPathHoC(
                                                    EditIncident,
                                                    {
                                                        incident: this.props
                                                            .incident,
                                                        incidentId: this.props
                                                            .incident._id,
                                                    }
                                                ),
                                            });
                                        }}
                                    >
                                        <span>Edit Incident</span>
                                    </button>
                                </ShouldRender>
                                <ShouldRender
                                    if={
                                        this.props.multiple &&
                                        this.props.incident &&
                                        this.props.incident.resolved
                                    }
                                >
                                    <div className="Box-root Margin-left--12">
                                        <span
                                            className="incident-close-button"
                                            onClick={this.closeIncident}
                                        ></span>
                                    </div>
                                </ShouldRender>
                            </div>
                        </div>
                        <div className="bs-ContentSection-content Box-root Box-background--offset Box-divider--surface-bottom-1 Padding-horizontal--8 Padding-vertical--2">
                            <div>
                                <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                    <fieldset className="bs-Fieldset">
                                        <div className="bs-Fieldset-rows bs-header bs-content-1">
                                            <div className="bs-left-side">
                                                <div className="bs-content">
                                                    <label>Incident ID</label>
                                                    <div className="bs-content-inside">
                                                        <span
                                                            className="value"
                                                            style={{
                                                                marginTop:
                                                                    '6px',
                                                                fontWeight:
                                                                    '600',
                                                                fontSize:
                                                                    '18px',
                                                            }}
                                                        >
                                                            {`#${this.props.incident.idNumber}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bs-content">
                                                    <label className="">
                                                        Created At
                                                    </label>
                                                    <div className="bs-content-inside">
                                                        <span className="value">{`${moment(
                                                            this.props.incident
                                                                .createdAt
                                                        ).fromNow()} ${moment(
                                                            this.props.incident
                                                                .createdAt
                                                        ).format(
                                                            'MMMM Do YYYY'
                                                        )} 
                                                        (${moment(
                                                                this.props.incident
                                                                    .createdAt
                                                            ).format(
                                                                'h:mm:ss a'
                                                            )})`}</span>
                                                    </div>
                                                </div>
                                                <div className="bs-content">
                                                    <label className="">
                                                        Monitor
                                                    </label>
                                                    <div className="bs-content-inside">
                                                        <span className="value">
                                                            <Link
                                                                style={{
                                                                    textDecoration:
                                                                        'underline',
                                                                }}
                                                                to={
                                                                    '/dashboard/project/' +
                                                                    projectId +
                                                                    '/' +
                                                                    componentId +
                                                                    '/monitoring/' +
                                                                    this.props
                                                                        .incident
                                                                        .monitorId
                                                                        ._id
                                                                }
                                                                id="backToMonitorView"
                                                            >
                                                                {
                                                                    this.props
                                                                        .incident
                                                                        .monitorId
                                                                        .name
                                                                }
                                                            </Link>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bs-content">
                                                    <label className="">
                                                        Incident Status:
                                                    </label>
                                                    <div className="bs-content-inside bs-margin-off">
                                                        <span className="value">
                                                            {this.props
                                                                .incident &&
                                                                this.props.incident
                                                                    .incidentType &&
                                                                this.props.incident
                                                                    .incidentType ===
                                                                'offline' ? (
                                                                    <div className="Badge Badge--color--red Box-root Flex-inlineFlex Flex-alignItems--center Padding-horizontal--8 Padding-vertical--2">
                                                                        <span className="Badge-text Text-color--red Text-display--inline Text-fontSize--12 Text-fontWeight--bold Text-lineHeight--16 Text-typeface--upper bs-font-increase">
                                                                            <span>
                                                                                offline
                                                                        </span>
                                                                        </span>
                                                                    </div>
                                                                ) : this.props
                                                                    .incident &&
                                                                    this.props
                                                                        .incident
                                                                        .incidentType &&
                                                                    this.props
                                                                        .incident
                                                                        .incidentType ===
                                                                    'online' ? (
                                                                        <div className="Badge Badge--color--green Box-root Flex-inlineFlex Flex-alignItems--center Padding-horizontal--8 Padding-vertical--2">
                                                                            <span className="Badge-text Text-color--green Text-display--inline Text-fontSize--12 Text-fontWeight--bold Text-lineHeight--16 Text-typeface--upper bs-font-increase">
                                                                                <span>
                                                                                    online
                                                                        </span>
                                                                            </span>
                                                                        </div>
                                                                    ) : this.props
                                                                        .incident &&
                                                                        this.props
                                                                            .incident
                                                                            .incidentType &&
                                                                        this.props
                                                                            .incident
                                                                            .incidentType ===
                                                                        'degraded' ? (
                                                                            <div className="Badge Badge--color--yellow Box-root Flex-inlineFlex Flex-alignItems--center Padding-horizontal--8 Padding-vertical--2">
                                                                                <span className="Badge-text Text-color--yellow Text-display--inline Text-fontSize--12 Text-fontWeight--bold Text-lineHeight--16 Text-typeface--upper bs-font-increase">
                                                                                    <span>
                                                                                        degraded
                                                                        </span>
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="Badge Badge--color--red Box-root Flex-inlineFlex Flex-alignItems--center Padding-horizontal--8 Padding-vertical--2">
                                                                                <span className="Badge-text Text-color--red Text-display--inline Text-fontSize--12 Text-fontWeight--bold Text-lineHeight--16 Text-typeface--upper">
                                                                                    <span>
                                                                                        Unknown
                                                                                        Status
                                                                        </span>
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                        </span>
                                                    </div>
                                                </div>
                                                {this.props.incident
                                                    .acknowledged ? (
                                                        <>
                                                            <div className="bs-content">
                                                                <label className="">
                                                                    Incident Timeline
                                                            </label>
                                                                <div className="bs-content-inside bs-margin-top-1">
                                                                    <div>
                                                                        <div className="bs-flex-display bs-justify-cont">
                                                                            <div className="bs-circle-span-yellow"></div>
                                                                            <div
                                                                                id={`AcknowledgeText_${this.props.count}`}
                                                                                className="bs-margin-right"
                                                                            >
                                                                                Acknowledged
                                                                            by{' '}
                                                                            {
                                                                                this.props.incident.acknowledgedBy &&
                                                                                <Link
                                                                                    style={{
                                                                                        textDecoration:
                                                                                            'underline',
                                                                                    }}
                                                                                    to={
                                                                                        '/dashboard/profile/'
                                                                                        + this.props
                                                                                            .incident
                                                                                            .acknowledgedBy
                                                                                            ._id
                                                                                    }
                                                                                >
                                                                                    {this
                                                                                        .props
                                                                                        .incident
                                                                                        .acknowledgedBy ===
                                                                                        null
                                                                                        ? this
                                                                                            .props
                                                                                            .incident
                                                                                            .acknowledgedByZapier
                                                                                            ? 'Zapier'
                                                                                            : 'Fyipe'
                                                                                        : this
                                                                                            .props
                                                                                            .incident
                                                                                            .acknowledgedBy
                                                                                            .name}{' '}
                                                                                </Link>
                                                                            }
                                                                            </div>
                                                                        </div>
                                                                        <div className="bs-date-time">
                                                                            <span>This incident was acknowledged ins </span>
                                                                            {moment(
                                                                                this
                                                                                    .props
                                                                                    .incident
                                                                                    .acknowledgedAt
                                                                            ).fromNow() +
                                                                                '.'}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <span className="Badge-text Text-display--inline Text-fontSize--10 Text-lineHeight--16">
                                                                            {
                                                                                moment(
                                                                                    this
                                                                                        .props
                                                                                        .incident
                                                                                        .acknowledgedAt
                                                                                )
                                                                                    .from(
                                                                                        this
                                                                                            .props
                                                                                            .incident
                                                                                            .createdAt
                                                                                    )
                                                                                    .split(
                                                                                        'ago'
                                                                                    )[0]
                                                                            }{' '}

                                                                            {moment(
                                                                                this
                                                                                    .props
                                                                                    .incident
                                                                                    .acknowledgedAt
                                                                            ).format(
                                                                                'MMMM Do YYYY'
                                                                            )}{" "}
                                                                        ({moment(
                                                                                this
                                                                                    .props
                                                                                    .incident
                                                                                    .acknowledgedAt
                                                                            ).format(
                                                                                'h:mm:ss a'
                                                                            )})
                                                                    </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : isUserInSubProject ? (
                                                        <div className="bs-content">
                                                            <label className="">
                                                                Incident Timeline
                                                            </label>
                                                            <div className="bs-flex-display bs-margin-top-1 bs-justify-cont">
                                                                <div className="bs-circle-span"></div>
                                                                <div className="bs-content-create">Created At</div>
                                                            </div>
                                                            <div className="bs-value">{`${moment(
                                                                this.props.incident
                                                                    .createdAt
                                                            ).fromNow()} ${moment(
                                                                this.props.incident
                                                                    .createdAt
                                                            ).format(
                                                                'MMMM Do YYYY'
                                                            )} 
                                                            (${moment(
                                                                this.props.incident
                                                                    .createdAt
                                                            ).format(
                                                                'h:mm:ss a'
                                                            )})
                                                            `}</div>
                                                        </div>
                                                    ) : (
                                                            <div className="bs-content">
                                                                <label className="">
                                                                    Incident Timeline
                                                            </label>
                                                                <div className="bs-content-inside">
                                                                    <div className="Badge Badge--color--red Box-root Flex-inlineFlex Flex-alignItems--center Padding-horizontal--8 Padding-vertical--2">
                                                                        <span className="Badge-text Text-color--red Text-display--inline Text-fontSize--12 Text-fontWeight--bold Text-lineHeight--16 Text-typeface--upper">
                                                                            <span>
                                                                                Not
                                                                                Acknowledged
                                                                    </span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                {this.props.incident
                                                    .resolved ? (
                                                        <>
                                                            <div className="bs-content bs-margin-top">
                                                                <div className="bs-content-inside">
                                                                    <div>
                                                                        <div className="bs-flex-display bs-justify-cont bs-m-top">
                                                                            <div className="bs-circle-span-green"></div>
                                                                            <div
                                                                                id={`ResolveText_${this.props.count}`}
                                                                                className="bs-margin-right"
                                                                            >
                                                                                Resolved
                                                                            by{' '}
                                                                            {
                                                                                this.props.incident.resolvedBy &&
                                                                                <Link
                                                                                    style={{
                                                                                        textDecoration:
                                                                                            'underline',
                                                                                    }}
                                                                                    to={
                                                                                        '/dashboard/profile/'
                                                                                        + this.props
                                                                                            .incident
                                                                                            .resolvedBy
                                                                                            ._id
                                                                                    }
                                                                                >
                                                                                    {this
                                                                                        .props
                                                                                        .incident
                                                                                        .resolvedBy ===
                                                                                        null
                                                                                        ? this
                                                                                            .props
                                                                                            .incident
                                                                                            .resolvedByZapier
                                                                                            ? 'Zapier'
                                                                                            : 'Fyipe'
                                                                                        : this
                                                                                            .props
                                                                                            .incident
                                                                                            .resolvedBy
                                                                                            .name}
                                                                                </Link>
                                                                            }
                                                                                {' '}
                                                                            </div>
                                                                        </div>
                                                                        <div className="bs-date-time">
                                                                            <span>This incident was resolved in </span>
                                                                            {moment(
                                                                                this
                                                                                    .props
                                                                                    .incident
                                                                                    .resolvedAt
                                                                            ).fromNow() +
                                                                                '.'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="bs-content-inside">
                                                                        <span className="Badge-text Text-display--inline Text-fontSize--10 Text-lineHeight--16">
                                                                            {
                                                                                moment(
                                                                                    this
                                                                                        .props
                                                                                        .incident
                                                                                        .resolvedAt
                                                                                )
                                                                                    .from(
                                                                                        this
                                                                                            .props
                                                                                            .incident
                                                                                            .createdAt
                                                                                    )
                                                                                    .split(
                                                                                        'ago'
                                                                                    )[0]
                                                                            }{' '}
                                                                            {moment(
                                                                                this
                                                                                    .props
                                                                                    .incident
                                                                                    .resolvedAt
                                                                            ).format(
                                                                                'MMMM Do YYYY'
                                                                            )}{" "}
                                                                        (
                                                                            {moment(
                                                                                this
                                                                                    .props
                                                                                    .incident
                                                                                    .resolvedAt
                                                                            ).format(
                                                                                'h:mm:ss a'
                                                                            )}
                                                                        )
                                                                    </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : isUserInSubProject ? (
                                                        <>
                                                            {
                                                                this.props.incident.acknowledged &&
                                                                <div className="bs-content bs-margin-top">
                                                                    <div className="bs-content-inside">
                                                                        <div
                                                                            className="bs-font-increase"
                                                                            title="Let your team know you've fixed this incident."
                                                                        >
                                                                            <div>
                                                                                <ShouldRender
                                                                                    if={
                                                                                        showResolveButton
                                                                                    }
                                                                                >
                                                                                    <label
                                                                                        id={`btnResolve_${this.props.count}`}
                                                                                        className="Bs-btn-no bs-flex-display bs-margin-left"
                                                                                    >
                                                                                        <div className="bs-circle-span"></div>
                                                                                        <div className="bs-margin-right">
                                                                                            Not Resolved
                                                                            </div>
                                                                                    </label>
                                                                                </ShouldRender>
                                                                            </div>
                                                                        </div>
                                                                        <p className="bs-Fieldset-explanation">
                                                                            <span>
                                                                                Let your
                                                                                team know
                                                                                you&#39;ve
                                                                                fixed this
                                                                                incident.
                                                                </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            }
                                                        </>
                                                    ) : (
                                                            <div className="bs-content bs-margin-top">
                                                                <div className="bs-content-inside">
                                                                    <div className="Badge Badge--color--red Box-root Flex-inlineFlex Flex-alignItems--center Padding-horizontal--8 Padding-vertical--2">
                                                                        <span className="Badge-text Text-color--red Text-display--inline Text-fontSize--12 Text-fontWeight--bold Text-lineHeight--16 Text-typeface--upper">
                                                                            <span>
                                                                                Not
                                                                                Resolved
                                                                    </span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                            </div>
                                            <div className="bs-right-side">
                                                {this.props.incident.title && (
                                                    <div className="bs-content bs-title">
                                                        <label className="">
                                                            Title
                                                        </label>
                                                        <div className="bs-content-inside">
                                                            <span className="value">
                                                                {
                                                                    this.props
                                                                        .incident
                                                                        .title
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {this.props.incident
                                                    .description && (
                                                        <div className="bs-content">
                                                            <label className="">
                                                                Description
                                                        </label>
                                                            <div className="bs-content-inside">
                                                                <ReactMarkdown
                                                                    source={
                                                                        this.props
                                                                            .incident
                                                                            .description
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                {this.props.incident
                                                    .manuallyCreated && (
                                                        <div className="bs-content">
                                                            <label className="">
                                                                Cause
                                                        </label>
                                                            <div className="bs-content-inside">
                                                                <div className="bs-flex-display bs-display-block">
                                                                    <span>This incident was created by</span>
                                                                    <Link
                                                                        style={{
                                                                            textDecoration:
                                                                                'underline',
                                                                            marginLeft: '4px'
                                                                        }}
                                                                        to={
                                                                            '/dashboard/profile/'
                                                                            + this.props
                                                                                .incident
                                                                                .createdById
                                                                                ._id
                                                                        }
                                                                    >
                                                                        <div>
                                                                            {
                                                                                this.props
                                                                                    .incident
                                                                                    .createdById
                                                                                    .name
                                                                            }
                                                                        </div>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                {this.props.incident
                                                    .incidentType &&
                                                    this.props.incident
                                                        .reason && (
                                                        <div className="bs-content">
                                                            <label className="">
                                                                Cause :
                                                            </label>
                                                            <div
                                                                className="bs-content-inside"
                                                                id={`${monitorName}_IncidentReport`}
                                                            >
                                                                <ReactMarkdown
                                                                    source={`${incidentReason &&
                                                                        incidentReason.length >
                                                                        1
                                                                        ? ':\n' +
                                                                        incidentReason
                                                                            .map(
                                                                                a =>
                                                                                    '- **&middot; ' +
                                                                                    a +
                                                                                    '**.'
                                                                            )
                                                                            .join(
                                                                                '\n'
                                                                            )
                                                                        : ' **' +
                                                                        incidentReason.pop() +
                                                                        '**.'
                                                                        }`}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                {this.props.incident
                                                    .incidentPriority && (
                                                        <div className="bs-content">
                                                            <label className="">
                                                                Priority
                                                        </label>
                                                            <div className="bs-content-inside">
                                                                <div className="Flex-flex Flex-alignItems--center bs-justify-cont">
                                                                    <span
                                                                        className="Margin-right--4"
                                                                        style={{
                                                                            display:
                                                                                'inline-block',
                                                                            backgroundColor: `rgba(${this.props.incident.incidentPriority.color.r},${this.props.incident.incidentPriority.color.g},${this.props.incident.incidentPriority.color.b},${this.props.incident.incidentPriority.color.a})`,
                                                                            height:
                                                                                '15px',
                                                                            width:
                                                                                '15px',
                                                                            borderRadius:
                                                                                '30%',
                                                                        }}
                                                                    ></span>
                                                                    <span
                                                                        className="Text-fontWeight--medium"
                                                                        style={{
                                                                            color: `rgba(${this.props.incident.incidentPriority.color.r},${this.props.incident.incidentPriority.color.g},${this.props.incident.incidentPriority.color.b},${this.props.incident.incidentPriority.color.a})`,
                                                                        }}
                                                                    >
                                                                        {
                                                                            this
                                                                                .props
                                                                                .incident
                                                                                .incidentPriority
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>
                        </div>

                        <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--flexEnd Padding-horizontal--20 Padding-bottom--12">
                            <button
                                className={this.props.incident.acknowledged && this.props.incident.resolved ? "bs-btn-extra bs-Button bs-flex-display bs-remove-shadow" : "bs-btn-extra bs-Button bs-flex-display"}
                                id={`${monitorName}_EditIncidentDetails`}
                                type="button"
                                onClick={this.handleIncident}
                            >
                                {this.props.incident.acknowledged && this.props.incident.resolved && <div className="bs-icon-resolved"></div>}
                                {
                                    (this.props.incidentRequest && this.props.incidentRequest.requesting) ? null :
                                        !this.props.incident.acknowledged && (this.props.incidentRequest && !this.props.incidentRequest.requesting) ?
                                            <div className="bs-circle"></div> : null
                                }
                                {
                                    (this.state.resolveLoad) ? null :
                                        (this.props.incident.acknowledged && !this.props.incident.resolved) && (!this.state.resolveLoad) ?
                                            <div className="bs-ticks"></div> : null
                                }
                                <div
                                    className={this.props.incident.acknowledged && this.props.incident.resolved && "bs-resolved-green"}
                                >
                                    <ShouldRender
                                        if={
                                            (this.props.incidentRequest &&
                                                this.props.incidentRequest
                                                    .requesting) ||
                                            (this.props
                                                .multipleIncidentRequest &&
                                                this.props
                                                    .multipleIncidentRequest
                                                    .requesting) ||
                                            (this.props.incidentRequest &&
                                                this.props.incidentRequest
                                                    .resolving) ||
                                            (this.props
                                                .multipleIncidentRequest &&
                                                this.props
                                                    .multipleIncidentRequest
                                                    .resolving)
                                        }
                                    >
                                        <Spinner
                                            style={{
                                                stroke: '#000000',
                                            }}
                                        />
                                    </ShouldRender>
                                    {!this.props.incident.acknowledged
                                        ? 'Acknowledge Incident'
                                        : this.props.incident.acknowledged &&
                                            !this.props.incident.resolved
                                            ? 'Resolve Incident'
                                            : 'The incident is resolved'}
                                </div>
                            </button>
                        </div>

                        <ShouldRender
                            if={this.props.multiple && this.props.incident}
                        >
                            <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--flexEnd Padding-horizontal--20 Padding-vertical--12">
                                <div>
                                    <button
                                        onClick={() => {
                                            this.props.incident.resolved
                                                ? this.closeIncident()
                                                : this.props.openModal({
                                                    id: this.state
                                                        .messageModalId,
                                                    onClose: () => '',
                                                    content: DataPathHoC(
                                                        MessageBox,
                                                        {
                                                            messageBoxId: this
                                                                .state
                                                                .messageModalId,
                                                            title: 'Warning',
                                                            message:
                                                                'This incident cannot be closed because it is not acknowledged or resolved',
                                                        }
                                                    ),
                                                });
                                        }}
                                        className={
                                            this.props.closeincident &&
                                                this.props.closeincident.requesting
                                                ? 'bs-Button bs-Button--blue'
                                                : 'bs-Button bs-DeprecatedButton db-Trends-editButton'
                                        }
                                        disabled={
                                            this.props.closeincident &&
                                            this.props.closeincident.requesting
                                        }
                                        type="button"
                                        id={`closeIncidentButton_${this.props.count}`}
                                    >
                                        <ShouldRender
                                            if={
                                                this.props.closeincident &&
                                                this.props.closeincident
                                                    .requesting &&
                                                this.props.closeincident
                                                    .requesting ===
                                                this.props.incident._id
                                            }
                                        >
                                            <FormLoader />
                                        </ShouldRender>
                                        <ShouldRender
                                            if={
                                                this.props.closeincident &&
                                                (!this.props.closeincident
                                                    .requesting ||
                                                    (this.props.closeincident
                                                        .requesting &&
                                                        this.props.closeincident
                                                            .requesting !==
                                                        this.props.incident
                                                            ._id))
                                            }
                                        >
                                            <span>Close</span>
                                        </ShouldRender>
                                    </button>
                                </div>
                            </div>
                        </ShouldRender>
                    </div>
                </div>
            </div>
        );
    }
}

IncidentStatus.displayName = 'IncidentStatus';

const mapStateToProps = state => {
    return {
        currentProject: state.project.currentProject,
        closeincident: state.incident.closeincident,
        subProjects: state.subProject.subProjects.subProjects,
        incidentRequest: state.incident.incident,
    };
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        {
            resolveIncident,
            acknowledgeIncident,
            closeIncident,
            openModal,
            markAsRead,
            getIncidentTimeline,
        },
        dispatch
    );
};

IncidentStatus.propTypes = {
    resolveIncident: PropTypes.func.isRequired,
    acknowledgeIncident: PropTypes.func.isRequired,
    closeIncident: PropTypes.func,
    closeincident: PropTypes.object,
    requesting: PropTypes.bool,
    incident: PropTypes.object.isRequired,
    currentProject: PropTypes.object.isRequired,
    subProjects: PropTypes.array.isRequired,
    multiple: PropTypes.bool,
    count: PropTypes.number,
    openModal: PropTypes.func.isRequired,
    projectId: PropTypes.string,
    componentId: PropTypes.string,
    route: PropTypes.string,
    incidentRequest: PropTypes.object.isRequired,
    multipleIncidentRequest: PropTypes.object,
    markAsRead: PropTypes.func,
    getIncidentTimeline: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(IncidentStatus);
