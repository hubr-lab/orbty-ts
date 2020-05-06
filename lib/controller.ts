import { HttpHandler } from "./http";
import { Request, Response, Next, Handler } from "orbty";

export enum HandlerType {
	get = "get",
	post = "post",
	put = "put",
	delete = "delete",
	options = "options",
	middleware = "use"
}

export interface RouterDefinition {
	httpStatusCode?: number;
	httpMethod: HandlerType;
	method: string;
	path: string;
	notHandlerFormat?: boolean;
	middlewares: Handler[];
}

/**
 * @decorator
 * Decorator to set controller route path
 * Use @Controller() on controller class and define the route path
 * @param path
 */
export function Controller(path: string): ClassDecorator {
	return (target: any) => {
		target.path = path;
	};
}

/**
 * Automatically configure the routes
 * to be added and executed in the API.
 *
 * Each controller class must extend the
 * ControllerHandler and define
 * the route via @decorator @Controller
 *
 * All {HttpExeptions} will be automatically
 * treated in the application's routines
 *
 * You can use HTTP handler decorators in class
 * methods (@Get, @Post) to define your controller
 * routes and methods
 *
 * ex.:
 * @Controller("/myRouterPath")
 * class MyController extends HttpHandler {
 *
 *  @Get("/foo")
 *	async getMyFooBar(req: Orbty.Request, res: Orbty.Response) {
 *    return "bar"
 *  }
 * }
 */
export abstract class ControllerHandler extends HttpHandler {

	static path: string;
	static routes: RouterDefinition[];

	/**
	 * Get path method HTTP handler
	 * @param route
	 */
	private handler(route: RouterDefinition) {
		return async (req: Request, res: Response, next: Next) => {
			await this.handlerResponse(req, res, next, this, route);
		}
	}

	/**
	 * Get middleware HTTP handler
	 * @param handler
	 */
	private getMiddleware(handler: Handler) {
		return async (req: Request, res: Response, next: Next) => {
			await this.check(req, res, next, handler);
		}
	}

	/**
	 * Configs orbty routes
	 */
	public configRoutes() {
		const routes: RouterDefinition[] = Object.getPrototypeOf(this).routes || [];
		routes.forEach(route => {
			if (route.httpMethod === HandlerType.middleware) {
				this.router.use(
					route.path,
					...(route.middlewares.reverse().map(handler => this.getMiddleware(handler))),
					this.getMiddleware(Object.getPrototypeOf(this)[route.method])
				);
			} else {
				this.router[route.httpMethod](
					route.path,
					...(route.middlewares.reverse().map(handler => this.getMiddleware(handler))),
					this.handler(route)
				);
			}
		});
	}
}

export default Controller;