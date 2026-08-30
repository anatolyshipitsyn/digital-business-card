import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ProfileResolver } from './profile.resolver';
import { ProfileService } from './profile.service';

/**
 * The card as a module. Its boundary is the aggregate: every child row cascades on delete and none
 * of them exists without a profile, so one module covers all five tables rather than inventing four
 * more that would each hold one three-line method.
 *
 * PrismaModule is imported here rather than inherited globally, so a second consumer of the
 * database would be a visible change to a module's imports.
 */
@Module({
  imports: [PrismaModule],
  providers: [ProfileService, ProfileResolver],
})
export class ProfileModule {}
