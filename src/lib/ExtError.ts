import {StatusCodes} from './StatusCodes'

export class ExtError extends Error {
    statusCode: StatusCodes;

    constructor(message?: string, statusCode?: StatusCodes) {
        super(message);
        this.statusCode = statusCode;
    }
}
