
import { ControllerHandler } from "./controller";
import http from "http";
import Orbty from "orbty";

/**
 * Http exception
 * HTTP Exception error.
 * @constructor
 * @param {string} message - HTTP error message
 * @param {number} [number] - HTTP code status
 */
export class HttpException extends Error {
  public status: number;
  public message: string;
  public name: string;

  constructor(message: string, status?: number) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    this.status = status || 500;
    this.message = message;
  }
}


/**
 * Api class. Implements orbty HTTP API
 * Auto transform controllers handler in orbty HTTP routers
 * @constructor
 * @param {ControllerHandler} controllerr
 */
export class Api {
  private app: Orbty;
  private controllers: ControllerHandler[];

  constructor(app: Orbty, controllers?: ControllerHandler[]) {
    this.app = app;
    this.controllers = controllers || [];
  }

  /**
   * Sets controllers on API.
   * This method overwrites all current controllers
   * @param {ControllerHandler} controllers
   */
  public setControllers(controllers: ControllerHandler[]) {
    this.controllers = controllers;
    return this;
  }

  /**
   * Add one controller on API
   * @param {ControllerHandler} controller
   */
  public addController(controller: ControllerHandler) {
    this.controllers.push(controller);
    return this;
  }


  /**
   * Listen API server
   * @param {number/string} [port]
   */
  listen(port: number) {
    this.initControllers();
    http.createServer(this.app.server()).listen(port);
    return this;
  }


  /**
   * Gets controller configurated path
   * @param {ControllerHandler} controller
   * @returns {string}
   */
  private getControllerPath(controller: ControllerHandler): string {
    return (Object.getPrototypeOf(controller).constructor).path || "/";
  }


  /**
   * Inits Controller handlers
   */
  private initControllers() {
    this.controllers.forEach((controller) => {
      controller.configRoutes();
      this.app.use(this.getControllerPath(controller), controller.router);
    });
  }


  /**
   * Gets orbty application
   */
  public getApplication() {
    return this.app;
  }
}