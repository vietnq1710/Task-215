import { EntityDefinitionDto } from "@common/dto/entity-definition/entity-definition.dto";
import { ExportDefinitionDto } from "@common/dto/entity-definition/export-definition.dto";
import { ImportDefinitionDto } from "@common/dto/entity-definition/import-definition.dto";
import { Type } from "@nestjs/common";

const ENTITY_DEFINITION_KEY = "entity:definition";

type EntityDefinitionFieldProps = Omit<
    EntityDefinitionDto,
    "field" | "type" | "children"
>;

class EntityDefinitionLoader {
    private resolvePropertyTarget(definition: EntityDefinitionDto) {
        if (definition?.propertyTarget) {
            return definition.propertyTarget;
        }
        if (typeof definition?.propertyTargetGetter === "function") {
            return definition.propertyTargetGetter();
        }
        return undefined;
    }

    addDefinition = (target: any, definition: EntityDefinitionDto) => {
        const importList: EntityDefinitionDto[] =
            Reflect.getMetadata(ENTITY_DEFINITION_KEY, target.constructor) ||
            [];
        importList.push(definition);
        Reflect.defineMetadata(
            ENTITY_DEFINITION_KEY,
            importList,
            target.constructor,
        );
    };

    field(props: EntityDefinitionFieldProps) {
        return (target: any, propertyKey: string) => {
            const definePropertyTarget = Boolean(
                props?.propertyTarget || props?.propertyTargetGetter,
            );
            const propertyTarget =
                props?.propertyTarget ||
                Reflect.getMetadata("design:type", target, propertyKey);
            const definition: EntityDefinitionDto = {
                field: propertyKey,
                propertyTarget,
                definePropertyTarget,
                type: propertyTarget?.name,
                ...props,
            };
            if (definition.type === "Boolean") {
                definition.enum = definition.enum || [0, 1];
            }
            this.addDefinition(target, definition);
        };
    }

    getImportDefinition(entity: Type): ImportDefinitionDto[] {
        const res: EntityDefinitionDto[] =
            Reflect.getMetadata(ENTITY_DEFINITION_KEY, entity) || [];
        return res
            .filter((definition) => definition.disableImport !== true)
            .map((item, index) => ({ item, index }))
            .sort(
                (a, b) =>
                    (a.item.order || 0) - (b.item.order || 0) ||
                    a.index ||
                    b.index,
            )
            .map((item) => item.item)
            .map((definition) => {
                const importDefinition = { ...definition };
                delete importDefinition.disableImport;
                delete importDefinition.propertyTarget;
                delete importDefinition.propertyTargetGetter;
                return importDefinition;
            });
    }

    getExportDefinition(
        entity: Type,
        parentData: Pick<
            ExportDefinitionDto,
            "fields" | "labels" | "object"
        > & { level: number; maxLevel: number } = {
            fields: [],
            labels: [],
            level: 0,
            maxLevel: 3,
        },
    ): ExportDefinitionDto[] {
        const { level, maxLevel } = parentData;
        if (!entity || level >= maxLevel) {
            return [];
        }
        const definitions: EntityDefinitionDto[] =
            Reflect.getMetadata(ENTITY_DEFINITION_KEY, entity) || [];
        const res = definitions
            .filter((definition) => definition.disableExport !== true)
            .map((definition) => {
                const propertyTarget = this.resolvePropertyTarget(definition);
                const {
                    field,
                    label,
                    required,
                    type,
                    disableImport,
                    object,
                    hasMany,
                    definePropertyTarget,
                    hidden,
                } = definition;
                const fields = parentData.fields.concat(field);
                const labels = parentData.labels.concat(label);
                const children: ExportDefinitionDto[] =
                    this.getExportDefinition(propertyTarget, {
                        fields,
                        labels,
                        object,
                        level: level + 1,
                        maxLevel,
                    });
                const exportDefinition: ExportDefinitionDto = {
                    // field,
                    label,
                    fields,
                    labels,
                    required,
                    type: type || propertyTarget?.name,
                    children,
                    disableImport,
                    hasMany,
                    object,
                    hidden,
                };
                if (!definePropertyTarget || children?.length > 0) {
                    return exportDefinition;
                }
                return undefined;
            })
            .filter(Boolean);
        return res.length > 0 ? res : undefined;
    }

    getImportFields(entity: Type) {
        const importFields = EntityDefinition.getImportDefinition(entity).map(
            (def) => def.field,
        );
        return importFields;
    }
}

const EntityDefinition: EntityDefinitionLoader =
    global.EntityDefinition ||
    (global.EntityDefinition = new EntityDefinitionLoader());

export { EntityDefinition };
