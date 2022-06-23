import {num, obj, str} from 'json-schema-blocks'

export const publicEventSchemaProps = {
    id: num(),
    name: str(),
    description: str(),
    speakerName: str(),
    speakerTitle: str(),
    speakerAvatarUrl: str(),
    date: str(),
    timeFrom: str(),
    timeTo: str(),
    dateTimeFrom: str(),
    dateTimeTo: str(),
    accessType: str(),
    timezone: str(),
    amount: num(),
};

export const publicEventLinkSchema = obj({
    ...publicEventSchemaProps,
    publicEventLink: {
        uid: str()
    },
});
