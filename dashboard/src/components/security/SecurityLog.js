import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import IssueLabel from './IssueLabel';
import ShouldRender from '../basic/ShouldRender';
import { reduxForm, Field } from 'redux-form';
import { RenderSelect } from '../basic/RenderSelect';
import flattenArray from '../../utils/flattenArray';

export class SecurityLog extends Component {
    render() {
        const severityLevel = [
            { label: 'Critical', value: 'critical' },
            { label: 'High', value: 'high' },
            { label: 'Moderate', value: 'moderate' },
            { label: 'Low', value: 'low' },
        ];
        const {
            type,
            applicationSecurityLog,
            containerSecurityLog,
            levelToFilter,
        } = this.props;

        let advisories = [];
        if (applicationSecurityLog && applicationSecurityLog.data) {
            const data = applicationSecurityLog.data;
            advisories = data.advisories;
            
            if (levelToFilter) {
                advisories = data.advisories.filter(
                    advisory => advisory.severity === levelToFilter
                );
            }
        }

        let containerLogs = [];
        if (containerSecurityLog && containerSecurityLog.data) {
            let outArr = containerSecurityLog.data.vulnerabilityData.map(
                log => {
                    return log.vulnerabilities;
                }
            );

            containerLogs = flattenArray(outArr);
            if (levelToFilter) {
                containerLogs = containerLogs.filter(
                    log => log.severity === levelToFilter
                );
            }
        }
        return (
            <div className="bs-ContentSection Card-root Card-shadow--medium Margin-bottom--12">
                <div className="ContentHeader Box-root Box-background--white Box-divider--surface-bottom-1 Flex-flex Flex-direction--column Padding-horizontal--20 Padding-vertical--16">
                    <div className="Box-root Flex-flex Flex-direction--row Flex-justifyContent--spaceBetween">
                        <div className="ContentHeader-center Box-root Flex-flex Flex-direction--column Flex-justifyContent--center">
                            <span className="Text-color--inherit Text-display--inline Text-fontSize--16 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                <span>{type} Security Log</span>
                            </span>
                            <span className="ContentHeader-description Text-color--inherit Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                <span>
                                    Here&#39;s a log of your{' '}
                                    {type.toLowerCase()} security.
                                </span>
                            </span>
                        </div>
                        <div>
                            <Field
                                className="db-select-nw"
                                component={RenderSelect}
                                name="severity"
                                id="severityFilter"
                                placeholder="Filter Issues"
                                style={{
                                    height: '28px',
                                }}
                                options={[
                                    {
                                        value: '',
                                        label: 'Filter Issues',
                                    },
                                    ...severityLevel.map(severity => ({
                                        value: severity.value,
                                        label: severity.label,
                                    })),
                                ]}
                            />
                        </div>
                    </div>
                </div>
                <div className="bs-ContentSection Card-root Card-shadow--medium">
                    <div>
                        <div style={{ overflow: 'hidden', overflowX: 'auto' }}>
                            <table className="Table">
                                <thead className="Table-body">
                                    <tr className="Table-row db-ListViewItem db-ListViewItem-header">
                                        <td
                                            className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--noWrap db-ListViewItem-cell"
                                            style={{
                                                height: '1px',
                                                // minWidth: '210px',
                                            }}
                                        >
                                            <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                <span className="db-ListViewItem-text Text-color--dark Text-display--inline Text-fontSize--13 Text-fontWeight--medium Text-lineHeight--20 Text-typeface--upper Text-wrap--wrap">
                                                    <span>status</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--noWrap db-ListViewItem-cell"
                                            style={{ height: '1px' }}
                                        >
                                            <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                <span className="db-ListViewItem-text Text-color--dark Text-display--inline Text-fontSize--13 Text-fontWeight--medium Text-lineHeight--20 Text-typeface--upper Text-wrap--wrap">
                                                    <span>issues</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--noWrap db-ListViewItem-cell"
                                            style={{ height: '1px' }}
                                        >
                                            <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                <span className="db-ListViewItem-text Text-color--dark Text-display--inline Text-fontSize--13 Text-fontWeight--medium Text-lineHeight--20 Text-typeface--upper Text-wrap--wrap">
                                                    <span>resolve by</span>
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </thead>
                                <tbody className="Table-body">
                                    <ShouldRender if={applicationSecurityLog}>
                                        {applicationSecurityLog &&
                                        advisories.length > 0 ? (
                                            advisories.map(advisory => {
                                                return (
                                                    <tr
                                                        className="Table-row db-ListViewItem bs-ActionsParent db-ListViewItem--hasLink incidentListItem"
                                                        onClick={() => {}}
                                                        style={{
                                                            borderBottom:
                                                                '2px solid #f7f7f7',
                                                        }}
                                                        key={advisory.id}
                                                    >
                                                        <td
                                                            className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--wrap db-ListViewItem-cell db-ListViewItem-cell--breakWord"
                                                            style={{
                                                                height: '1px',
                                                                maxWidth:
                                                                    '150px',
                                                                width: '200px',
                                                            }}
                                                        >
                                                            <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                                <IssueLabel
                                                                    level={
                                                                        advisory.severity
                                                                    }
                                                                />
                                                            </div>
                                                        </td>
                                                        <td
                                                            className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--wrap db-ListViewItem-cell db-ListViewItem-cell--breakWord"
                                                            style={{
                                                                height: '1px',
                                                                minWidth:
                                                                    '250px',
                                                            }}
                                                        >
                                                            <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                                <span className="db-ListViewItem-text Text-color--cyan Text-display--inline Text-fontSize--14 Text-fontWeight--medium Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                    {
                                                                        advisory.module_name
                                                                    }
                                                                </span>
                                                                <br />
                                                                <span className="db-ListViewItem-text Text-color--cyan Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                    {advisory.title ||
                                                                        advisory.overview}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td
                                                            className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--wrap db-ListViewItem-cell db-ListViewItem-cell--breakWord"
                                                            style={{
                                                                height: '1px',
                                                                minWidth:
                                                                    '250px',
                                                            }}
                                                        >
                                                            <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                                <span className="db-ListViewItem-text Text-color--cyan Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                    {advisory.recommendation ||
                                                                        'No resolution available at this point in time'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td
                                                    style={{
                                                        textAlign: 'center',
                                                        marginTop: '10px',
                                                        padding: '0px 10px',
                                                    }}
                                                    colSpan="3"
                                                >
                                                    No security issue detected
                                                    for this {type}
                                                </td>
                                            </tr>
                                        )}
                                    </ShouldRender>
                                    <ShouldRender if={containerSecurityLog}>
                                        {containerSecurityLog &&
                                        containerLogs.length > 0 ? (
                                            containerLogs.map(
                                                (vulnerability, index) => {
                                                    return (
                                                        <tr
                                                            className="Table-row db-ListViewItem bs-ActionsParent db-ListViewItem--hasLink incidentListItem"
                                                            onClick={() => {}}
                                                            style={{
                                                                borderBottom:
                                                                    '2px solid #f7f7f7',
                                                            }}
                                                            key={
                                                                vulnerability.vulnerabilityId +
                                                                index
                                                            }
                                                        >
                                                            <td
                                                                className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--wrap db-ListViewItem-cell db-ListViewItem-cell--breakWord"
                                                                style={{
                                                                    height:
                                                                        '1px',
                                                                    maxWidth:
                                                                        '150px',
                                                                    width:
                                                                        '200px',
                                                                }}
                                                            >
                                                                <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                                    <IssueLabel
                                                                        level={
                                                                            vulnerability.severity
                                                                        }
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td
                                                                className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--wrap db-ListViewItem-cell db-ListViewItem-cell--breakWord"
                                                                style={{
                                                                    height:
                                                                        '1px',
                                                                    minWidth:
                                                                        '250px',
                                                                }}
                                                            >
                                                                <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                                    <span className="db-ListViewItem-text Text-color--cyan Text-display--inline Text-fontSize--14 Text-fontWeight--medium Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                        {
                                                                            vulnerability.library
                                                                        }{' '}
                                                                        (v.
                                                                        {
                                                                            vulnerability.installedVersion
                                                                        }
                                                                        )
                                                                    </span>
                                                                    <br />
                                                                    <span className="db-ListViewItem-text Text-color--cyan Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                        {vulnerability.title ||
                                                                            vulnerability.description}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td
                                                                className="Table-cell Table-cell--align--left Table-cell--verticalAlign--top Table-cell--width--minimized Table-cell--wrap--wrap db-ListViewItem-cell db-ListViewItem-cell--breakWord"
                                                                style={{
                                                                    height:
                                                                        '1px',
                                                                    minWidth:
                                                                        '250px',
                                                                }}
                                                            >
                                                                <div className="db-ListViewItem-cellContent Box-root Padding-all--8">
                                                                    <span className="db-ListViewItem-text Text-color--cyan Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--20 Text-typeface--base Text-wrap--wrap">
                                                                        {vulnerability.fixedVersions &&
                                                                            'Upgrade to version'}{' '}
                                                                        {vulnerability.fixedVersions ||
                                                                            'No resolution available at this point in time'}{' '}
                                                                        {vulnerability.fixedVersions &&
                                                                            'or later'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    style={{
                                                        textAlign: 'center',
                                                        marginTop: '10px',
                                                        padding: '0px 10px',
                                                    }}
                                                    colSpan="3"
                                                >
                                                    No security issue detected
                                                    for this {type}
                                                </td>
                                            </tr>
                                        )}
                                    </ShouldRender>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="bs-ContentSection-footer bs-ContentSection-content Box-root Box-background--white Flex-flex Flex-alignItems--center Flex-justifyContent--spaceBetween Padding-horizontal--20 Padding-vertical--12">
                    <div></div>
                </div>
            </div>
        );
    }
}

SecurityLog.displayName = 'SecurityLog';

SecurityLog.propTypes = {
    type: PropTypes.string,
    applicationSecurityLog: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.oneOf([null, undefined]),
    ]),
    containerSecurityLog: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.oneOf([null, undefined]),
    ]),
    levelToFilter: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
};

const mapStateToProps = state => {
    return {
        levelToFilter:
            state.form.Filter &&
            state.form.Filter.values &&
            state.form.Filter.values.severity,
    };
};

const NewApplicationSecurityForm = reduxForm({
    form: 'Filter',
    destroyOnUnmount: true,
    enableReinitialize: true,
})(SecurityLog);

export default connect(mapStateToProps)(NewApplicationSecurityForm);
