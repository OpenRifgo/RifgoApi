import {FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault} from 'fastify'

export type TRouter = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>
>;
