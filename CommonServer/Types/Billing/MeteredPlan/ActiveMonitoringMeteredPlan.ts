import MeteredPlan from 'Common/Types/Billing/MeteredPlan';
import MeteredPlanUtil from './MeteredPlanUtil';
import ServerMeteredPlan from './ServerMeteredPlan';
import ObjectID from 'Common/Types/ObjectID';
import MonitorService from '../../../Services/MonitorService';
import QueryHelper from '../../Database/QueryHelper';
import MonitorType from 'Common/Types/Monitor/MonitorType';
import PositiveNumber from 'Common/Types/PositiveNumber';
import ProjectService from '../../../Services/ProjectService';
import BillingService from '../../../Services/BillingService';
import Project from 'Model/Models/Project';

export default class ActiveMonitoringMeteredPlan extends ServerMeteredPlan {
    public static override getMeteredPlan(): MeteredPlan {
        const meteredPlan: MeteredPlan =
            MeteredPlanUtil.getMeteredPlan('ACTIVE_MONITORING');
        this.meteredPlan = meteredPlan;
        return meteredPlan;
    }

    public static override async updateCurrentQuantity(
        projectId: ObjectID,
        options?: {
            meteredPlanSubscriptionId?: string | undefined;
        }
    ): Promise<PositiveNumber> {
        const count: PositiveNumber = await MonitorService.countBy({
            query: {
                projectId: projectId,
                monitorType: QueryHelper.notEquals(MonitorType.Manual),
            },
            props: {
                isRoot: true,
            },
        });

        // update this count in project as well.
        await ProjectService.updateOneById({
            id: projectId,
            data: {
                currentActiveMonitorsCount: count.toNumber(),
            },
            props: {
                isRoot: true,
            },
        });

        // update this count in project as well.
        const project: Project | null = await ProjectService.findOneById({
            id: projectId,
            select: {
                paymentProviderMeteredSubscriptionId: true,
                paymentProviderPlanId: true,
            },
            props: {
                isRoot: true,
            },
        });

        if (
            project &&
            (options?.meteredPlanSubscriptionId ||
                project.paymentProviderMeteredSubscriptionId) &&
            project.paymentProviderPlanId
        ) {
            await BillingService.addOrUpdateMeteredPricingOnSubscription(
                (options?.meteredPlanSubscriptionId as string) ||
                    (project.paymentProviderMeteredSubscriptionId as string),
                ActiveMonitoringMeteredPlan.getMeteredPlan(),
                count.toNumber()
            );
        }

        return count;
    }
}
