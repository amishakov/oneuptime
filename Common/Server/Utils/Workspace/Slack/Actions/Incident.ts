import BadDataException from "../../../../../Types/Exception/BadDataException";
import ObjectID from "../../../../../Types/ObjectID";
import IncidentService from "../../../../Services/IncidentService";
import { ExpressRequest, ExpressResponse } from "../../../Express";
import SlackUtil from "../Slack";
import SlackActionType from "./ActionTypes";
import { SlackAction, SlackRequest } from "./Auth";
import Response from "../../../Response";
import {
  WorkspaceDropdownBlock,
  WorkspaceMessageBlock,
  WorkspaceModalBlock,
  WorkspacePayloadMarkdown,
  WorkspaceTextAreaBlock,
  WorkspaceTextBoxBlock,
} from "../../../../../Types/Workspace/WorkspaceMessagePayload";
import IncidentPublicNoteService from "../../../../Services/IncidentPublicNoteService";
import IncidentInternalNoteService from "../../../../Services/IncidentInternalNoteService";
import OnCallDutyPolicy from "../../../../../Models/DatabaseModels/OnCallDutyPolicy";
import OnCallDutyPolicyService from "../../../../Services/OnCallDutyPolicyService";
import { LIMIT_PER_PROJECT } from "../../../../../Types/Database/LimitMax";
import { DropdownOption } from "../../../../../UI/Components/Dropdown/Dropdown";
import UserNotificationEventType from "../../../../../Types/UserNotification/UserNotificationEventType";
import IncidentState from "../../../../../Models/DatabaseModels/IncidentState";
import IncidentStateService from "../../../../Services/IncidentStateService";
import logger from "../../../Logger";
import IncidentSeverity from "../../../../../Models/DatabaseModels/IncidentSeverity";
import IncidentSeverityService from "../../../../Services/IncidentSeverityService";
import SortOrder from "../../../../../Types/BaseDatabase/SortOrder";
import Monitor from "../../../../../Models/DatabaseModels/Monitor";
import MonitorService from "../../../../Services/MonitorService";
import MonitorStatus from "../../../../../Models/DatabaseModels/MonitorStatus";
import MonitorStatusService from "../../../../Services/MonitorStatusService";
import Label from "../../../../../Models/DatabaseModels/Label";
import LabelService from "../../../../Services/LabelService";
import Incident from "../../../../../Models/DatabaseModels/Incident";

export default class SlackIncidentActions {
  public static isIncidentAction(data: {
    actionType: SlackActionType;
  }): boolean {
    const { actionType } = data;

    switch (actionType) {
      case SlackActionType.AcknowledgeIncident:
      case SlackActionType.ResolveIncident:
      case SlackActionType.ViewAddIncidentNote:
      case SlackActionType.SubmitIncidentNote:
      case SlackActionType.ViewChangeIncidentState:
      case SlackActionType.SubmitChangeIncidentState:
      case SlackActionType.ViewExecuteIncidentOnCallPolicy:
      case SlackActionType.SubmitExecuteIncidentOnCallPolicy:
      case SlackActionType.ViewIncident:
      case SlackActionType.NewIncident:
      case SlackActionType.SubmitNewIncident:
        return true;
      default:
        return false;
    }
  }

  public static async submitNewIncident(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { slackRequest, req, res } = data;
    const { botUserId, userId, projectAuthToken } = slackRequest;

    if (!userId) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid User ID")
      );
    }

    if (!projectAuthToken) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Project Auth Token")
      );
    }

    if (!botUserId) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Bot User ID")
      );
    }

    if (data.action.actionType === SlackActionType.SubmitNewIncident) {
      // We send this early let slack know we're ok. We'll do the rest in the background.
      
      // if view values is empty, then return error.
      if (!data.slackRequest.viewValues) {
        return Response.sendErrorResponse(
          req,
          res,
          new BadDataException("Invalid View Values")
        );
      }

      if (!data.slackRequest.viewValues["incidentTitle"]) {
        return Response.sendErrorResponse(
          req,
          res,
          new BadDataException("Invalid Incident Title")
        );
      }

      if (!data.slackRequest.viewValues["incidentDescription"]) {
        return Response.sendErrorResponse(
          req,
          res,
          new BadDataException("Invalid Incident Description")
        );
      }

      if (!data.slackRequest.viewValues["incidentSeverity"]) {
        return Response.sendErrorResponse(
          req,
          res,
          new BadDataException("Invalid Incident Severity")
        );
      }

      Response.sendJsonObjectResponse(req, res, {
        response_action: "clear",
      });


      const title: string =
        data.slackRequest.viewValues["incidentTitle"].toString();
      const description: string =
        data.slackRequest.viewValues["incidentDescription"].toString();
      const severity: string =
        data.slackRequest.viewValues["incidentSeverity"].toString();
      const monitors: Array<string> = (data.slackRequest.viewValues[
        "incidentMonitors"
      ] || []) as Array<string>;
      const monitorStatus: string | undefined =
        data.slackRequest.viewValues["monitorStatus"]?.toString();

      const labels: Array<string> =
        (data.slackRequest.viewValues["labels"] as Array<string>) || [];

      const incidentMonitors: Array<ObjectID> = monitors.map(
        (monitor: string) => {
          return new ObjectID(monitor);
        }
      );
      const incidentLabels: Array<ObjectID> = labels.map((label: string) => {
        return new ObjectID(label);
      });

      const incidentSeverityId: ObjectID = new ObjectID(severity);
      const monitorStatusId: ObjectID | undefined = monitorStatus
        ? new ObjectID(monitorStatus)
        : undefined;

      const incident: Incident = new Incident();
      incident.title = title;
      incident.description = description;
      incident.projectId = slackRequest.projectId!;
      incident.createdByUserId = userId;
      incident.incidentSeverityId = incidentSeverityId;

      if (monitors.length > 0) {
        incident.monitors = incidentMonitors.map((monitorId: ObjectID) => {
          const monitor: Monitor = new Monitor();
          monitor.id = monitorId;
          return monitor;
        });
      }

      if (monitorStatusId) {
        incident.changeMonitorStatusToId = monitorStatusId;
      }

      if (incidentLabels.length > 0) {
        incident.labels = incidentLabels.map((labelId: ObjectID) => {
          const label: Label = new Label();
          label.id = labelId;
          return label;
        });
      }

      await IncidentService.create({
        data: incident,
        props: {
          isRoot: true,
        },
      });
    }
  }

  public static async viewNewIncidentModal(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const blocks: Array<WorkspaceMessageBlock> = [];

    // send response to clear the action.
    Response.sendTextResponse(data.req, data.res, "");

    // show new incident modal.
    // new incident modal is :
    // Incident Title (this can be prefilled with actionValue)
    // Incident Description
    // Incident Severity (dropdown) (single select)
    // Monitors (dropdown) (miltiselect)
    // Change Monitor Status to (dropdown) (single select)
    // Labels (dropdown) (multiselect)

    const incidentTitle: WorkspaceTextBoxBlock = {
      _type: "WorkspaceTextBoxBlock",
      label: "Incident Title",
      blockId: "incidentTitle",
      placeholder: "Incident Title",
      initialValue: data.action.actionValue || "",
    };

    blocks.push(incidentTitle);

    const incidentDescription: WorkspaceTextAreaBlock = {
      _type: "WorkspaceTextAreaBlock",
      label: "Incident Description",
      blockId: "incidentDescription",
      placeholder: "Incident Description",
    };

    blocks.push(incidentDescription);

    const incidentSeveritiesForProject: Array<IncidentSeverity> =
      await IncidentSeverityService.findBy({
        query: {
          projectId: data.slackRequest.projectId!,
        },
        sort: {
          order: SortOrder.Ascending,
        },
        skip: 0,
        limit: LIMIT_PER_PROJECT,
        select: {
          name: true,
        },
        props: {
          isRoot: true,
        },
      });

    const dropdownOptions: Array<DropdownOption> =
      incidentSeveritiesForProject.map((severity: IncidentSeverity) => {
        return {
          label: severity.name || "",
          value: severity._id?.toString() || "",
        };
      });

    const incidentSeverity: WorkspaceDropdownBlock = {
      _type: "WorkspaceDropdownBlock",
      label: "Incident Severity",
      blockId: "incidentSeverity",
      placeholder: "Select Incident Severity",
      options: dropdownOptions,
    };

    if (incidentSeveritiesForProject.length > 0) {
      blocks.push(incidentSeverity);
    }

    const monitorsForProject: Array<Monitor> = await MonitorService.findBy({
      query: {
        projectId: data.slackRequest.projectId!,
      },
      select: {
        name: true,
      },
      props: {
        isRoot: true,
      },
      limit: LIMIT_PER_PROJECT,
      skip: 0,
    });

    const monitorDropdownOptions: Array<DropdownOption> =
      monitorsForProject.map((monitor: Monitor) => {
        return {
          label: monitor.name || "",
          value: monitor._id?.toString() || "",
        };
      });

    const incidentMonitors: WorkspaceDropdownBlock = {
      _type: "WorkspaceDropdownBlock",
      label: "Monitors",
      blockId: "incidentMonitors",
      placeholder: "Select Monitors",
      options: monitorDropdownOptions,
      multiSelect: true,
      optional: true,
    };

    if (monitorsForProject.length > 0) {
      blocks.push(incidentMonitors);
    }

    const monitorStatusForProject: Array<MonitorStatus> =
      await MonitorStatusService.findBy({
        query: {
          projectId: data.slackRequest.projectId!,
        },
        select: {
          name: true,
        },
        props: {
          isRoot: true,
        },
        sort: {
          priority: SortOrder.Ascending,
        },
        limit: LIMIT_PER_PROJECT,
        skip: 0,
      });

    const monitorStatusDropdownOptions: Array<DropdownOption> =
      monitorStatusForProject.map((status: MonitorStatus) => {
        return {
          label: status.name || "",
          value: status._id?.toString() || "",
        };
      });

    const monitorStatusDropdown: WorkspaceDropdownBlock = {
      _type: "WorkspaceDropdownBlock",
      label: "Change Monitor Status to",
      blockId: "monitorStatus",
      placeholder: "Select Monitor Status",
      options: monitorStatusDropdownOptions,
    };

    if (
      monitorStatusForProject.length > 0 &&
      monitorDropdownOptions.length > 0
    ) {
      blocks.push(monitorStatusDropdown);
    }

    const labelsForProject: Array<Label> = await LabelService.findBy({
      query: {
        projectId: data.slackRequest.projectId!,
      },
      select: {
        name: true,
      },
      props: {
        isRoot: true,
      },
      limit: LIMIT_PER_PROJECT,
      skip: 0,
    });

    const labelsDropdownOptions: Array<DropdownOption> = labelsForProject.map(
      (label: Label) => {
        return {
          label: label.name || "",
          value: label._id?.toString() || "",
        };
      }
    );

    const labelsDropdown: WorkspaceDropdownBlock = {
      _type: "WorkspaceDropdownBlock",
      label: "Labels",
      blockId: "labels",
      placeholder: "Select Labels",
      options: labelsDropdownOptions,
      multiSelect: true,
    };

    if (labelsForProject.length > 0) {
      blocks.push(labelsDropdown);
    }

    const modalBlock: WorkspaceModalBlock = {
      _type: "WorkspaceModalBlock",
      title: "New Incident",
      submitButtonTitle: "Submit",
      cancelButtonTitle: "Cancel",
      actionId: SlackActionType.SubmitNewIncident,
      actionValue: "",
      blocks: blocks,
    };

    await SlackUtil.showModalToUser({
      authToken: data.slackRequest.projectAuthToken!,
      modalBlock: modalBlock,
      triggerId: data.slackRequest.triggerId!,
    });
  }

  public static async acknowledgeIncident(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { slackRequest, req, res } = data;
    const { botUserId, userId, projectAuthToken, slackUsername } = slackRequest;

    const { actionValue } = data.action;

    if (!actionValue) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Incident ID")
      );
    }

    if (!userId) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid User ID")
      );
    }

    if (!projectAuthToken) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Project Auth Token")
      );
    }

    if (!botUserId) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Bot User ID")
      );
    }

    if (data.action.actionType === SlackActionType.AcknowledgeIncident) {
      const incidentId: ObjectID = new ObjectID(actionValue);

      // We send this early let slack know we're ok. We'll do the rest in the background.
      Response.sendJsonObjectResponse(req, res, {
        response_action: "clear",
      });

      const isAlreadyAcknowledged: boolean =
        await IncidentService.isIncidentAcknowledged({
          incidentId: incidentId,
        });

      if (isAlreadyAcknowledged) {
        const incidentNumber: number | null =
          await IncidentService.getIncidentNumber({
            incidentId: incidentId,
          });

        // send a message to the channel visible to user, that the incident has already been acknowledged.
        const markdwonPayload: WorkspacePayloadMarkdown = {
          _type: "WorkspacePayloadMarkdown",
          text: `@${slackUsername}, unfortunately you cannot acknowledge the **[Incident ${incidentNumber?.toString()}](${await IncidentService.getIncidentLinkInDashboard(slackRequest.projectId!, incidentId)})**. It has already been acknowledged.`,
        };

        await SlackUtil.sendDirectMessageToUser({
          messageBlocks: [markdwonPayload],
          authToken: projectAuthToken,
          workspaceUserId: slackRequest.slackUserId!,
        });

        return;
      }

      await IncidentService.acknowledgeIncident(incidentId, userId);

      // Incident Feed will send a message to the channel that the incident has been Acknowledged.
      return;
    }

    // invlaid action type.
    return Response.sendErrorResponse(
      req,
      res,
      new BadDataException("Invalid Action Type")
    );
  }

  public static async resolveIncident(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { slackRequest, req, res } = data;
    const { botUserId, userId, projectAuthToken, slackUsername } = slackRequest;

    const { actionValue } = data.action;

    if (!actionValue) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Incident ID")
      );
    }

    if (!userId) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid User ID")
      );
    }

    if (!projectAuthToken) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Project Auth Token")
      );
    }

    if (!botUserId) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Bot User ID")
      );
    }

    if (data.action.actionType === SlackActionType.ResolveIncident) {
      const incidentId: ObjectID = new ObjectID(actionValue);

      // We send this early let slack know we're ok. We'll do the rest in the background.
      Response.sendJsonObjectResponse(req, res, {
        response_action: "clear",
      });

      const isAlreadyResolved: boolean =
        await IncidentService.isIncidentResolved({
          incidentId: incidentId,
        });

      if (isAlreadyResolved) {
        const incidentNumber: number | null =
          await IncidentService.getIncidentNumber({
            incidentId: incidentId,
          });
        // send a message to the channel visible to user, that the incident has already been Resolved.
        const markdwonPayload: WorkspacePayloadMarkdown = {
          _type: "WorkspacePayloadMarkdown",
          text: `@${slackUsername}, unfortunately you cannot resolve the **[Incident ${incidentNumber?.toString()}](${await IncidentService.getIncidentLinkInDashboard(slackRequest.projectId!, incidentId)})**. It has already been resolved.`,
        };

        await SlackUtil.sendDirectMessageToUser({
          messageBlocks: [markdwonPayload],
          authToken: projectAuthToken,
          workspaceUserId: slackRequest.slackUserId!,
        });

        return;
      }

      await IncidentService.resolveIncident(incidentId, userId);

      return;
    }

    // invlaid action type.
    return Response.sendErrorResponse(
      req,
      res,
      new BadDataException("Invalid Action Type")
    );
  }

  public static async viewExecuteOnCallPolicy(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { req, res } = data;
    const { actionValue } = data.action;

    if (!actionValue) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Incident ID")
      );
    }

    // We send this early let slack know we're ok. We'll do the rest in the background.
    Response.sendJsonObjectResponse(req, res, {
      response_action: "clear",
    });

    // const incidentId: ObjectID = new ObjectID(actionValue);

    // send a modal with a dropdown that says "Public Note" or "Private Note" and a text area to add the note.

    const onCallPolicies: Array<OnCallDutyPolicy> =
      await OnCallDutyPolicyService.findBy({
        query: {
          projectId: data.slackRequest.projectId!,
        },
        select: {
          name: true,
        },
        props: {
          isRoot: true,
        },
        limit: LIMIT_PER_PROJECT,
        skip: 0,
      });

    const dropdownOption: Array<DropdownOption> = onCallPolicies
      .map((policy: OnCallDutyPolicy) => {
        return {
          label: policy.name || "",
          value: policy._id?.toString() || "",
        };
      })
      .filter((option: DropdownOption) => {
        return option.label !== "" || option.value !== "";
      });

    const onCallPolicyDropdown: WorkspaceDropdownBlock = {
      _type: "WorkspaceDropdownBlock",
      label: "On Call Policy",
      blockId: "onCallPolicy",
      placeholder: "Select On Call Policy",
      options: dropdownOption,
    };

    const modalBlock: WorkspaceModalBlock = {
      _type: "WorkspaceModalBlock",
      title: "Execute On Call Policy",
      submitButtonTitle: "Submit",
      cancelButtonTitle: "Cancel",
      actionId: SlackActionType.SubmitExecuteIncidentOnCallPolicy,
      actionValue: actionValue,
      blocks: [onCallPolicyDropdown],
    };

    await SlackUtil.showModalToUser({
      authToken: data.slackRequest.projectAuthToken!,
      modalBlock: modalBlock,
      triggerId: data.slackRequest.triggerId!,
    });
  }

  public static async viewChangeIncidentState(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { req, res } = data;
    const { actionValue } = data.action;

    if (!actionValue) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Incident ID")
      );
    }

    // We send this early let slack know we're ok. We'll do the rest in the background.
    Response.sendJsonObjectResponse(req, res, {
      response_action: "clear",
    });

    // const incidentId: ObjectID = new ObjectID(actionValue);

    // send a modal with a dropdown that says "Public Note" or "Private Note" and a text area to add the note.

    const incidentStates: Array<IncidentState> =
      await IncidentStateService.getAllIncidentStates({
        projectId: data.slackRequest.projectId!,
        props: {
          isRoot: true,
        },
      });

    logger.debug("Incident States: ");
    logger.debug(incidentStates);

    const dropdownOptions: Array<DropdownOption> = incidentStates
      .map((state: IncidentState) => {
        return {
          label: state.name || "",
          value: state._id?.toString() || "",
        };
      })
      .filter((option: DropdownOption) => {
        return option.label !== "" || option.value !== "";
      });

    logger.debug("Dropdown Options: ");
    logger.debug(dropdownOptions);

    const statePickerDropdown: WorkspaceDropdownBlock = {
      _type: "WorkspaceDropdownBlock",
      label: "Incident State",
      blockId: "incidentState",
      placeholder: "Select Incident State",
      options: dropdownOptions,
    };

    const modalBlock: WorkspaceModalBlock = {
      _type: "WorkspaceModalBlock",
      title: "Change Incident State",
      submitButtonTitle: "Submit",
      cancelButtonTitle: "Cancel",
      actionId: SlackActionType.SubmitChangeIncidentState,
      actionValue: actionValue,
      blocks: [statePickerDropdown],
    };

    await SlackUtil.showModalToUser({
      authToken: data.slackRequest.projectAuthToken!,
      modalBlock: modalBlock,
      triggerId: data.slackRequest.triggerId!,
    });
  }

  public static async submitChangeIncidentState(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { req, res } = data;
    const { actionValue } = data.action;

    if (!actionValue) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Incident ID")
      );
    }

    // We send this early let slack know we're ok. We'll do the rest in the background.
    Response.sendJsonObjectResponse(req, res, {
      response_action: "clear",
    });

    // const incidentId: ObjectID = new ObjectID(actionValue);

    // send a modal with a dropdown that says "Public Note" or "Private Note" and a text area to add the note.

    if (
      !data.slackRequest.viewValues ||
      !data.slackRequest.viewValues["incidentState"]
    ) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid View Values")
      );
    }

    const incidentId: ObjectID = new ObjectID(actionValue);
    const stateString: string =
      data.slackRequest.viewValues["incidentState"].toString();

    const stateId: ObjectID = new ObjectID(stateString);

    await IncidentService.updateOneById({
      id: incidentId,
      data: {
        currentIncidentStateId: stateId,
      },
      props: {
        userId: data.slackRequest.userId!,
      },
    });
  }

  public static async executeOnCallPolicy(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { slackRequest, req, res } = data;
    const { botUserId, userId, projectAuthToken, slackUsername } = slackRequest;

    const { actionValue } = data.action;

    if (!actionValue) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Incident ID")
      );
    }

    if (!userId) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid User ID")
      );
    }

    if (!projectAuthToken) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Project Auth Token")
      );
    }

    if (!botUserId) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Bot User ID")
      );
    }

    if (
      data.action.actionType ===
      SlackActionType.SubmitExecuteIncidentOnCallPolicy
    ) {
      const incidentId: ObjectID = new ObjectID(actionValue);

      // We send this early let slack know we're ok. We'll do the rest in the background.
      Response.sendJsonObjectResponse(req, res, {
        response_action: "clear",
      });

      const isAlreadyResolved: boolean =
        await IncidentService.isIncidentResolved({
          incidentId: incidentId,
        });

      if (isAlreadyResolved) {
        const incidentNumber: number | null =
          await IncidentService.getIncidentNumber({
            incidentId: incidentId,
          });
        // send a message to the channel visible to user, that the incident has already been Resolved.
        const markdwonPayload: WorkspacePayloadMarkdown = {
          _type: "WorkspacePayloadMarkdown",
          text: `@${slackUsername}, unfortunately you cannot execute the on call policy for **[Incident ${incidentNumber?.toString()}](${await IncidentService.getIncidentLinkInDashboard(slackRequest.projectId!, incidentId)})**. It has already been resolved.`,
        };

        await SlackUtil.sendDirectMessageToUser({
          messageBlocks: [markdwonPayload],
          authToken: projectAuthToken,
          workspaceUserId: slackRequest.slackUserId!,
        });

        return;
      }

      if (
        !data.slackRequest.viewValues ||
        !data.slackRequest.viewValues["onCallPolicy"]
      ) {
        return Response.sendErrorResponse(
          req,
          res,
          new BadDataException("Invalid View Values")
        );
      }

      const onCallPolicyString: string =
        data.slackRequest.viewValues["onCallPolicy"].toString();

      // get the on call policy id.
      const onCallPolicyId: ObjectID = new ObjectID(onCallPolicyString);

      await OnCallDutyPolicyService.executePolicy(onCallPolicyId, {
        triggeredByIncidentId: incidentId,
        userNotificationEventType: UserNotificationEventType.IncidentCreated,
      });
    }
  }

  public static async submitIncidentNote(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { req, res } = data;
    const { actionValue } = data.action;

    if (!actionValue) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Incident ID")
      );
    }

    // const incidentId: ObjectID = new ObjectID(actionValue);

    // send a modal with a dropdown that says "Public Note" or "Private Note" and a text area to add the note.

    // if view values is empty, then return error.

    if (!data.slackRequest.viewValues) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid View Values")
      );
    }

    if (!data.slackRequest.viewValues["noteType"]) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Note Type")
      );
    }

    if (!data.slackRequest.viewValues["note"]) {
      // return error.
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Note")
      );
    }

    const incidentId: ObjectID = new ObjectID(actionValue);
    const note: string = data.slackRequest.viewValues["note"].toString();
    const noteType: string =
      data.slackRequest.viewValues["noteType"].toString();

    if (noteType !== "public" && noteType !== "private") {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Note Type")
      );
    }

    // send empty response.
    Response.sendJsonObjectResponse(req, res, {
      response_action: "clear",
    });

    // if public note then, add a note.
    if (noteType === "public") {
      await IncidentPublicNoteService.addNote({
        incidentId: incidentId!,
        note: note || "",
        projectId: data.slackRequest.projectId!,
        userId: data.slackRequest.userId!,
      });
    }

    // if private note then, add a note.
    if (noteType === "private") {
      await IncidentInternalNoteService.addNote({
        incidentId: incidentId!,
        note: note || "",
        projectId: data.slackRequest.projectId!,
        userId: data.slackRequest.userId!,
      });
    }
  }

  public static async viewAddIncidentNote(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    const { req, res } = data;
    const { actionValue } = data.action;

    if (!actionValue) {
      return Response.sendErrorResponse(
        req,
        res,
        new BadDataException("Invalid Incident ID")
      );
    }

    // We send this early let slack know we're ok. We'll do the rest in the background.
    Response.sendJsonObjectResponse(req, res, {
      response_action: "clear",
    });

    // const incidentId: ObjectID = new ObjectID(actionValue);

    // send a modal with a dropdown that says "Public Note" or "Private Note" and a text area to add the note.

    const notePickerDropdown: WorkspaceDropdownBlock = {
      _type: "WorkspaceDropdownBlock",
      label: "Note Type",
      blockId: "noteType",
      placeholder: "Select Note Type",
      options: [
        {
          label: "Public Note (Will be posted on Status Page)",
          value: "public",
        },
        {
          label: "Private Note (Only visible to team members)",
          value: "private",
        },
      ],
    };

    const noteTextArea: WorkspaceTextAreaBlock = {
      _type: "WorkspaceTextAreaBlock",
      label: "Note",
      blockId: "note",
      placeholder: "Note",
      description: "Please type in plain text or markdown.",
    };

    const modalBlock: WorkspaceModalBlock = {
      _type: "WorkspaceModalBlock",
      title: "Add Note",
      submitButtonTitle: "Submit",
      cancelButtonTitle: "Cancel",
      actionId: SlackActionType.SubmitIncidentNote,
      actionValue: actionValue,
      blocks: [notePickerDropdown, noteTextArea],
    };

    await SlackUtil.showModalToUser({
      authToken: data.slackRequest.projectAuthToken!,
      modalBlock: modalBlock,
      triggerId: data.slackRequest.triggerId!,
    });
  }

  public static async handleIncidentAction(data: {
    slackRequest: SlackRequest;
    action: SlackAction;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<void> {
    // now we should be all set, project is authorized and user is authorized. Lets perform some actions based on the action type.
    const actionType: SlackActionType | undefined = data.action.actionType;

    if (actionType === SlackActionType.AcknowledgeIncident) {
      return await this.acknowledgeIncident(data);
    }

    if (actionType === SlackActionType.ResolveIncident) {
      return await this.resolveIncident(data);
    }

    if (actionType === SlackActionType.ViewAddIncidentNote) {
      return await this.viewAddIncidentNote(data);
    }

    if (actionType === SlackActionType.SubmitIncidentNote) {
      return await this.submitIncidentNote(data);
    }

    if (actionType === SlackActionType.ViewExecuteIncidentOnCallPolicy) {
      return await this.viewExecuteOnCallPolicy(data);
    }

    if (actionType === SlackActionType.SubmitExecuteIncidentOnCallPolicy) {
      return await this.executeOnCallPolicy(data);
    }

    if (actionType === SlackActionType.ViewChangeIncidentState) {
      return await this.viewChangeIncidentState(data);
    }

    if (actionType === SlackActionType.SubmitChangeIncidentState) {
      return await this.submitChangeIncidentState(data);
    }

    if (actionType === SlackActionType.NewIncident) {
      return await this.viewNewIncidentModal(data);
    }

    if (actionType === SlackActionType.SubmitNewIncident) {
      return await this.submitNewIncident(data);
    }

    if (actionType === SlackActionType.ViewIncident) {
      // do nothing. This is just a view incident action.
      // clear response.
      return Response.sendJsonObjectResponse(data.req, data.res, {
        response_action: "clear",
      });
    }

    // invalid action type.
    return Response.sendErrorResponse(
      data.req,
      data.res,
      new BadDataException("Invalid Action Type")
    );
  }
}
