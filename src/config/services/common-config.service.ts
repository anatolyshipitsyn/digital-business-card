import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { commonConfig, type Environment } from '../namespaces/common.config';

/**
 * Typed access to the `common` namespace. Consumers get a `number` and a two-value union off a
 * service the container injects, not `string | undefined` off a global object.
 */
@Injectable()
export class CommonConfigService {
  constructor(
    @Inject(commonConfig.KEY)
    private readonly config: ConfigType<typeof commonConfig>,
  ) {}

  /**
   * The GraphQL module reads this at M4 to decide on Sandbox. It is the union and not `string`
   * on purpose: the schema already narrowed it to two values, and handing out `string` would make
   * that branch look as though a third case were possible.
   */
  get environment(): Environment {
    return this.config.environment;
  }

  get port(): number {
    return this.config.port;
  }
}
