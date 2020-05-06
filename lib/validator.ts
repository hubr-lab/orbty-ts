import Orbty, { Request, Response, Next } from "orbty";
import { validate, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { ClassType } from "class-transformer/ClassTransformer";

interface IValidationRule {
	parseValidationError(validation: ValidationError[]): string;
	evaluate<T, V>(cls: ClassType<T>, plain: V, res: Response, next: Next): void;
}

/**
 * Validator handler is one automatically controller DTO validator
 * The handler receive request objects and checks basead
 * on DTO decorators rules based on class-validator
 * {@link https://github.com/typestack/class-validator/blob/master/README.md}
 */
class ValidatorHandler implements IValidationRule {

	static instance = new ValidatorHandler();

  /**
	 * Parse default class-validator white list propertie message
	 * @param {string} message defailt class-validator white list message
	 * @return parsed whtie list propertie message
	 */
	private getWhiteListPropertiesMessage(message: string) {
		const field = message.split(" ")[1];
		return `'${field}' não é uma propriedade esperada`;
	}
	/**
	 * Parses validation errors
	 * @param {ValidationError} validation
	 * @returns {string} string erros separated for ', '
	 */
	public parseValidationError(validation: ValidationError[]) {
		const constraints = validation.map(err => err.constraints);
		const messages: string[] = [];

		for (const constrain of constraints) {
			Object.keys(constrain).forEach(key => {
				if (key === "whitelistValidation") {
					messages.push(
						this.getWhiteListPropertiesMessage(constrain[key])
					);
				} else {
					messages.push(constrain[key]);
				}
			});
		}

		return messages.join(", ");
	}


	/**
	 * Evaluates validator handler
	 * @template T
	 * @template V
	 * @param cls - DTO class
	 * @param plain - object any to validation
	 */
	public async evaluate<T, V>(cls: ClassType<T>, plain: V) {
		const classFromPlain = plainToClass(cls, plain);
		const validation = await validate(classFromPlain, {
			forbidNonWhitelisted: true,
			whitelist: true
		});

		if (validation.length > 0) {
			throw new Orbty.HttpException(this.parseValidationError(validation), 400);
		}
	}
}

/**
 * Request body object validator
 */
export class BodyValidator extends ValidatorHandler {


	/**
	 * Validates body validator
	 * @template T
	 * @param cls - DTO class
	 * @param {Response} res - orbty.Request
	 */
	static async validate<T>(cls: ClassType<T>, { body }: Request) {
		await this.instance.evaluate(cls, body);
	}
}

/**
 * Request params object validator
 */
export class ParamsValidator extends ValidatorHandler {

	/**
	 * Validates params validator
	 * @template T
	 * @param cls - DTO class
	 * @param {Response} res - orbty.Request
	 */
	static async validate<T>(cls: ClassType<T>, { params }: Request) {
		await this.instance.evaluate(cls, params);
	}
}

/**
 * Request query object validator
 */
export class QueryValidator extends ValidatorHandler {

	/**
	 * Validates query validator
	 * @template T
	 * @param cls - DTO class
	 * @param {Response} res - orbty.Request
	 */
	static async validate<T>(cls: ClassType<T>, { query }: Request) {
		await this.instance.evaluate(cls, query);
	}
}

/**
 * @decorator
 * Use to set DTO request query auto validator
 *
 * @param  class - DTO class with validations decorators
 * ex.:
 * @Query(MyQueryDTO)
 * async myControllerMethod(req: orbty.Request, res: orbty.Response) {}
 */
export function Query<T>(cls: ClassType<T>): MethodDecorator {
	return (_target, _key: string | symbol, descriptor: PropertyDescriptor) => {

		const originalMethod = descriptor.value;

		descriptor.value = async function (request: Request, response: Response, next: Next) {
			await QueryValidator.validate(cls, request);
			return originalMethod.apply(this, [request, response, next]);
		};

		return descriptor;
	};
}

/**
 * @decorator
 * Use to set DTO request body auto validator
 *
 * @param  class - DTO class with validations decorators
 * ex.:
 * @Body(MyBodyDTO)
 * async myControllerMethod(req: orbty.Request, res: orbty.Response) {}
 */
export function Body<T>(cls: ClassType<T>): MethodDecorator {
	return (_target, _key: string | symbol, descriptor: PropertyDescriptor) => {

		const originalMethod = descriptor.value;

		descriptor.value = async function (request: Request, response: Response, next: Next) {
			await BodyValidator.validate(cls, request);
			return originalMethod.apply(this, [request, response, next]);
		};

		return descriptor;
	};
}

/**
 * @decorator
 * Use to set DTO request params auto validator
 *
 * @param  class - DTO class with validations decorators
 * ex.:
 * @Body(MyParamsDTO)
 * async myControllerMethod(req: orbty.Request, res: orbty.Response) {}
 */
export function Params<T>(cls: ClassType<T>): MethodDecorator {
	return (_target, _key: string | symbol, descriptor: PropertyDescriptor) => {

		const originalMethod = descriptor.value;

		descriptor.value = async function (request: Request, response: Response, next: Next) {
			await ParamsValidator.validate(cls, request);
			return originalMethod.apply(this, [request, response, next]);
		};

		return descriptor;
	};
}