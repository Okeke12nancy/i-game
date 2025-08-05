import Joi from "joi";
import { Request, Response, NextFunction } from "express";
declare class ValidationMiddleware {
    validate(schema: Joi.ObjectSchema): (req: Request, res: Response, next: NextFunction) => void;
    schemas: {
        register: Joi.ObjectSchema<any>;
        login: Joi.ObjectSchema<any>;
        selectNumber: Joi.ObjectSchema<any>;
        dateFilter: Joi.ObjectSchema<any>;
    };
}
declare const _default: ValidationMiddleware;
export default _default;
//# sourceMappingURL=validateMiddleware.d.ts.map