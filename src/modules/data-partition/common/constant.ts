import _ from "lodash";

export const DATA_PARTITION_FIELD = "dataPartitionCode";

export const combineConditions = <T = unknown>(
    condition: T,
    partitionCondition: unknown,
) => {
    const finalCondition = _.cloneDeep(condition || {});
    return Object.assign(finalCondition, partitionCondition);
};
