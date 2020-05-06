Typescript Orbty
====================

Library dedicated to typescript that allows using [Orbty](https://www.npmjs.com/package/orbty) easily through decorators using simple syntax and supporting automatic HTTP validations.

## Get start

1. Define application drivers using decorators

```typescript

import { Controller, Get, Post, Use, ControllerHandler, Request, Response } from "orbty-ts";

function check(req: Request) {
  req.context = "checked";
}

@Controller("/main")
class MainController extends ControllerHandler {

  @Get("/:messageId")
  getMessage(req: Request) {
    return {
      id: req.params.messageId,
      message: "OK"
    };
  }

  @Post("/")
  @Use(check)
  createMessage({ body }: Request) {
    //~
    return "OK";
  }
}

```

2. Add controllers in the API

```typescript
import Orbty from "orbty-ts";
import MainController from "./controllers/Main";
import UserController from "./controllers/User";

const app = new Orbty();
const api = new Api(app);

api.setControllers([
  new MainController(),
  new UserController()
]);

api.listen(8000);

```


## Validation

Automatic support for HTTP validations is in the Data Transfer Object (DTO) layer. This layer must be a class containing the object's attributes accompanied by the decorators that define the type of validation. Internally the DTO uses decorators through the [class-validator](https://github.com/typestack/class-validator). More details in the [documentation](https://github.com/typestack/class-validator/blob/master/README.md).

```typescript
import { IsString, Length, ControllerHandler, Post, Body, Request } from "orbty-ts";

class PostDTO {

  @IsString()
  @Length(1, 15)
  title!: string;

  @Length(1, 50)
  content!: string;
}


class PostController extends ControllerHandler {

  @Post("/posts")
  @Body(PostDTO)
  createPost(req: Request) {
    // ~
    return req.body;
  }
}

```
In this example, if the body sent does not comply with the DTO, an error message will be sent in the body of the response along with an error in the request. In addition to ***@Body()*** decorator to validate the body, use ***@Param()*** to validate dynamic URL parameters and ***@Query()*** to validate values ​​sent via the URL.

## TODO

- Add license comments
- Add external libs license
- Tests
- Add complete documentation
