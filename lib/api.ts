
import { ControllerHandler } from "./controller";
import http from "http";
import Orbty from "orbty";

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