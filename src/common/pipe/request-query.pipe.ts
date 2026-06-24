import { ClientCommonQuery } from "@common/constant/class/client-common-query";
import { OperatorType } from "@common/constant/constant";
import { CommonQueryDto } from "@common/dto/common-query.dto";
import { FilterItemDto } from "@common/dto/filter-item.dto";
import { PopulationDto } from "@common/dto/population.dto";
import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

type ParsedJson = Record<string, unknown>;
type SafePrimitive = string | number | boolean | null;

const REQUEST_QUERY_FIELDS = new Set<keyof CommonQueryDto>([
    "select",
    "sort",
    "page",
    "limit",
    "skip",
    "filters",
    "population",
]);

const FILTER_FIELDS = new Set<keyof FilterItemDto>([
    "field",
    "operator",
    "values",
    "filters",
]);

const POPULATION_FIELDS = new Set<keyof PopulationDto>([
    "path",
    "condition",
    "required",
    "filter",
    "fields",
    "population",
    "hasMany",
    "softDelete",
]);

const SAFE_OPERATORS = new Set<string>(Object.values(OperatorType));

const isPlainObject = (value: unknown): value is ParsedJson =>
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;

const isSafePrimitive = (value: unknown): value is SafePrimitive =>
    value === null || ["string", "number", "boolean"].includes(typeof value);

const hasUnsafeKey = (key: string): boolean =>
    key.startsWith("$") || key.includes("$");

const isSafeKey = (key: string): boolean => {
    return key && !hasUnsafeKey(key);
};

const preserveAllowKeys = (
    value: ParsedJson,
    allowedKeys: Set<string>,
): void => {
    Object.keys(value).forEach((key) => {
        if (!isSafeKey(key) || !allowedKeys.has(key)) {
            delete value[key];
        }
    });
};

const assertSafeField = (field: unknown): void => {
    if (typeof field === "string") {
        isSafeKey(field);
        return;
    }
    if (
        Array.isArray(field) &&
        field.length > 0 &&
        field.every((item) => typeof item === "string")
    ) {
        field.forEach(isSafeKey);
        return;
    }
    throw new Error("Invalid query field");
};

const parseJsonObject = (value: string): ParsedJson => {
    const parsed: unknown = JSON.parse(value);
    if (!isPlainObject(parsed)) {
        throw new Error("Query value must be an object");
    }
    return parsed;
};

const parseJsonObjectArray = (value?: string | string[]): ParsedJson[] =>
    (Array.isArray(value) ? value : value ? [value] : []).map(parseJsonObject);

@Injectable()
export class RequestQueryPipe implements PipeTransform<
    ClientCommonQuery,
    Promise<CommonQueryDto>
> {
    private parseSelect(select?: string): CommonQueryDto["select"] {
        if (!select) {
            return undefined;
        }
        return select
            .split(/\s+/)
            .filter(Boolean)
            .reduce((selectOpts, field) => {
                const remove = field.startsWith("-");
                const newField = remove ? field.substring(1) : field;
                assertSafeField(newField);
                selectOpts[newField] = remove ? 0 : 1;
                return selectOpts;
            }, {});
    }

    private parseSort(sort?: string): CommonQueryDto["sort"] {
        const parsedSort = sort ? parseJsonObject(sort) : {};
        Object.entries(parsedSort).forEach(([field, direction]) => {
            assertSafeField(field);
            if (direction !== 1 && direction !== -1) {
                throw new Error("Invalid sort direction");
            }
        });
        if (!("_id" in parsedSort)) {
            Object.assign(parsedSort, { _id: -1 });
        }
        return parsedSort as CommonQueryDto["sort"];
    }

    private parseFilter(filter: ParsedJson): FilterItemDto {
        preserveAllowKeys(filter, FILTER_FIELDS);
        const operator = filter.operator;
        if (typeof operator !== "string" || !SAFE_OPERATORS.has(operator)) {
            throw new Error("Invalid filter operator");
        }

        if (operator === OperatorType.AND || operator === OperatorType.OR) {
            if (!Array.isArray(filter.filters)) {
                throw new Error("Invalid nested filters");
            }
            return {
                operator,
                filters: filter.filters.map((item) => {
                    if (!isPlainObject(item)) {
                        throw new Error("Invalid nested filter");
                    }
                    return this.parseFilter(item);
                }),
            } as FilterItemDto;
        }

        assertSafeField(filter.field);
        if (
            filter.values !== undefined &&
            (!Array.isArray(filter.values) ||
                !filter.values.every(isSafePrimitive))
        ) {
            throw new Error("Invalid filter values");
        }

        return {
            field: filter.field,
            operator,
            values: filter.values,
        } as FilterItemDto;
    }

    private parseCondition(condition: unknown): Record<string, unknown> {
        if (condition === undefined) {
            return undefined;
        }
        if (!isPlainObject(condition)) {
            throw new Error("Invalid population condition");
        }
        Object.entries(condition).forEach(([field, value]) => {
            assertSafeField(field);
            if (
                !isSafePrimitive(value) &&
                (!Array.isArray(value) || !value.every(isSafePrimitive))
            ) {
                throw new Error("Invalid population condition value");
            }
        });
        return condition;
    }

    private parseFields(fields: unknown): Record<string, 0 | 1> {
        if (fields === undefined) {
            return undefined;
        }
        if (!isPlainObject(fields)) {
            throw new Error("Invalid population fields");
        }
        Object.entries(fields).forEach(([field, value]) => {
            assertSafeField(field);
            if (value !== 0 && value !== 1) {
                throw new Error("Invalid population field option");
            }
        });
        return fields as Record<string, 0 | 1>;
    }

    private parsePopulation(item: ParsedJson): PopulationDto {
        preserveAllowKeys(item, POPULATION_FIELDS);
        assertSafeField(item.path);
        const booleanFields = ["required", "hasMany", "softDelete"];
        booleanFields.forEach((field) => {
            if (item[field] !== undefined && typeof item[field] !== "boolean") {
                throw new Error("Invalid population boolean option");
            }
        });
        if (
            item.filter !== undefined &&
            (!Array.isArray(item.filter) ||
                !item.filter.every((filter) => isPlainObject(filter)))
        ) {
            throw new Error("Invalid population filter");
        }
        if (
            item.population !== undefined &&
            (!Array.isArray(item.population) ||
                !item.population.every((population) =>
                    isPlainObject(population),
                ))
        ) {
            throw new Error("Invalid nested population");
        }

        return {
            path: item.path,
            condition: this.parseCondition(item.condition),
            required: item.required,
            filter: (item.filter as ParsedJson[])?.map((filter) =>
                this.parseFilter(filter),
            ),
            fields: this.parseFields(item.fields),
            population: (item.population as ParsedJson[])?.map((population) =>
                this.parsePopulation(population),
            ),
            hasMany: item.hasMany,
            softDelete: item.softDelete,
        } as PopulationDto;
    }

    async transform(value: ClientCommonQuery): Promise<CommonQueryDto> {
        const newValue: ClientCommonQuery = {};
        try {
            Object.keys(value || {}).forEach((key) => {
                isSafeKey(key);
                if (REQUEST_QUERY_FIELDS.has(key as keyof CommonQueryDto)) {
                    newValue[key] = value[key];
                }
            });
        } catch {
            throw new BadRequestException("Invalid client query");
        }

        const param = plainToClass(ClientCommonQuery, newValue);
        const errors = await validate(param);
        if (errors.length > 0) {
            throw new BadRequestException("Invalid client query");
        }

        const { select, sort, limit, page, skip, filters, population } =
            newValue;
        try {
            const parsedPage = page && parseInt(page, 10);
            const parsedLimit = limit && parseInt(limit, 10);
            const parsedSkip = skip && parseInt(skip, 10);
            const calculatedSkip =
                parsedSkip ??
                (parsedPage && parsedLimit && (parsedPage - 1) * parsedLimit);

            const parsedSelect = this.parseSelect(select);
            const parsedSort = this.parseSort(sort);

            const parsedFilters =
                parseJsonObjectArray(filters).map((filter) =>
                    this.parseFilter(filter),
                ) || [];
            const parsedPopulation =
                population &&
                parseJsonObjectArray(population).map((item) =>
                    this.parsePopulation(item),
                );
            const res: CommonQueryDto = {
                page: parsedPage,
                limit: parsedLimit,
                skip: calculatedSkip,
                select: parsedSelect,
                sort: parsedSort,
                filters: parsedFilters,
                population: parsedPopulation,
            };
            return res;
        } catch (err) {
            console.error(err);
            throw new BadRequestException("Error parsing client query");
        }
    }
}
