import { Provider } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";

export const TRANSFORM_ENTITY_LABEL_PROVIDER =
    "TRANSFORM_ENTITY_LABEL_PROVIDER";

export type TransformEntityLabel = {
    translate: (label: string, lang: string) => string;
};

export const TransformEntityLabelProvider: Provider = {
    provide: TRANSFORM_ENTITY_LABEL_PROVIDER,
    useFactory: (i18n: I18nService): TransformEntityLabel => {
        return {
            translate: (label: string, lang: string): string => {
                if (!label) {
                    return label;
                }
                const translated = i18n.t(`entity-field.${label}`, { lang });
                // If translation not found, nestjs-i18n returns the key itself
                // So we check if it starts with "entity-field." to detect missing translations
                if (
                    typeof translated === "string" &&
                    translated.startsWith("entity-field.")
                ) {
                    return label; // Return original label if no translation found
                }
                return translated as string;
            },
        };
    },
    inject: [I18nService],
};
