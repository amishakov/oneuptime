import React, { Component } from 'react';
import PropTypes from 'prop-types';

class DeleteMonitor extends Component {
	handleKeyBoard = (e) => {
		switch (e.key) {
			case 'Escape':
				return this.props.closeThisDialog()
			default:
				return false;
		}
	}

	render() {
		return (
			<div onKeyDown={this.handleKeyBoard} className="ModalLayer-wash Box-root Flex-flex Flex-alignItems--flexStart Flex-justifyContent--center">
				<div
					className="ModalLayer-contents"
					tabIndex={-1}
					style={{ marginTop: 40 }}
				>
					<div className="bs-BIM">
						<div className="bs-Modal bs-Modal--medium">
							<div className="bs-Modal-header">
								<div className="bs-Modal-header-copy">
									<span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
										<span>Confirm Deletion</span>
									</span>
								</div>
							</div>
							<div className="bs-Modal-content">
								<span className="Text-color--inherit Text-display--inline Text-fontSize--14 Text-fontWeight--regular Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
									Are you sure you want to delete this monitor ?
					</span>
							</div>
							<div className="bs-Modal-footer">
								<div className="bs-Modal-footer-actions">
									<button className="bs-Button bs-DeprecatedButton bs-Button--grey" type="button" onClick={this.props.closeThisDialog}>
										<span>Cancel</span>
									</button>
									<button id="deleteMonitor" className="bs-Button bs-DeprecatedButton bs-Button--red" type="button" onClick={this.props.confirmThisDialog}>
										<span>Delete</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

DeleteMonitor.displayName = 'DeleteMonitorFormModal'

DeleteMonitor.propTypes = {
	confirmThisDialog: PropTypes.func.isRequired,
	closeThisDialog: PropTypes.func.isRequired
}

export default DeleteMonitor;