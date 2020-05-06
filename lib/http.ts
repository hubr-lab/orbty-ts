import Orbty, { Request, Response, Next, Handler, HttpException } from "orbty";
import { HandlerType, RouterDefinition, ControllerHandler } from "./controller";

interface HttpResponesOptions {

	/**
	* Define success custom default response HTTP status code
	*/
	responseStatus?: number;
}

/**
* Http handler sender
* Send
*/
export class HttpSender {


	/**
	 * Sends http sender
	 * @template T
	 * @param {Response} res - orbty.Response
	 * @param result - any HTTP response.
	 * @param {number} status - HTTP status code
	 * @param {HttpException} [error]
	 * @returns
	 */
	static send<T>(res: Response, result: T | null, status: number, error?: HttpException) {

		// Do not send case header has send manually
		if (res.headersSent) {
			return;
		}

		console.log({ error, result });

		if (error) {
			res.status(status).error(error);
		} else {
			res.status(status).send(result);
		}
	}
}


/**
 * Http sender error handler
 */
export class HttpErrorSender {

	/**
	 * Sends error
	 * @param {Response} res - orbty.Response
	 * @param {HttpException} error
	 */
	static sendError(res: Response, error: HttpException) {
		HttpSender.send(res, undefined, error.code, error);
	}
}

/**
 * Internal HTTP decorator function
 * Define all HttoHandler route methods
 * @param  {string} path
 * @param  {string} method
 * @returns MethodDecorator
 */
function httpDecorator(path: string, method: string, option?: HttpResponesOptions): MethodDecorator {
	return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {

		let contains = false;

		if (!target.routes) {
			target.routes = [] as RouterDefinition[];
		}

		target.routes.forEach((element: RouterDefinition, idx: number) => {
			if (element.method === key) {
				target.routes[idx] = {
					...element,
					httpMethod: method,
					path,
					httpStatusCode: option ? option.responseStatus : undefined
				}
				contains = true;
			}
		});

		if (!contains) {
			target.routes.push({
				httpMethod: method,
				method: key,
				path,
				httpStatusCode: option ? option.responseStatus : undefined,
				middlewares: []
			});
		}

		return descriptor;
	};
}

/** HTTP decoratos based on HTTP Methods */

/**
 * @decorator
 * Define GET HTTP Handler methods
 * Usage on method:
 * @Get("/path")
 * async myMethod(req: orbty.Request, res: orbty.Response) {}
 * @param  {string} path
 */
export function Get(path: string, options?: HttpResponesOptions) {
	return httpDecorator(path, HandlerType.get, options);
}

/**
 * @decorator
 * Define POST HTTP Handler methods
 * Usage on method:
 * @Post("/path")
 * async myControllerMethod(req: orbty.Request, res: orbty.Response) {}
 * @param  {string} path
 */
export function Post(path: string, options?: HttpResponesOptions) {
	return httpDecorator(path, HandlerType.post, options);
}

/**
 * @decorator
 * Define PUT HTTP Handler methods
 * Usage on method:
 * @Put("/path")
 * async myControllerMethod(req: orbty.Request, res: orbty.Response) {}
 * @param  {string} path
 */
export function Put(path: string, options?: HttpResponesOptions) {
	return httpDecorator(path, HandlerType.put, options);
}

/**
 * @decorator
 * Define DELETE HTTP Handler methods
 * Usage on method:
 * @Delete("/path")
 * async myControllerMethod(req: orbty.Request, res: orbty.Response) {}
 * @param  {string} path
 */
export function Delete(path: string, options?: HttpResponesOptions) {
	return httpDecorator(path, HandlerType.delete, options);
}

/**
 * @decorator
 * Define OPTIONS HTTP Handler methods
 * Usage on method:
 * @Options("/path")
 * async myControllerMethod(req: orbty.Request, res: orbty.Response) {}
 * @param  {string} path
 */
export function Options(path: string, options?: HttpResponesOptions) {
	return httpDecorator(path, HandlerType.options, options);
}

export function Use(...handlers: Handler[] | string[]): MethodDecorator {
	return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {

		let contains = false;

		if (!target.routes) {
			target.routes = [] as RouterDefinition[];
		}

		target.routes.forEach((element: RouterDefinition, idx: number) => {
			if (element.method === key) {
				if (!element.middlewares) {
					element.middlewares = [];
				}
				target.routes[idx] = {
					...element,
					middlewares: [
						...element.middlewares,
						...handlers
					]
				}
				contains = true;
			}
		});

		if (!contains) {
			target.routes.push({
				method: key,
				middlewares: handlers
			});
		}

		return descriptor;
	};
}

/**
 * @decorator
 * Define middleware authorize methods
 * Usage on class method:
 * @Authorize("/path")
 * async myMiddlewareMethod(req: orbty.Request, res: orbty.Response) {}
 *
 * Do not use orbty.Next.
 * @param  {string} path
 */
export function Authorize(path?: string) {
	return httpDecorator(path || "*", HandlerType.middleware);
}

class IHandler {
	[key: string]: Handler | any
}

/**
* Http handler performs roles-based http requests
* Execute HttpHandler defined class methods e send to
* client or exeucte HttpExceptions to response
*/
export class HttpHandler extends IHandler {

	router: Orbty;

	constructor () {
		super();
		this.router = new Orbty();
		this.router.use(Orbty.json());
	}


	/**
	 * Handlers exceptions
	 * @param {Response} res - orbty.Response
	 * @param err
	 */
	private handlerExceptions(res: Response, err: Error) {
		if (err instanceof Orbty.HttpException) {
			HttpErrorSender.sendError(res, err);
		} else {
			HttpErrorSender.sendError(res,
				new Orbty.HttpException("Service unavailable", 500)
			);
		}
	}


	/**
	 * Handlers response
	 * @param {Request} req- orbty.Request
	 * @param {Response} res - orbty.Response
	 * @param {NextFunction} next - orbty.NextFunction
	 * @param {RequestHandler} handler - Request handler function.
	 * @param method - execution method
	 */
	public async handlerResponse(
		req: Request,
		res: Response,
		next: Next,
		handler: ControllerHandler,
		route: RouterDefinition
	) {
		try {
			const result = await Object.getPrototypeOf(handler)[route.method](req, res, next);
			HttpSender.send(res, result, route.httpStatusCode || 200, undefined);
		} catch (err) {
			console.error(err);
			this.handlerExceptions(res, err);
		}
	}


	/**
	 * Checks http handler
	 * @param {Request} req- orbty.Request
	 * @param {Response} res - orbty.Response
	 * @param {NextFunction} next - orbty.NextFunction
	 * @param {RequestHandler} handler - Middleware function
	 */
	public async check(req: Request, res: Response, next: Next, handler: Handler) {
		try {
      await handler(req, res, next);
      next();
		} catch (err) {
			console.error(err);
			this.handlerExceptions(res, err);
		}
	}
}