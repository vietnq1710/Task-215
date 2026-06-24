import * as Entity from "./common/entity";

type EntityValue = (typeof Entity)[keyof typeof Entity];

export { Entity, EntityValue };
