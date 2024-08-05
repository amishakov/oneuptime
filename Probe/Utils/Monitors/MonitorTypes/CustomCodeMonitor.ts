import { PROBE_CUSTOM_CODE_MONITOR_SCRIPT_TIMEOUT_IN_MS } from "../../../Config";
import ReturnResult from "Common/Types/IsolatedVM/ReturnResult";
import CustomCodeMonitor from "Common/Types/Monitor/CustomCodeMonitor/CustomCodeMonitor";
import ObjectID from "Common/Types/ObjectID";
import logger from "CommonServer/Utils/Logger";
import VMRunner from "CommonServer/Utils/VM/VMRunner";

export interface CustomCodeMonitorOptions {
  monitorId?: ObjectID | undefined;
  script: string;
}

export default class CustomCodeMonitor {
  public static async execute(
    options: CustomCodeMonitorOptions,
  ): Promise<CustomCodeMonitor | null> {
    if (!options) {
      // this should never happen
      options = {
        script: "",
      };
    }

    const scriptResult: CustomCodeMonitor = {
      logMessages: [],
      scriptError: undefined,
      result: undefined,

      executionTimeInMS: 0,
    };

    try {
      let result: ReturnResult | null = null;

      try {
        const startTime: [number, number] = process.hrtime();

        result = await VMRunner.runCodeInSandbox({
          code: options.script,
          options: {
            timeout: PROBE_CUSTOM_CODE_MONITOR_SCRIPT_TIMEOUT_IN_MS,
            args: {},
          },
        });

        const endTime: [number, number] = process.hrtime(startTime);

        const executionTimeInMS: number =
          (endTime[0] * 1000000000 + endTime[1]) / 1000000;

        scriptResult.executionTimeInMS = executionTimeInMS;

        scriptResult.logMessages = result.logMessages;

        scriptResult.result = result?.returnValue?.data;
      } catch (err) {
        logger.error(err);
        scriptResult.scriptError =
          (err as Error)?.message || (err as Error).toString();
      }

      return scriptResult;
    } catch (err: unknown) {
      logger.error(err);
      scriptResult.scriptError =
        (err as Error)?.message || (err as Error).toString();
    }

    return scriptResult;
  }
}
