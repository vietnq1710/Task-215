export interface BaseEntity {
    _id: string;
    ma?: any;
    externalId?: string;
    tenantId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    dataPartitionCode?: string;
    createdById?: string;
    createdByUsername?: string;
    updatedById?: string;
    updatedByUsername?: string;
    deletedById?: string;
    deletedByUsername?: string;
    syncSessionId?: string;
}
